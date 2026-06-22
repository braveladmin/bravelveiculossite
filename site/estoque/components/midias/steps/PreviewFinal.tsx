"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Button } from "@heroui/react"
import { CheckCircle2, Download, Loader2, Sparkles } from "lucide-react"
import { StoryPreview } from "@/components/midias/preview/StoryPreview"
import { PostPreview } from "@/components/midias/preview/PostPreview"
import { CarouselPreview } from "@/components/midias/preview/CarouselPreview"
import { Switch } from "@/components/ui/Switch"
import type { MediaType, Vehicle } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"
const MUTED  = "#777777"
const SUCCESS = "#25d366"

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
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState<string | null>(null)

  async function handleDownload() {
    const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
    if (!node) return

    setDownloading(true)
    setDownloadErr(null)
    try {
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true })
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-[420px] shrink-0" ref={previewWrapRef}>
        {mediaType === "story" && <StoryPreview vehicle={vehicle} />}
        {mediaType === "post" && <PostPreview vehicle={vehicle} />}
        {mediaType === "carousel" && <CarouselPreview vehicle={vehicle} />}
      </div>

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

        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: SUCCESS }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Mídia salva. {mediaType === "carousel" ? "Baixe cada slide pra postar (navegue pelas setas do preview)." : "Baixe a imagem pra postar."}
          </div>
        )}

        {downloadErr && (
          <p className="text-[13px]" style={{ color: "#ff6b6b" }}>{downloadErr}</p>
        )}

        <div className="flex gap-2 justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
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
              <Button type="button" variant="primary" size="sm" className="font-semibold" onPress={onDone}>
                Ir pra Central de Mídias
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
