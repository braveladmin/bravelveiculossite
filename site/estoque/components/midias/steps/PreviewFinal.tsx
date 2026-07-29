"use client"

import { useRef, useState } from "react"
import { toPng, toBlob } from "html-to-image"
import JSZip from "jszip"
import { Button } from "@heroui/react"
import { CheckCircle2, Download, Loader2, Send, Sparkles } from "lucide-react"
import { StoryPreview } from "@/components/midias/preview/StoryPreview"
import { StoryCollagePreview } from "@/components/midias/preview/StoryCollagePreview"
import { PostPreview } from "@/components/midias/preview/PostPreview"
import { CarouselPreview, PhotoSlide } from "@/components/midias/preview/CarouselPreview"
import { Switch } from "@/components/ui/Switch"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { createClient } from "@/lib/supabase/client"
import { postToInstagram } from "@/lib/actions/instagram"
import type { MediaType, Vehicle } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"
const MUTED  = "#777777"
const SUCCESS = "#25d366"
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

// cacheBust removido: as imagens são pré-convertidas para data URIs via proxy antes
// da captura — cacheBust forçaria re-fetch cross-origin interno do html-to-image e
// quebraria imagens em iOS/Safari (canvas tainted = área preta).
const EXPORT_OPTIONS = { pixelRatio: 4, backgroundColor: "#0a0a0a", style: { borderRadius: "0px" } } as const

async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts) await document.fonts.ready
}

