"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import { Button } from "@heroui/react"
import { SelecionarVeiculo } from "@/components/midias/steps/SelecionarVeiculo"
import { VeiculoResumoCard } from "@/components/midias/VeiculoResumoCard"
import { EscolherFormato } from "@/components/midias/steps/EscolherFormato"
import { Legenda } from "@/components/midias/steps/Legenda"
import { PreviewFinal } from "@/components/midias/steps/PreviewFinal"
import { getDimensionsForType } from "@/lib/midias/dimensoes"
import { gerarLegenda, gerarHashtags, formatPrecoSemCentavos } from "@/lib/midias/legenda"
import { createGeneratedMedia } from "@/lib/actions/media"
import { formatKm } from "@/lib/format"
import { MEDIA_TYPE_CFG } from "@/lib/constants"
import type { MediaType, Vehicle } from "@/lib/types"

const SURFACE = "#181818"
const SURF2   = "#111111"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#cc1111"
const TEXT    = "#ffffff"
const MUTED   = "#777777"

const STEP_LABELS = ["Selecionar carro", "Escolher formato", "Gerar mídia", "Gerar legenda", "Preview e salvar"]

type Props = {
  vehicles: Vehicle[]
}

export function NovaMidiaWizard({ vehicles }: Props) {
  const router = useRouter()

  const [step,      setStep]      = useState(0)
  const [vehicle,   setVehicle]   = useState<Vehicle | null>(null)
  const [mediaType, setMediaType] = useState<MediaType | null>(null)
  const [caption,   setCaption]   = useState("")
  const [hashtags,  setHashtags]  = useState<string[]>([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function handleGerarMidia() {
    if (!vehicle) return
    setCaption(gerarLegenda(vehicle))
    setHashtags(gerarHashtags(vehicle))
    setStep(3)
  }

  async function handleSave() {
    if (!vehicle || !mediaType) return
    setSaving(true)
    setError(null)

    const dimensions = getDimensionsForType(mediaType)
    const result = await createGeneratedMedia({
      vehicleId: vehicle.id,
      vehicleModel: vehicle.model || vehicle.name,
      mediaType,
      title: `${MEDIA_TYPE_CFG[mediaType].label} ${vehicle.brand} ${vehicle.name}`.trim(),
      previewData: {
        vehicleSnapshot: {
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.name,
          year: vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : `${vehicle.year}`,
          price: vehicle.price ? formatPrecoSemCentavos(vehicle.price) : "",
          mileage: vehicle.km ? formatKm(vehicle.km) : "",
        },
        layout: `instagram-${mediaType}-v1`,
      },
      caption,
      hashtags,
      dimensions,
    })

    setSaving(false)
    if (!result.media) {
      setError(result.error ?? "Erro ao salvar mídia")
      return
    }

    router.push("/midias")
  }

  return (
    <div className="p-5 space-y-6 max-w-300 mx-auto">

      {/* Header */}
      <div>
        <Link
          href="/midias"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:underline"
          style={{ color: MUTED }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pra Central de Mídias
        </Link>
        <h1 className="text-[22px] font-black mt-2" style={{ color: TEXT }}>Nova mídia</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{
              backgroundColor: i === step ? ACCENT : i < step ? "rgba(204,17,17,0.12)" : SURF2,
              color: i === step ? "#fff" : i < step ? ACCENT : MUTED,
              border: `1px solid ${i === step ? ACCENT : BORDER}`,
            }}
          >
            {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
            {label}
          </div>
        ))}
      </div>

      {/* Conteúdo do passo */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>

        {step === 0 && (
          <div className="space-y-5">
            <SelecionarVeiculo vehicles={vehicles} selectedId={vehicle?.id ?? null} onSelect={setVehicle} />
            {vehicle && <VeiculoResumoCard vehicle={vehicle} />}
            <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="primary" size="sm" className="font-semibold" isDisabled={!vehicle} onPress={() => setStep(1)}>
                Avançar
              </Button>
            </div>
          </div>
        )}

        {step === 1 && vehicle && (
          <div className="space-y-5">
            <EscolherFormato selected={mediaType} onSelect={setMediaType} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(0)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" isDisabled={!mediaType} onPress={() => setStep(2)}>
                Avançar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && vehicle && mediaType && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}>
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: TEXT }}>
                  Gerar {MEDIA_TYPE_CFG[mediaType].label.toLowerCase()} pra {vehicle.brand} {vehicle.name}
                </p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                  Vou montar o preview e a legenda automaticamente com os dados desse veículo. Você pode editar tudo antes de salvar.
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(1)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" onPress={handleGerarMidia}>Gerar mídia</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Legenda caption={caption} hashtags={hashtags} onChange={setCaption} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(2)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" onPress={() => setStep(4)}>Avançar pro preview</Button>
            </div>
          </div>
        )}

        {step === 4 && vehicle && mediaType && (
          <PreviewFinal
            vehicle={vehicle}
            mediaType={mediaType}
            caption={caption}
            hashtags={hashtags}
            onChangeCaption={setCaption}
            onBack={() => setStep(3)}
            onSave={handleSave}
            saving={saving}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
