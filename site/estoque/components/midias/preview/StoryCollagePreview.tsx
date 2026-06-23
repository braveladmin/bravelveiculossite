"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { MessageCircle } from "lucide-react"
import { formatKm } from "@/lib/format"
import { formatPrecoSemCentavos } from "@/lib/midias/legenda"
import { STORE_NAME } from "@/lib/constants"
import type { Vehicle } from "@/lib/types"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

type Props = {
  vehicle: Vehicle
}

function Band({ src, alt, borderBottom, children }: { src: string; alt: string; borderBottom?: boolean; children?: ReactNode }) {
  return (
    <div className="relative flex-1 overflow-hidden" style={borderBottom ? { borderBottom: "2px solid #cc1111" } : undefined}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
      />
      {children}
    </div>
  )
}

export function StoryCollagePreview({ vehicle }: Props) {
  const photos = vehicle.images?.length ? vehicle.images : []
  const fotoExterna1 = photos[0] ?? PLACEHOLDER_IMAGE
  const fotoInterior = photos[1] ?? fotoExterna1
  const fotoExterna2 = photos[2] ?? fotoExterna1
  const anoLinha = vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : vehicle.year ? `${vehicle.year}` : ""

  const specs = [anoLinha, vehicle.fuel || null, vehicle.km ? formatKm(vehicle.km) : null, vehicle.transmission || null].filter(Boolean)

  return (
    <div className="media-preview story">
      <div className="absolute inset-0 flex flex-col">

        {/* Banda 1 — externa, nome do carro */}
        <Band src={fotoExterna1} alt={vehicle.name} borderBottom>
          {vehicle.isNew && (
            <div className="absolute top-0 left-0 z-10" style={{ padding: "10% 6% 0" }}>
              <span
                className="preview-commercial inline-block text-white text-[8px] font-extrabold uppercase tracking-[0.12em]"
                style={{ backgroundColor: "#cc1111", borderRadius: "4px", padding: "5px 10px", boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
              >
                Novidade no estoque
              </span>
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ padding: "12% 6% 8%", background: "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.55) 55%, transparent 100%)" }}
          >
            <p className="preview-commercial text-[#cc1111] text-[8px] font-bold uppercase tracking-[0.14em]">
              {[vehicle.brand, vehicle.model].filter(Boolean).join(" · ")}
            </p>
            <h2 className="preview-display text-white text-[19px] leading-[0.95] mt-0.5">
              {vehicle.name || `${vehicle.brand} ${vehicle.model}`}
            </h2>
          </div>
        </Band>

        {/* Banda 2 — interior, specs + preço */}
        <Band src={fotoInterior} alt={`${vehicle.name} - interior`} borderBottom>
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ padding: "14% 6% 7%", background: "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.55) 55%, transparent 100%)" }}
          >
            {specs.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {specs.map((s) => (
                  <span
                    key={s}
                    className="preview-commercial text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {vehicle.price > 0 && (
              <div className="mt-1.5 pt-1" style={{ borderTop: "2px solid #cc1111" }}>
                <p className="preview-commercial text-white/50 text-[7px] font-bold uppercase tracking-[0.16em]">Valor a vista</p>
                <p className="preview-display text-white text-[19px] leading-none mt-0.5">{formatPrecoSemCentavos(vehicle.price)}</p>
              </div>
            )}
          </div>
        </Band>

        {/* Banda 3 — externa, CTA + marca */}
        <Band src={fotoExterna2} alt={`${vehicle.name} - traseira`}>
          <div className="absolute top-0 right-0 z-10" style={{ padding: "8% 6% 0" }}>
            <Image
              src="/bravel-logo.png"
              alt="Bravel Veículos"
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
            />
          </div>
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2"
            style={{ padding: "16% 6% 6%", background: "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.55) 55%, transparent 100%)" }}
          >
            <span
              className="preview-commercial inline-flex items-center gap-1.5 text-white text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={{
                background: "linear-gradient(135deg, #cc1111 0%, #a80e0e 100%)",
                boxShadow: "0 4px 14px rgba(204,17,17,0.4)",
                padding: "8px 16px",
                borderRadius: "999px",
              }}
            >
              <MessageCircle className="w-3 h-3" />
              Fale no WhatsApp
            </span>
            <span className="preview-commercial text-white/60 text-[9px] font-semibold">{STORE_NAME}</span>
          </div>
        </Band>
      </div>
    </div>
  )
}
