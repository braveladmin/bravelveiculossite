"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
import { Search } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { Vehicle } from "@/lib/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"
const MUTED  = "#777777"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

type Props = {
  vehicles: Vehicle[]
  selectedId: string | null
  onSelect: (vehicle: Vehicle) => void
  /** Renderizado em largura cheia, logo após o card do veículo selecionado, pra não exigir scroll até o final da lista. */
  renderDetail?: (vehicle: Vehicle) => ReactNode
}

export function SelecionarVeiculo({ vehicles, selectedId, onSelect, renderDetail }: Props) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return vehicles
    return vehicles.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    )
  }, [vehicles, search])

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-xl max-w-sm"
        style={{ height: "40px", backgroundColor: SURF2, border: `1px solid ${BORDER}` }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
        <input
          type="text"
          placeholder="Buscar por nome, marca ou modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-[13px] outline-none w-full"
          style={{ color: TEXT, caretColor: ACCENT }}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] py-8 text-center" style={{ color: MUTED }}>Nenhum veículo encontrado</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((v) => {
            const active = v.id === selectedId
            const cover = v.images?.[0] ?? v.imageUrl ?? PLACEHOLDER_IMAGE
            return (
              <Fragment key={v.id}>
                <button
                  type="button"
                  onClick={() => onSelect(v)}
                  className="rounded-xl overflow-hidden text-left transition-all"
                  style={{
                    border: `2px solid ${active ? ACCENT : BORDER}`,
                    backgroundColor: SURF2,
                    boxShadow: active ? "0 0 0 3px rgba(204,17,17,0.2)" : "none",
                  }}
                >
                  <div style={{ height: "120px" }}>
                    <img
                      src={cover}
                      alt={v.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: MUTED }}>{v.brand}</p>
                    <p className="text-[13px] font-bold line-clamp-1" style={{ color: TEXT }}>{v.name}</p>
                    <p className="text-[12px] font-semibold mt-1" style={{ color: ACCENT }}>
                      {v.price ? formatCurrency(v.price) : "Sem preço"}
                    </p>
                  </div>
                </button>
                {active && renderDetail && (
                  <div className="col-span-full">
                    {renderDetail(v)}
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
