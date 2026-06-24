"use client"

import { useState } from "react"
import { Button } from "@heroui/react"
import { CheckCircle2, Download, Loader2, Send } from "lucide-react"
import { StoryPreview } from "@/components/midias/preview/StoryPreview"
import { PostPreview } from "@/components/midias/preview/PostPreview"
import { CarouselPreview, PhotoSlide } from "@/components/midias/preview/CarouselPreview"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { useArtCapture } from "@/lib/midias/useArtCapture"
import { createGeneratedMedia } from "@/lib/actions/media"
import { postToInstagram } from "@/lib/actions/instagram"
import { logAiAction } from "@/lib/actions/aiCommands"
import { getDimensionsForType } from "@/lib/midias/dimensoes"
import { MEDIA_TYPE_CFG } from "@/lib/constants"
import type { MediaPreviewParams } from "@/lib/ai/types"
import type { Vehicle } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT   = "#ffffff"
const SUCCESS = "#25d366"

type Props = {
  preview: MediaPreviewParams
  vehicle: Vehicle
}

export function MediaPreviewCard({ preview, vehicle }: Props) {
  const previewVehicle: Vehicle = { ...vehicle, images: preview.photos }

  const {
    previewWrapRef, hiddenSlidesRef, downloading, downloadErr,
    handleDownload, captureArtImages, uploadArtImages,
  } = useArtCapture(preview.mediaType, previewVehicle)

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const [showPostConfirm, setShowPostConfirm] = useState(false)
  const [posting,    setPosting]    = useState(false)
  const [postErr,    setPostErr]    = useState<string | null>(null)
  const [postedLink, setPostedLink] = useState<string | null>(null)

  const canAutoPost = preview.mediaType === "story" || preview.mediaType === "carousel"

  async function handleSave() {
    setSaving(true)
    setSaveErr(null)
    const dimensions = getDimensionsForType(preview.mediaType)
    const result = await createGeneratedMedia({
      vehicleId: preview.vehicleId,
      vehicleModel: vehicle.model || vehicle.name,
      mediaType: preview.mediaType,
      title: `${MEDIA_TYPE_CFG[preview.mediaType].label} ${vehicle.brand} ${vehicle.name}`.trim(),
      previewData: { layout: `instagram-${preview.mediaType}-v1` },
      caption: preview.caption,
      hashtags: preview.hashtags,
      dimensions,
    })
    setSaving(false)
    if (!result.media) {
      setSaveErr(result.error ?? "Erro ao salvar mídia")
      return
    }
    setSaved(true)
  }

  async function handlePostInstagram() {
    setPosting(true)
    setPostErr(null)
    try {
      const dataUrls = await captureArtImages()
      const publicUrls = await uploadArtImages(dataUrls)
      const result = await postToInstagram({
        images: publicUrls,
        caption: preview.caption,
        mediaType: preview.mediaType === "story" ? "story" : "carousel",
      })
      if (result.error) {
        setPostErr(result.error)
        await logAiAction("publicarInstagram", preview.vehicleId, { mediaType: preview.mediaType, vehicleLabel: preview.vehicleLabel }, "error", result.error)
      } else {
        setPostedLink(result.permalink)
        setShowPostConfirm(false)
        await logAiAction("publicarInstagram", preview.vehicleId, { mediaType: preview.mediaType, vehicleLabel: preview.vehicleLabel, permalink: result.permalink }, "success", null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao publicar no Instagram"
      setPostErr(message)
      await logAiAction("publicarInstagram", preview.vehicleId, { mediaType: preview.mediaType, vehicleLabel: preview.vehicleLabel }, "error", message)
    }
    setPosting(false)
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}>
      <p className="text-[12px] font-bold" style={{ color: TEXT }}>
        Prévia — {MEDIA_TYPE_CFG[preview.mediaType].label} · {preview.vehicleLabel}
      </p>

      <div ref={previewWrapRef} className="flex justify-center" style={{ maxWidth: 220, margin: "0 auto" }}>
        {preview.mediaType === "story" && <StoryPreview vehicle={previewVehicle} />}
        {preview.mediaType === "post" && <PostPreview vehicle={previewVehicle} />}
        {preview.mediaType === "carousel" && <CarouselPreview vehicle={previewVehicle} />}
      </div>

      {preview.mediaType === "carousel" && (
        <div ref={hiddenSlidesRef} style={{ position: "fixed", top: 0, left: "-9999px", pointerEvents: "none" }} aria-hidden>
          {preview.photos.map((src, i) => (
            <div key={i} className="media-preview carousel-slide">
              <PhotoSlide src={src} />
            </div>
          ))}
        </div>
      )}

      {saveErr && <p className="text-[12px]" style={{ color: "#ff6b6b" }}>{saveErr}</p>}
      {downloadErr && <p className="text-[12px]" style={{ color: "#ff6b6b" }}>{downloadErr}</p>}
      {postErr && <p className="text-[12px]" style={{ color: "#ff6b6b" }}>Falha ao publicar: {postErr}</p>}

      {saved && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", color: SUCCESS }}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Mídia salva na Central de Mídias.
        </div>
      )}
      {postedLink && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", color: SUCCESS }}>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Publicado!{" "}
          <a href={postedLink} target="_blank" rel="noopener noreferrer" className="underline">Ver post</a>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Button variant="outline" size="sm" className="font-semibold" onPress={handleDownload} isDisabled={downloading}>
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Baixar
        </Button>
        {!saved && (
          <Button variant="outline" size="sm" className="font-semibold" onPress={handleSave} isPending={saving}>
            Salvar mídia
          </Button>
        )}
        {canAutoPost && !postedLink && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="font-semibold bg-linear-to-tr! from-[#feda75]! via-[#d62976]! to-[#4f5bd5]!"
            onPress={() => setShowPostConfirm(true)}
            isDisabled={posting}
          >
            <Send className="w-3.5 h-3.5" />
            Postar no Instagram
          </Button>
        )}
      </div>

      <ConfirmModal
        open={showPostConfirm}
        onClose={() => setShowPostConfirm(false)}
        onConfirm={handlePostInstagram}
        title="Postar no Instagram"
        description={`Vou gerar a arte e publicar no Instagram da loja agora. Essa ação é imediata e pública — não dá pra desfazer por aqui.${posting ? " Publicando…" : ""}`}
        confirmLabel={posting ? "Publicando…" : "Sim, postar agora"}
        danger
      />
    </div>
  )
}
