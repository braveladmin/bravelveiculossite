"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatKm } from "@/lib/format"
import { formatPrecoSemCentavos } from "@/lib/midias/legenda"
import { STORE_NAME, STORE_CITY } from "@/lib/constants"
import { PhotoBackdrop } from "@/components/midias/preview/PhotoBackdrop"
import type { Vehicle } from "@/lib/types"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

const FALLBACK_OPTIONALS_LIST = ["Conforto", "Segurança", "Tecnologia"]

const PHOTO_OVERLAY_GRADIENT = "linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.3) 75%, transparent 100%)"

function Logo() {
  return (
    <div className="absolute top-0 left-0 z-10" style={{ padding: "6%" }}>
      <Image
        src="/bravel-logo.png"
        alt="Bravel Veículos"
        width={28}
        height={28}
        className="w-7 h-7 rounded-md"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
      />
    </div>
  )
}

function PhotoSlide({ src, children }: { src: string; children: ReactNode }) {
  return (
    <>
      <PhotoBackdrop src={src} />
      <Logo />
      <div className="safe-area flex flex-col justify-end" style={{ background: PHOTO_OVERLAY_GRADIENT }}>
        {children}
      </div>
    </>
  )
}

function PlainPhotoSlide({ src }: { src: string }) {
  return (
    <>
      <PhotoBackdrop src={src} />
      <Logo />
    </>
  )
}

type Props = {
  vehicle: Vehicle
}

export function CarouselPreview({ vehicle }: Props) {
  const [index, setIndex] = useState(0)

  const fotos = vehicle.images?.length ? vehicle.images : []
  const cover = fotos[0] ?? vehicle.imageUrl ?? PLACEHOLDER_IMAGE
  const anoLinha = vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : vehicle.year ? `${vehicle.year}` : ""

  const opcionaisList = vehicle.optionals?.length ? vehicle.optionals.slice(0, 6) : FALLBACK_OPTIONALS_LIST

  const slides: { bg?: string; content: ReactNode }[] = [
    // Slide 1 — Capa
    {
      content: (
        <PhotoSlide src={cover}>
          <p className="preview-commercial text-[#cc1111] text-[10px] font-bold uppercase tracking-[0.16em]">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" · ")}
          </p>
          <h2 className="preview-display text-white text-[30px] leading-[0.95] mt-1">
            {vehicle.name || `${vehicle.brand} ${vehicle.model}`}
          </h2>
          {vehicle.price > 0 && (
            <p className="preview-display text-white text-[26px] leading-none mt-2.5 pt-2" style={{ borderTop: "2px solid #cc1111" }}>
              {formatPrecoSemCentavos(vehicle.price)}
            </p>
          )}
        </PhotoSlide>
      ),
    },
    // Slide 2 — Informações principais (sobre foto)
    {
      content: (
        <PhotoSlide src={fotos[1] ?? cover}>
          <h3 className="preview-commercial text-white text-[18px] font-extrabold mb-4">Informações principais</h3>
          <div className="space-y-3">
            {anoLinha && <InfoRow label="Ano/Modelo" value={anoLinha} />}
            {vehicle.km > 0 && <InfoRow label="Quilometragem" value={formatKm(vehicle.km)} />}
            {vehicle.transmission && <InfoRow label="Câmbio" value={vehicle.transmission} />}
            {vehicle.fuel && <InfoRow label="Combustível" value={vehicle.fuel} />}
            {vehicle.color && <InfoRow label="Cor" value={vehicle.color} />}
          </div>
        </PhotoSlide>
      ),
    },
    // Slide 3 — Opcionais/diferenciais (sobre foto)
    {
      content: (
        <PhotoSlide src={fotos[2] ?? cover}>
          <h3 className="preview-commercial text-white text-[18px] font-extrabold mb-4">Equipado pra valer</h3>
          <div className="flex flex-wrap gap-2">
            {opcionaisList.map((opt) => (
              <span
                key={opt}
                className="preview-commercial text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(204,17,17,0.15)", color: "#ff8a8a", border: "1px solid rgba(204,17,17,0.3)" }}
              >
                {opt}
              </span>
            ))}
          </div>
        </PhotoSlide>
      ),
    },
    // Slides 4..N — todas as fotos enviadas do veículo, sem overlay
    ...fotos.map((foto) => ({
      content: <PlainPhotoSlide key={foto} src={foto} />,
    })),
    // Slide final — CTA
    {
      bg: "#0a0a0a",
      content: (
        <div className="safe-area flex flex-col items-center justify-center text-center">
          <Image
            src="/bravel-logo.png"
            alt="Bravel Veículos"
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl mb-4"
            style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.3))" }}
          />
          <p className="preview-commercial text-white text-[19px] font-extrabold leading-tight">
            Vem fazer um test-drive e conhecer esse carro de pertinho!
          </p>
          <p className="preview-commercial text-white/70 text-[12px] font-medium mt-3">Entra em contato e agenda o seu</p>
          <p className="preview-commercial text-white/80 text-[11px] font-semibold mt-5">{STORE_NAME}</p>
          <p className="preview-commercial text-white/60 text-[11px] mt-0.5">{STORE_CITY}</p>
        </div>
      ),
    },
  ]

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length)
  }
  function next() {
    setIndex((i) => (i + 1) % slides.length)
  }

  return (
    <div className="relative" style={{ maxWidth: "405px", width: "100%" }}>
      <div className="media-preview carousel-slide" style={{ backgroundColor: slides[index].bg }}>
        {slides[index].content}
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 flex-wrap justify-center" style={{ maxWidth: "85%" }}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir pro slide ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: i === index ? "18px" : "6px", height: "6px",
              backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <span className="preview-commercial text-white/50 text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      <span className="preview-commercial text-white text-[14px] font-bold">{value}</span>
    </div>
  )
}
