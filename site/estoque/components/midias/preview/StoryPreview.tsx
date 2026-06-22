"use client"

import Image from "next/image"
import { formatPrecoSemCentavos } from "@/lib/midias/legenda"
import { STORE_NAME } from "@/lib/constants"
import { PhotoBackdrop } from "@/components/midias/preview/PhotoBackdrop"
import type { Vehicle } from "@/lib/types"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

type Props = {
  vehicle: Vehicle
}

export function StoryPreview({ vehicle }: Props) {
  const cover = vehicle.images?.[0] ?? vehicle.imageUrl ?? PLACEHOLDER_IMAGE
  const anoLinha = vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : vehicle.year ? `${vehicle.year}` : ""

  return (
    <div className="media-preview story">
      <PhotoBackdrop src={cover} alt={vehicle.name} />

      {/* Aviso de novidade no estoque */}
      <div className="absolute top-0 left-0 z-10" style={{ padding: "6%" }}>
        <span
          className="preview-commercial inline-block text-white text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ backgroundColor: "#cc1111", borderRadius: "4px", padding: "7px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
        >
          Novidade no estoque
        </span>
      </div>

      {/* Logo da loja */}
      <div className="absolute bottom-0 right-0 z-10" style={{ padding: "0 6% 5% 0" }}>
        <Image
          src="/bravel-logo.png"
          alt="Bravel Veículos"
          width={36}
          height={36}
          className="w-9 h-9 rounded-lg"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
        />
      </div>

      <div
        className="safe-area flex flex-col justify-end"
        style={{ background: "linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.75) 30%, rgba(10,10,10,0.15) 60%, transparent 80%)" }}
      >
        <p className="preview-commercial text-[#cc1111] text-[9px] font-bold uppercase tracking-[0.16em]">
          {[vehicle.brand, vehicle.model].filter(Boolean).join(" · ")}
        </p>
        <h2 className="preview-display text-white text-[30px] leading-[0.95] mt-1">
          {vehicle.name || `${vehicle.brand} ${vehicle.model}`}
        </h2>
        {anoLinha && (
          <p className="preview-commercial text-white/60 text-[11px] font-medium mt-1">{anoLinha}</p>
        )}

        {vehicle.price > 0 && (
          <div className="mt-3 pt-2.5" style={{ borderTop: "2px solid #cc1111" }}>
            <p className="preview-commercial text-white/50 text-[9px] font-bold uppercase tracking-[0.18em]">Valor a vista</p>
            <p className="preview-display text-white text-[28px] leading-none mt-0.5">{formatPrecoSemCentavos(vehicle.price)}</p>
          </div>
        )}

        <div className="flex items-center justify-center mt-3">
          <span className="preview-commercial text-white/60 text-[11px] font-semibold">{STORE_NAME}</span>
        </div>
      </div>
    </div>
  )
}
