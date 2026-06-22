"use client"

import { Button } from "@heroui/react"
import { StoryPreview } from "@/components/midias/preview/StoryPreview"
import { PostPreview } from "@/components/midias/preview/PostPreview"
import { CarouselPreview } from "@/components/midias/preview/CarouselPreview"
import type { MediaType, Vehicle } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"
const MUTED  = "#777777"

type Props = {
  vehicle: Vehicle
  mediaType: MediaType
  carouselRaw?: boolean
  caption: string
  hashtags: string[]
  onChangeCaption: (caption: string) => void
  onBack: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}

export function PreviewFinal({ vehicle, mediaType, carouselRaw, caption, hashtags, onChangeCaption, onBack, onSave, saving, error }: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-[420px] shrink-0">
        {mediaType === "story" && <StoryPreview vehicle={vehicle} />}
        {mediaType === "post" && <PostPreview vehicle={vehicle} />}
        {mediaType === "carousel" && <CarouselPreview vehicle={vehicle} raw={carouselRaw} />}
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

        {error && (
          <p className="text-[13px]" style={{ color: "#ff6b6b" }}>{error}</p>
        )}

        <div className="flex gap-2 justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <Button type="button" variant="outline" size="sm" onPress={onBack} className="font-semibold" isDisabled={saving}>
            Voltar
          </Button>
          <Button type="button" variant="primary" size="sm" onPress={onSave} className="font-semibold" isPending={saving}>
            Salvar mídia
          </Button>
        </div>
      </div>
    </div>
  )
}
