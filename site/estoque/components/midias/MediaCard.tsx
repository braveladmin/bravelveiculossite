"use client"

import Link from "next/link"
import { Chip } from "@heroui/react"
import { Clapperboard, Image as ImageIcon, GalleryHorizontal, Folder } from "lucide-react"
import { MEDIA_TYPE_CFG, MEDIA_STATUS_CFG } from "@/lib/constants"
import type { GeneratedMediaWithRelations } from "@/lib/types"

const CARD   = "#181818"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT   = "#ffffff"
const MUTED  = "#777777"

const TYPE_ICON = {
  story:    Clapperboard,
  post:     ImageIcon,
  carousel: GalleryHorizontal,
} as const

type Props = {
  media: GeneratedMediaWithRelations
}

export function MediaCard({ media }: Props) {
  const tc = MEDIA_TYPE_CFG[media.mediaType]
  const sc = MEDIA_STATUS_CFG[media.status]
  const Icon = TYPE_ICON[media.mediaType]

  return (
    <Link
      href={`/midias/pasta/${media.folderId}`}
      className="block rounded-xl overflow-hidden p-4 space-y-3 transition-colors hover:bg-white/2"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: "rgba(204,17,17,0.12)", color: "#cc1111" }}
        >
          <Icon className="w-3.5 h-3.5" />
          {tc.label}
        </span>
        <Chip size="sm" variant="soft" color={sc.chipColor} className="text-[10px] font-bold">
          {sc.label}
        </Chip>
      </div>

      <div>
        <p className="text-[14px] font-bold line-clamp-1" style={{ color: TEXT }}>{media.title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{media.vehicleName || "Veículo não encontrado"}</p>
      </div>

      {media.folderName && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
          <Folder className="w-3 h-3" />
          {media.folderName}
        </div>
      )}

      <p className="text-[11px] line-clamp-2" style={{ color: MUTED }}>{media.caption}</p>
    </Link>
  )
}
