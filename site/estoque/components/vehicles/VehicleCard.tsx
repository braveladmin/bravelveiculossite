"use client"

import { useState } from "react"
import Link from "next/link"
import { Chip } from "@heroui/react"
import { CheckCircle2, RotateCcw, Star } from "lucide-react"
import { formatCurrency, formatKm } from "@/lib/format"
import { STATUS_CFG } from "@/lib/constants"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { markAsSold, markAsAvailable, updateVehicleAction } from "@/lib/actions/vehicles"
import type { Vehicle } from "@/lib/types"

const CARD    = "#181818"
const BORDER  = "rgba(255,255,255,0.08)"
const TEXT    = "#ffffff"
const TEXT2   = "#777777"
const TEXT3   = "#5c5c5c"
const ACCENT  = "#cc1111"
const YELLOW  = "#ffae1f"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

function daysInStock(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`
  if (v >= 1_000)     return `R$ ${Math.round(v / 1_000)} mil`
  return formatCurrency(v)
}

type Props = {
  vehicle: Vehicle
  onSold?: (id: string) => void
  onRestore?: (id: string) => void
  onFeatureToggle?: (id: string, isPremium: boolean) => void
}

export function VehicleCard({ vehicle, onSold, onRestore, onFeatureToggle }: Props) {
  const sc       = STATUS_CFG[vehicle.status] ?? STATUS_CFG.disponivel
  const coverUrl = vehicle.images?.[0] ?? vehicle.imageUrl ?? PLACEHOLDER_IMAGE
  const days     = daysInStock(vehicle.acquiredAt ?? vehicle.createdAt)
  const isSold   = vehicle.status === "vendido"
  const isPrep   = vehicle.status === "em_preparacao"

  const [showConfirmSold,    setShowConfirmSold]    = useState(false)
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [saving,             setSaving]             = useState(false)
  const [togglingFeature,    setTogglingFeature]    = useState(false)

  function openConfirmSold(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirmSold(true)
  }

  function openConfirmRestore(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirmRestore(true)
  }

  async function handleConfirmSold() {
    setSaving(true)
    await markAsSold(vehicle.id)
    setSaving(false)
    setShowConfirmSold(false)
    onSold?.(vehicle.id)
  }

  async function handleConfirmRestore() {
    setSaving(true)
    await markAsAvailable(vehicle.id)
    setSaving(false)
    setShowConfirmRestore(false)
    onRestore?.(vehicle.id)
  }

  async function handleToggleFeatured(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (togglingFeature) return
    const next = !vehicle.isPremium
    setTogglingFeature(true)
    await updateVehicleAction(vehicle.id, { isPremium: next })
    setTogglingFeature(false)
    onFeatureToggle?.(vehicle.id, next)
  }

  return (
    <>
    <Link
      href={`/estoque/${vehicle.id}`}
      className={`group block rounded-xl overflow-hidden transition-all duration-200 ${isSold || isPrep ? "opacity-60" : ""}`}
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      onMouseEnter={(e) => {
        if (isSold || isPrep) return
        const el = e.currentTarget as HTMLElement
        el.style.transform   = "translateY(-4px)"
        el.style.borderColor = ACCENT
        el.style.boxShadow   = "0 8px 24px rgba(0,0,0,0.3)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform   = "translateY(0)"
        el.style.borderColor = BORDER
        el.style.boxShadow   = "none"
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <img
          src={coverUrl}
          alt={vehicle.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.85) 100%)" }}
        />

        {/* Days badge */}
        <span
          className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-lg"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)" }}
        >
          {days}d
        </span>

        {/* Premium badge */}
        {vehicle.isPremium && (
          <span
            className="absolute top-3 left-12 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ backgroundColor: "rgba(255,174,31,0.25)", color: YELLOW, backdropFilter: "blur(4px)", border: "1px solid rgba(255,174,31,0.4)" }}
          >
            <Star className="w-2.5 h-2.5" />
            Destaque
          </span>
        )}

        {/* Status badge */}
        <Chip
          size="sm"
          variant="soft"
          color={sc.chipColor}
          className="absolute top-3 right-3 backdrop-blur-sm text-[10px] font-bold"
        >
          {sc.label}
        </Chip>

        {/* Multiple images count */}
        {(vehicle.images?.length ?? 0) > 1 && (
          <span
            className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)" }}
          >
            +{vehicle.images.length - 1} fotos
          </span>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <p
            className="text-white text-[16px] font-black tabular-nums leading-none"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
          >
            {formatCompact(vehicle.price)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase" style={{ color: TEXT3 }}>
              {vehicle.brand}
            </p>
            {vehicle.category && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(204,17,17,0.15)", color: ACCENT }}
              >
                {vehicle.category}
              </span>
            )}
          </div>
          <h3 className="text-[14px] font-bold line-clamp-1 mt-0.5" style={{ color: TEXT }}>
            {vehicle.name}
          </h3>
          <p className="text-[12px] mt-1.5" style={{ color: TEXT2 }}>
            {vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : vehicle.year}
            <span className="mx-1.5" style={{ color: TEXT3 }}>·</span>
            {formatKm(vehicle.km)}
            {vehicle.color && (
              <>
                <span className="mx-1.5" style={{ color: TEXT3 }}>·</span>
                {vehicle.color}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleToggleFeatured}
            disabled={togglingFeature}
            title={vehicle.isPremium ? "Remover destaque do site" : "Destacar no site"}
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-white/10 shrink-0"
            style={{ color: vehicle.isPremium ? YELLOW : TEXT2 }}
          >
            <Star className="w-3.5 h-3.5" fill={vehicle.isPremium ? YELLOW : "none"} />
          </button>
          {!isSold && (
            <button
              type="button"
              onClick={openConfirmSold}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: TEXT2 }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Marcar como vendido
            </button>
          )}
          {isSold && (
            <button
              type="button"
              onClick={openConfirmRestore}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: TEXT2 }}
            >
              <RotateCcw className="w-3 h-3" />
              Voltar ao estoque
            </button>
          )}
          <p className="text-[11px] font-semibold ml-auto" style={{ color: ACCENT }}>
            Ver detalhes →
          </p>
        </div>
      </div>
    </Link>

    <ConfirmModal
      open={showConfirmSold}
      onClose={() => setShowConfirmSold(false)}
      onConfirm={handleConfirmSold}
      title="Marcar como vendido"
      description={`Confirma que "${vehicle.name}" foi vendido? Ele vai pra seção de vendidos do estoque.`}
      confirmLabel={saving ? "Salvando..." : "Marcar como vendido"}
    />
    <ConfirmModal
      open={showConfirmRestore}
      onClose={() => setShowConfirmRestore(false)}
      onConfirm={handleConfirmRestore}
      title="Voltar ao estoque"
      description={`Confirma que "${vehicle.name}" volta a ficar disponível no estoque?`}
      confirmLabel={saving ? "Salvando..." : "Voltar ao estoque"}
    />
    </>
  )
}
