"use client"

import { Clapperboard, GalleryHorizontal, Image as ImageIcon } from "lucide-react"
import { STORY_DIMENSIONS, POST_DIMENSIONS, CAROUSEL_DIMENSIONS } from "@/lib/midias/dimensoes"
import type { MediaType } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"
const MUTED  = "#777777"

const FORMATOS: { type: MediaType; label: string; description: string; icon: typeof Clapperboard; dims: string }[] = [
  {
    type: "story",
    label: "Story",
    description: "Formato vertical pra Stories do Instagram",
    icon: Clapperboard,
    dims: `${STORY_DIMENSIONS.width}×${STORY_DIMENSIONS.height} · ${STORY_DIMENSIONS.aspectRatio}`,
  },
  {
    type: "post",
    label: "Post",
    description: "Post único pro feed",
    icon: ImageIcon,
    dims: `${POST_DIMENSIONS.width}×${POST_DIMENSIONS.height} · ${POST_DIMENSIONS.aspectRatio}`,
  },
  {
    type: "carousel",
    label: "Carrossel",
    description: `${CAROUSEL_DIMENSIONS.slideCount} slides pro feed`,
    icon: GalleryHorizontal,
    dims: `${CAROUSEL_DIMENSIONS.width}×${CAROUSEL_DIMENSIONS.height} · ${CAROUSEL_DIMENSIONS.aspectRatio}`,
  },
]

type Props = {
  selected: MediaType | null
  onSelect: (type: MediaType) => void
}

export function EscolherFormato({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {FORMATOS.map((f) => {
        const Icon = f.icon
        const active = selected === f.type
        return (
          <button
            key={f.type}
            type="button"
            onClick={() => onSelect(f.type)}
            className="rounded-2xl p-6 text-left transition-all flex flex-col gap-3"
            style={{
              backgroundColor: SURF2,
              border: `2px solid ${active ? ACCENT : BORDER}`,
              boxShadow: active ? "0 0 0 3px rgba(204,17,17,0.2)" : "none",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: active ? ACCENT : "rgba(255,255,255,0.06)" }}
            >
              <Icon className="w-5 h-5" style={{ color: active ? "#fff" : MUTED }} />
            </div>
            <div>
              <p className="text-[15px] font-bold" style={{ color: TEXT }}>{f.label}</p>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{f.description}</p>
            </div>
            <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>{f.dims}</p>
          </button>
        )
      })}
    </div>
  )
}
