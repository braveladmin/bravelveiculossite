"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Clapperboard, ImagePlus, Plus } from "lucide-react"
import { MediaCard } from "@/components/midias/MediaCard"
import type { GeneratedMediaWithRelations, MediaType } from "@/lib/types"

const SURFACE = "#181818"
const SURF2   = "#111111"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#cc1111"
const TEXT    = "#ffffff"
const MUTED   = "#777777"

type FilterTab = "todos" | MediaType

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "todos",    label: "Todos" },
  { value: "story",    label: "Story" },
  { value: "post",     label: "Post" },
  { value: "carousel", label: "Carrossel" },
]

type Props = {
  media: GeneratedMediaWithRelations[]
}

export function MidiasClient({ media: initialMedia }: Props) {
  const [media,  setMedia]  = useState(initialMedia)
  const [filter, setFilter] = useState<FilterTab>("todos")

  function handleDeleted(id: string) {
    setMedia((ms) => ms.filter((m) => m.id !== id))
  }

  const counts = useMemo(() => ({
    todos:    media.length,
    story:    media.filter((m) => m.mediaType === "story").length,
    post:     media.filter((m) => m.mediaType === "post").length,
    carousel: media.filter((m) => m.mediaType === "carousel").length,
  }), [media])

  const filtered = useMemo(() => {
    if (filter === "todos") return media
    return media.filter((m) => m.mediaType === filter)
  }, [media, filter])

  return (
    <div className="p-5 space-y-6 max-w-400 mx-auto">

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black" style={{ color: TEXT }}>Central de Mídias</h1>
          <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
            {media.length} {media.length === 1 ? "mídia gerada" : "mídias geradas"}
          </p>
        </div>
        <Link
          href="/midias/nova"
          className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 rounded-xl shrink-0 transition-opacity hover:opacity-90"
          style={{ height: "36px", background: "linear-gradient(135deg, #cc1111 0%, #a80e0e 100%)", color: "#fff", boxShadow: "0 2px 12px rgba(204,17,17,0.35)" }}
        >
          <Plus className="w-4 h-4" />
          Nova mídia
        </Link>
      </div>

      {/* Filtros por tipo */}
      <div
        className="flex items-center gap-0.5 rounded-xl p-1 self-start flex-wrap w-fit"
        style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}
      >
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap"
              style={{ backgroundColor: active ? ACCENT : "transparent", color: active ? "#fff" : MUTED }}
            >
              {tab.label}
              <span
                className="text-[11px] font-black tabular-nums"
                style={{ color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)" }}
              >
                {counts[tab.value]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid or empty */}
      {filtered.length === 0 ? (
        <EmptyState hasAnyMedia={media.length > 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map((m) => (
            <MediaCard key={m.id} media={m} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasAnyMedia }: { hasAnyMedia: boolean }) {
  return (
    <div
      className="rounded-2xl py-20 flex flex-col items-center gap-5 text-center"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: SURF2 }}>
        {hasAnyMedia ? <ImagePlus className="w-7 h-7" style={{ color: MUTED }} /> : <Clapperboard className="w-7 h-7" style={{ color: MUTED }} />}
      </div>
      <div>
        <p className="text-[15px] font-bold" style={{ color: TEXT }}>
          {hasAnyMedia ? "Nenhuma mídia desse tipo" : "Nenhuma mídia gerada ainda"}
        </p>
        <p className="text-[13px] mt-1" style={{ color: MUTED }}>
          {hasAnyMedia
            ? "Tente outro filtro ou gere uma nova mídia"
            : "Selecione um carro do estoque e gere seu primeiro story, post ou carrossel"}
        </p>
      </div>
      <Link
        href="/midias/nova"
        className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 rounded-xl transition-opacity hover:opacity-90"
        style={{ height: "36px", background: "linear-gradient(135deg, #cc1111 0%, #a80e0e 100%)", color: "#fff" }}
      >
        <Plus className="w-3.5 h-3.5" />
        Nova mídia
      </Link>
    </div>
  )
}
