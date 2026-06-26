"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import { Button } from "@heroui/react"
import { SelecionarVeiculo } from "@/components/midias/steps/SelecionarVeiculo"
import { VeiculoResumoCard } from "@/components/midias/VeiculoResumoCard"
import { EscolherFormato, mediaTypeFromFormato, type FormatoKey } from "@/components/midias/steps/EscolherFormato"
import { SelecionarFotos, MAX_FOTOS_CARROSSEL } from "@/components/midias/steps/SelecionarFotos"
import { SelecionarFotosCollage } from "@/components/midias/steps/SelecionarFotosCollage"
import { Legenda } from "@/components/midias/steps/Legenda"
import { PreviewFinal } from "@/components/midias/steps/PreviewFinal"
import { getDimensionsForType } from "@/lib/midias/dimensoes"
import { gerarLegenda, gerarHashtags, formatPrecoSemCentavos } from "@/lib/midias/legenda"
import { createGeneratedMedia } from "@/lib/actions/media"
import { updateVehicleAction } from "@/lib/actions/vehicles"
import { formatKm } from "@/lib/format"
import { MEDIA_TYPE_CFG } from "@/lib/constants"
import type { MediaType, Vehicle } from "@/lib/types"

const SURFACE = "#181818"
const SURF2   = "#111111"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#cc1111"
const TEXT    = "#ffffff"
const MUTED   = "#777777"

type Props = {
  vehicles: Vehicle[]
}