function waitFrames(n = 2): Promise<void> {
  return new Promise(resolve => {
    let count = 0
    const tick = () => { if (++count >= n) resolve(); else requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
}

type Props = {
  vehicle: Vehicle
  mediaType: MediaType
  /** Quando mediaType é "story", define se usa o layout único (1 foto) ou a colagem de 3 fotos. */
  storyCollage?: boolean
  caption: string
  hashtags: string[]
  onChangeCaption: (caption: string) => void
  onBack: () => void
  onSave: () => void
  onDone: () => void
  onToggleNewBadge: (value: boolean) => void
  updatingNewBadge: boolean
  saving: boolean
  saved: boolean
  error: string | null
}

export function PreviewFinal({
  vehicle, mediaType, storyCollage = false, caption, hashtags, onChangeCaption, onBack, onSave, onDone,
  onToggleNewBadge, updatingNewBadge, saving, saved, error,
}: Props) {
  const previewWrapRef  = useRef<HTMLDivElement>(null)
  const hiddenSlidesRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState<string | null>(null)

  const [showPostConfirm, setShowPostConfirm] = useState(false)
  const [posting,         setPosting]         = useState(false)
  const [postErr,         setPostErr]         = useState<string | null>(null)
  const [postedLink,      setPostedLink]      = useState<string | null>(null)

  const canAutoPost = mediaType === "story" || mediaType === "carousel"
  const carouselSlides = vehicle.images?.length
    ? vehicle.images
    : [vehicle.imageUrl || PLACEHOLDER_IMAGE]

  // Converte todas as <img> do nó para data URIs via proxy server-side.
  // O proxy é same-origin — sem CORS, sem canvas tainted, sem área preta no iOS.
  async function inlineImagesAsBase64(node: HTMLElement): Promise<() => void> {
    const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
    const restores: Array<() => void> = []
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute("src") ?? ""
      if (!src || src.startsWith("data:")) return
      try {
        // URLs relativas (logo same-origin) usadas diretamente; externas passam pelo proxy
        const fetchUrl = src.startsWith("/") ? src : `/admin/api/image-proxy?url=${encodeURIComponent(src)}`
        const res  = await fetch(fetchUrl)
        if (!res.ok) return
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload  = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        const prev = img.getAttribute("src")!
        img.setAttribute("src", dataUrl)
        restores.push(() => img.setAttribute("src", prev))
        try { await img.decode() } catch { /* ok */ }
      } catch { /* mantém src original */ }
    }))
    return () => restores.forEach(fn => fn())
  }

  // Decodifica todas as imgs e faz upload de textura na GPU antes de capturar.
  // img.decode() coloca a imagem na CPU; drawImage() num canvas 2×2 faz o upload para
  // GPU — essencial no iOS/Safari que não renderiza imgs em SVG foreignObject sem
  // textura na GPU, mesmo com data URIs corretos.
  async function waitForImageDecode(node: HTMLElement): Promise<void> {
    const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
    const offscreen = document.createElement("canvas")
    offscreen.width = 2
    offscreen.height = 2
    const ctx = offscreen.getContext("2d")
    await Promise.all(imgs.map(async img => {
      try {
        await img.decode()
        if (ctx) ctx.drawImage(img, 0, 0, 2, 2)
      } catch { /* ok */ }
    }))
  }

  // No iOS o atributo "download" é ignorado pelo Safari — usa Web Share API
  // pra abrir o menu nativo de compartilhamento/salvar. Em outros navegadores
  // usa o fluxo normal com createObjectURL.
  async function triggerDownload(blob: Blob, filename: string) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const file  = new File([blob], filename, { type: blob.type })
    if (isIOS && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
    } else {
      const url  = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = filename
      link.href     = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }
  }

  // Captura o nó como Blob: inline → decode GPU → warmup → capture.
  async function captureNode(node: HTMLElement): Promise<Blob> {
    const cleanup = await inlineImagesAsBase64(node)
    try {
      await waitForImageDecode(node)
      await toPng(node, EXPORT_OPTIONS) // aquecimento: carrega fontes e SVG masks
      await waitFrames(2)
      const blob = await toBlob(node, EXPORT_OPTIONS)
      if (!blob) throw new Error("Captura retornou vazia")
      return blob
    } finally {
      cleanup()
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setDownloadErr(null)
    const slug = `${vehicle.brand}-${vehicle.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    try {
      await waitForFonts()
      if (mediaType === "carousel") {
        const nodes = Array.from(hiddenSlidesRef.current?.querySelectorAll(".media-preview") ?? [])
        const zip = new JSZip()
        for (let i = 0; i < nodes.length; i++) {
          const blob   = await captureNode(nodes[i] as HTMLElement)
          const buffer = await blob.arrayBuffer()
          zip.file(`carousel-${slug}-${i + 1}.png`, buffer)
        }
        const zipBlob = await zip.generateAsync({ type: "blob" })
        await triggerDownload(zipBlob, `carousel-${slug}.zip`)
      } else {
        const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
        if (!node) return
        const blob = await captureNode(node)
        await triggerDownload(blob, `${mediaType}-${slug}.png`)
      }
    } catch {
      setDownloadErr("Não consegui gerar a imagem. Tenta de novo.")
    }
    setDownloading(false)
  }

  // Para o upload no Instagram, converte o Blob para data URL (uploadArtImages espera strings)
  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  async function captureArtImages(): Promise<string[]> {
    await waitForFonts()
    if (mediaType === "story") {
      const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
      if (!node) throw new Error("Preview do Story não encontrado")
      return [await blobToDataUrl(await captureNode(node))]
    }
    const nodes = Array.from(hiddenSlidesRef.current?.querySelectorAll(".media-preview") ?? [])
    const dataUrls: string[] = []
    for (const node of nodes) {
      dataUrls.push(await blobToDataUrl(await captureNode(node as HTMLElement)))
    }
    return dataUrls
  }

  async function uploadArtImages(dataUrls: string[]): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < dataUrls.length; i++) {
      const blob = await (await fetch(dataUrls[i])).blob()
      const path = `instagram-posts/${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.png`
      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(path, blob, { contentType: "image/png" })
      if (uploadError) throw new Error(uploadError.message)
      const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handlePostInstagram() {
    setPosting(true)
    setPostErr(null)
    try {
      const dataUrls = await captureArtImages()
      const publicUrls = await uploadArtImages(dataUrls)
      const result = await postToInstagram({
        images: publicUrls,
        caption,
        mediaType: mediaType === "story" ? "story" : "carousel",
      })
      if (result.error) {
        setPostErr(result.error)
      } else {
        setPostedLink(result.permalink)
        setShowPostConfirm(false)
      }
    } catch (err) {
      setPostErr(err instanceof Error ? err.message : "Erro ao publicar no Instagram")
    }
    setPosting(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-[420px] shrink-0" ref={previewWrapRef}>
        {mediaType === "story" && storyCollage && <StoryCollagePreview vehicle={vehicle} />}
        {mediaType === "story" && !storyCollage && <StoryPreview vehicle={vehicle} />}
        {mediaType === "post" && <PostPreview vehicle={vehicle} />}
        {mediaType === "carousel" && <CarouselPreview vehicle={vehicle} />}
      </div>

      {/* Slides escondidos — só pra capturar todas as fotos do carrossel na hora de postar */}
      {mediaType === "carousel" && (
        <div ref={hiddenSlidesRef} style={{ position: "fixed", top: 0, left: "-9999px", pointerEvents: "none" }} aria-hidden>
          {carouselSlides.map((src, i) => (
            <div key={i} className="media-preview carousel-slide">
              <PhotoSlide src={src} />
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-4">
        {mediaType !== "story" && (
          <>
            <div>
              <label className="block text-[10px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ color: MUTED }}>
                Legenda final — editável
              </label>
              <textarea
                value={caption}
                onChange={(e) => onChangeCaption(e.target.value)}
                rows={12}
                style={{
                  backgroundColor: SURF2, border: `1px solid ${BORDER}`, color: TEXT,
                  borderRadius: "10px", padding: "14px", fontSize: "13px", outline: "none",
                  width: "100%", resize: "vertical", lineHeight: "1.6",
                }}
              />
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(204,17,17,0.1)", color: ACCENT, border: "1px solid rgba(204,17,17,0.2)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {mediaType === "story" && !saved && (
          <div
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: vehicle.isNew ? "rgba(204,17,17,0.08)" : SURF2, border: `1px solid ${vehicle.isNew ? "rgba(204,17,17,0.3)" : BORDER}` }}
          >
            <div>
              <p className="text-[13px] font-semibold flex items-center" style={{ color: vehicle.isNew ? ACCENT : TEXT }}>
                <Sparkles className="inline w-4 h-4 mr-1.5" />
                Selo &quot;Novidade no estoque&quot;
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Mostra a tag no topo da arte do Story</p>
            </div>
            <Switch value={vehicle.isNew} onChange={onToggleNewBadge} activeColor={ACCENT} disabled={updatingNewBadge} />
          </div>
        )}

        {error && (
          <p className="text-[13px]" style={{ color: "#ff6b6b" }}>{error}</p>
        )}

        {saved && !postedLink && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: SUCCESS }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Mídia salva. {canAutoPost ? "Poste direto no Instagram ou baixe a arte." : "Baixe a imagem pra postar."}
          </div>
        )}

        {postedLink && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: SUCCESS }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Publicado no Instagram!{" "}
            <a href={postedLink} target="_blank" rel="noopener noreferrer" className="underline">Ver post</a>
          </div>
        )}

        {downloadErr && (
          <p className="text-[13px]" style={{ color: "#ff6b6b" }}>{downloadErr}</p>
        )}

        {postErr && (
          <p className="text-[13px]" style={{ color: "#ff6b6b" }}>Falha ao publicar: {postErr}</p>
        )}

        <div className="flex flex-wrap gap-2 justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          {!saved && (
            <>
              <Button type="button" variant="outline" size="sm" onPress={onBack} className="font-semibold" isDisabled={saving}>
                Voltar
              </Button>
              <Button type="button" variant="primary" size="sm" onPress={onSave} className="font-semibold" isPending={saving}>
                Salvar mídia
              </Button>
            </>
          )}
          {saved && (
            <>
              <Button type="button" variant="outline" size="sm" className="font-semibold" onPress={handleDownload} isDisabled={downloading}>
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Baixar imagem
              </Button>
              {canAutoPost && !postedLink && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="font-semibold bg-linear-to-tr! from-[#feda75]! via-[#d62976]! to-[#4f5bd5]!"
                  onPress={() => setShowPostConfirm(true)}
                  isDisabled={posting}
                >
                  <Send className="w-4 h-4" />
                  Postar no Instagram
                </Button>
              )}
              <Button type="button" variant="primary" size="sm" className="font-semibold" onPress={onDone}>
                Ir pra Central de Mídias
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showPostConfirm}
        onClose={() => setShowPostConfirm(false)}
        onConfirm={handlePostInstagram}
        title="Postar no Instagram"
        description={
          mediaType === "story"
            ? `Vou gerar a arte e publicar como Story no Instagram da Bravel agora. Essa ação é imediata e pública — não dá pra desfazer por aqui.${posting ? " Publicando…" : ""}`
            : `Vou gerar as ${carouselSlides.length} fotos do carrossel e publicar no feed do Instagram da Bravel agora, com a legenda ao lado. Essa ação é imediata e pública — não dá pra desfazer por aqui.${posting ? " Publicando…" : ""}`
        }
        confirmLabel={posting ? "Publicando…" : "Sim, postar agora"}
        danger
      />
    </div>
  )
}
