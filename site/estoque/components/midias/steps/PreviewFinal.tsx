"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Button } from "@heroui/react"
import { CheckCircle2, Download, Loader2, Send, Sparkles } from "lucide-react"
import { StoryPreview } from "@/components/midias/preview/StoryPreview"
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

type Props = {
  vehicle: Vehicle
  mediaType: MediaType
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
  vehicle, mediaType, caption, hashtags, onChangeCaption, onBack, onSave, onDone,
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

  async function handleDownload() {
    const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
    if (!node) return

    setDownloading(true)
    setDownloadErr(null)
    try {
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, backgroundColor: "#0a0a0a", style: { borderRadius: "0px" } })
      const link = document.createElement("a")
      const slug = `${vehicle.brand}-${vehicle.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      link.download = `${mediaType}-${slug}.png`
      link.href = dataUrl
      link.click()
    } catch {
      setDownloadErr("Não consegui gerar a imagem. Tenta de novo.")
    }
    setDownloading(false)
  }

  async function captureArtImages(): Promise<string[]> {
    if (mediaType === "story") {
      const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
      if (!node) throw new Error("Preview do Story não encontrado")
      return [await toPng(node, { pixelRatio: 3, cacheBust: true, backgroundColor: "#0a0a0a", style: { borderRadius: "0px" } })]
    }

    const nodes = hiddenSlidesRef.current?.querySelectorAll(".media-preview") ?? []
    const dataUrls: string[] = []
    for (const node of Array.from(nodes)) {
      dataUrls.push(await toPng(node as HTMLElement, { pixelRatio: 3, cacheBust: true, backgroundColor: "#0a0a0a", style: { borderRadius: "0px" } }))
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
        {mediaType === "story" && <StoryPreview vehicle={vehicle} />}
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