export function NovaMidiaWizard({ vehicles }: Props) {
  const router = useRouter()

  const [step,             setStep]             = useState(0)
  const [vehicle,          setVehicle]          = useState<Vehicle | null>(null)
  const [formato,          setFormato]          = useState<FormatoKey | null>(null)
  const [selectedPhotos,   setSelectedPhotos]   = useState<string[]>([])
  const [caption,          setCaption]          = useState("")
  const [hashtags,         setHashtags]         = useState<string[]>([])
  const [saving,           setSaving]           = useState(false)
  const [saved,            setSaved]            = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [updatingNewBadge, setUpdatingNewBadge] = useState(false)

  // Sem isso, trocar de passo num celular deixa o usuário olhando pro meio da
  // tela anterior, já que o scroll não acompanha a troca de conteúdo do wizard.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const mediaType: MediaType | null = formato ? mediaTypeFromFormato(formato) : null
  const storyCollage = formato === "story-collage"
  const skipLegenda = mediaType === "story"
  const STEP_LABELS = skipLegenda
    ? ["Selecionar carro", "Escolher formato", "Gerar mídia", "Preview e salvar"]
    : ["Selecionar carro", "Escolher formato", "Gerar mídia", "Gerar legenda", "Preview e salvar"]

  function handleSelectVehicle(v: Vehicle) {
    setVehicle(v)
    setSelectedPhotos((v.images ?? []).slice(0, MAX_FOTOS_CARROSSEL))
  }

  function handleSelectFormato(key: FormatoKey) {
    setFormato(key)
    if (!vehicle) return
    const imgs = vehicle.images ?? []
    if (key === "story-collage") {
      setSelectedPhotos([imgs[0] ?? "", imgs[1] ?? imgs[0] ?? "", imgs[2] ?? imgs[0] ?? ""])
    } else if (key === "carousel") {
      setSelectedPhotos(imgs.slice(0, MAX_FOTOS_CARROSSEL))
    }
  }

  function handleGerarMidia() {
    if (!vehicle) return
    if (skipLegenda) {
      setCaption("")
      setHashtags([])
    } else {
      setCaption(gerarLegenda(vehicle))
      setHashtags(gerarHashtags(vehicle))
    }
    setStep(3)
  }

  const previewVehicle: Vehicle | null =
    vehicle && (mediaType === "carousel" || storyCollage) ? { ...vehicle, images: selectedPhotos } : vehicle

  async function handleToggleNewBadge(value: boolean) {
    if (!vehicle) return
    setVehicle((v) => v && { ...v, isNew: value })
    setUpdatingNewBadge(true)
    await updateVehicleAction(vehicle.id, { isNew: value })
    setUpdatingNewBadge(false)
  }

  async function handleSave() {
    if (!vehicle || !mediaType) return
    setSaving(true)
    setError(null)

    const baseDimensions = getDimensionsForType(mediaType)
    const dimensions = mediaType === "carousel"
      ? { ...baseDimensions, slideCount: selectedPhotos.length + 4 }
      : baseDimensions
    const result = await createGeneratedMedia({
      vehicleId: vehicle.id,
      vehicleModel: vehicle.model || vehicle.name,
      mediaType,
      title: `${MEDIA_TYPE_CFG[mediaType].label}${storyCollage ? " (3 fotos)" : ""} ${vehicle.name}`.trim(),
      previewData: {
        vehicleSnapshot: {
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.name,
          year: vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : `${vehicle.year}`,
          price: vehicle.price ? formatPrecoSemCentavos(vehicle.price) : "",
          mileage: vehicle.km ? formatKm(vehicle.km) : "",
        },
        layout: storyCollage ? "instagram-story-collage-v1" : `instagram-${mediaType}-v1`,
        ...(storyCollage ? { collagePhotos: selectedPhotos } : {}),
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

    setSaved(true)
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

      {/* Stepper compacto — só no mobile, pra não quebrar em 3 linhas */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between text-[12px] font-semibold">
          <span style={{ color: MUTED }}>Passo {step + 1} de {STEP_LABELS.length}</span>
          <span style={{ color: ACCENT }}>{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: SURF2 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%`, backgroundColor: ACCENT }}
          />
        </div>
      </div>

      {/* Stepper completo — a partir de sm */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
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
            <SelecionarVeiculo
              vehicles={vehicles}
              selectedId={vehicle?.id ?? null}
              onSelect={handleSelectVehicle}
              renderDetail={(v) => <VeiculoResumoCard vehicle={v} onAdvance={() => setStep(1)} />}
            />
          </div>
        )}

        {step === 1 && vehicle && (
          <div className="space-y-5">
            <EscolherFormato selected={formato} onSelect={handleSelectFormato} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(0)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" isDisabled={!formato} onPress={() => setStep(2)}>
                Avançar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && vehicle && mediaType && (
          <div className="space-y-5">
            {mediaType === "carousel" && (
              <SelecionarFotos
                images={vehicle.images ?? []}
                selected={selectedPhotos}
                onChange={setSelectedPhotos}
              />
            )}
            {storyCollage && (
              <SelecionarFotosCollage
                images={vehicle.images ?? []}
                selected={selectedPhotos}
                onChange={setSelectedPhotos}
              />
            )}
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}>
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: TEXT }}>
                  Gerar {MEDIA_TYPE_CFG[mediaType].label.toLowerCase()} pra {vehicle.brand} {vehicle.name}
                </p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                  {skipLegenda
                    ? "Vou montar o preview automaticamente com os dados desse veículo. Story não usa legenda."
                    : "Vou montar o preview e a legenda automaticamente com os dados desse veículo. Você pode editar tudo antes de salvar."}
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(1)}>Voltar</Button>
              <Button
                variant="primary"
                size="sm"
                className="font-semibold"
                isDisabled={
                  (mediaType === "carousel" && (vehicle.images?.length ?? 0) > 0 && selectedPhotos.length === 0) ||
                  (storyCollage && selectedPhotos.filter(Boolean).length < 3)
                }
                onPress={handleGerarMidia}
              >
                Gerar mídia
              </Button>
            </div>
          </div>
        )}

        {step === 3 && !skipLegenda && (
          <div className="space-y-5">
            <Legenda caption={caption} hashtags={hashtags} onChange={setCaption} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(2)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" onPress={() => setStep(4)}>Avançar pro preview</Button>
            </div>
          </div>
        )}

        {step === 3 && skipLegenda && previewVehicle && mediaType && (
          <PreviewFinal
            vehicle={previewVehicle}
            mediaType={mediaType}
            storyCollage={storyCollage}
            caption={caption}
            hashtags={hashtags}
            onChangeCaption={setCaption}
            onBack={() => setStep(2)}
            onSave={handleSave}
            onDone={() => router.push("/midias")}
            onToggleNewBadge={handleToggleNewBadge}
            updatingNewBadge={updatingNewBadge}
            saving={saving}
            saved={saved}
            error={error}
          />
        )}

        {step === 4 && !skipLegenda && previewVehicle && mediaType && (
          <PreviewFinal
            vehicle={previewVehicle}
            mediaType={mediaType}
            storyCollage={storyCollage}
            caption={caption}
            hashtags={hashtags}
            onChangeCaption={setCaption}
            onBack={() => setStep(3)}
            onSave={handleSave}
            onDone={() => router.push("/midias")}
            onToggleNewBadge={handleToggleNewBadge}
            updatingNewBadge={updatingNewBadge}
            saving={saving}
            saved={saved}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
