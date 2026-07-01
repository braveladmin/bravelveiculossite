"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, CheckCircle2, Sparkles } from "lucide-react"
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
import type { Vehicle } from "@/lib/types"

const SURFACE = "#181818"
const SURF2   = "#111111"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#cc1111"
const TEXT    = "#ffffff"
const MUTED   = "#777777"
const SUCCESS = "#25d366"

const FORMATO_LABEL: Record<FormatoKey, string> = {
  "story":         "Story",
  "story-collage": "Story (3 fotos)",
  "carousel":      "Carrossel",
}

type Props = {
  vehicles: Vehicle[]
}

export function NovaMidiaWizard({ vehicles }: Props) {
  const router = useRouter()

  const [step,             setStep]             = useState(0)
  const [vehicle,          setVehicle]          = useState<Vehicle | null>(null)
  const [formatos,         setFormatos]         = useState<FormatoKey[]>([])
  const [carouselPhotos,   setCarouselPhotos]   = useState<string[]>([])
  const [collagePhotos,    setCollagePhotos]    = useState<string[]>([])
  const [caption,          setCaption]          = useState("")
  const [hashtags,         setHashtags]         = useState<string[]>([])
  const [savingFormato,    setSavingFormato]    = useState<FormatoKey | null>(null)
  const [savedFormats,     setSavedFormats]     = useState<Set<FormatoKey>>(new Set())
  const [error,            setError]            = useState<string | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<FormatoKey | null>(null)
  const [updatingNewBadge, setUpdatingNewBadge] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const needsPhotos  = formatos.some(f => f === "carousel" || f === "story-collage")
  const needsCaption = formatos.includes("carousel")

  // Sequência de passos visíveis (números internos: 0 veículo, 1 formato, 2 fotos, 3 legenda, 4 preview)
  const STEP_SEQ = [0, 1, ...(needsPhotos ? [2] : []), ...(needsCaption ? [3] : []), 4]
  const STEP_LABEL_MAP: Record<number, string> = {
    0: "Selecionar carro",
    1: "Escolher formatos",
    2: "Selecionar fotos",
    3: "Gerar legenda",
    4: "Preview e salvar",
  }
  const STEP_LABELS   = STEP_SEQ.map(n => STEP_LABEL_MAP[n])
  const stepPosition  = STEP_SEQ.indexOf(step)

  function handleSelectVehicle(v: Vehicle) {
    setVehicle(v)
    setCarouselPhotos((v.images ?? []).slice(0, MAX_FOTOS_CARROSSEL))
    setCollagePhotos([])
    setSavedFormats(new Set())
    setSavingFormato(null)
    setActivePreviewTab(null)
    setError(null)
  }

  function handleToggleFormato(key: FormatoKey) {
    const isSelected = formatos.includes(key)
    const next = isSelected ? formatos.filter(k => k !== key) : [...formatos, key]
    setFormatos(next)
    if (isSelected || !vehicle) return
    const imgs = vehicle.images ?? []
    if (key === "story-collage" && collagePhotos.length === 0) {
      setCollagePhotos([imgs[0] ?? "", imgs[1] ?? imgs[0] ?? "", imgs[2] ?? imgs[0] ?? ""])
    }
  }

  function advanceFromFormato() {
    if (needsPhotos) {
      setStep(2)
    } else {
      // Apenas story — pula fotos e legenda
      setCaption("")
      setHashtags([])
      setActivePreviewTab(formatos[0])
      setStep(4)
    }
  }

  function advanceFromFotos() {
    if (!vehicle) return
    if (needsCaption) {
      setCaption(gerarLegenda(vehicle))
      setHashtags(gerarHashtags(vehicle))
      setStep(3)
    } else {
      setCaption("")
      setHashtags([])
      setActivePreviewTab(formatos[0])
      setStep(4)
    }
  }

  function advanceFromLegenda() {
    setActivePreviewTab(formatos[0])
    setStep(4)
  }

  function getBackFromPreview() {
    if (needsCaption) return 3
    if (needsPhotos) return 2
    return 1
  }

  function getPreviewVehicle(fmt: FormatoKey): Vehicle {
    if (!vehicle) return null!
    if (fmt === "carousel")      return { ...vehicle, images: carouselPhotos }
    if (fmt === "story-collage") return { ...vehicle, images: collagePhotos }
    return vehicle
  }

  async function handleToggleNewBadge(value: boolean) {
    if (!vehicle) return
    setVehicle(v => v && { ...v, isNew: value })
    setUpdatingNewBadge(true)
    await updateVehicleAction(vehicle.id, { isNew: value })
    setUpdatingNewBadge(false)
  }

  async function handleSave(fmt: FormatoKey) {
    if (!vehicle) return
    const mt        = mediaTypeFromFormato(fmt)
    const isCollage = fmt === "story-collage"
    const photos    = fmt === "carousel" ? carouselPhotos : fmt === "story-collage" ? collagePhotos : []

    setSavingFormato(fmt)
    setError(null)

    const baseDimensions = getDimensionsForType(mt)
    const dimensions = mt === "carousel"
      ? { ...baseDimensions, slideCount: photos.length + 4 }
      : baseDimensions

    const result = await createGeneratedMedia({
      vehicleId:    vehicle.id,
      vehicleModel: vehicle.model || vehicle.name,
      mediaType:    mt,
      title:        `${FORMATO_LABEL[fmt]} ${vehicle.name}`.trim(),
      previewData: {
        vehicleSnapshot: {
          brand:   vehicle.brand,
          model:   vehicle.model,
          version: vehicle.name,
          year:    vehicle.yearModel ? `${vehicle.year}/${vehicle.yearModel}` : `${vehicle.year}`,
          price:   vehicle.price ? formatPrecoSemCentavos(vehicle.price) : "",
          mileage: vehicle.km    ? formatKm(vehicle.km) : "",
        },
        layout: isCollage ? "instagram-story-collage-v1" : `instagram-${mt}-v1`,
        ...(isCollage ? { collagePhotos: photos } : {}),
      },
      caption:  mt === "story" ? "" : caption,
      hashtags: mt === "story" ? [] : hashtags,
      dimensions,
    })

    setSavingFormato(null)
    if (!result.media) {
      setError(result.error ?? "Erro ao salvar mídia")
      return
    }
    setSavedFormats(prev => new Set([...prev, fmt]))
  }

  const formatsLabel = formatos.map(f => FORMATO_LABEL[f]).join(" + ")
  const allSaved     = formatos.length > 0 && formatos.every(f => savedFormats.has(f))

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

      {/* Stepper mobile */}
      <div className="sm:hidden space-y-1.5">
        <div className="flex items-center justify-between text-[12px] font-semibold">
          <span style={{ color: MUTED }}>Passo {stepPosition + 1} de {STEP_LABELS.length}</span>
          <span style={{ color: ACCENT }}>{STEP_LABELS[stepPosition]}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: SURF2 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((stepPosition + 1) / STEP_LABELS.length) * 100}%`, backgroundColor: ACCENT }}
          />
        </div>
      </div>

      {/* Stepper desktop */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{
              backgroundColor: i === stepPosition ? ACCENT : i < stepPosition ? "rgba(204,17,17,0.12)" : SURF2,
              color:           i === stepPosition ? "#fff"  : i < stepPosition ? ACCENT              : MUTED,
              border:          `1px solid ${i === stepPosition ? ACCENT : BORDER}`,
            }}
          >
            {i < stepPosition ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
            {label}
          </div>
        ))}
      </div>

      {/* Conteúdo do passo */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>

        {/* Passo 0 — Selecionar veículo */}
        {step === 0 && (
          <div className="space-y-5">
            <SelecionarVeiculo
              vehicles={vehicles}
              selectedId={vehicle?.id ?? null}
              onSelect={handleSelectVehicle}
              onDeselect={() => setVehicle(null)}
              renderDetail={(v) => <VeiculoResumoCard vehicle={v} onAdvance={() => setStep(1)} />}
            />
          </div>
        )}

        {/* Passo 1 — Escolher formatos */}
        {step === 1 && vehicle && (
          <div className="space-y-5">
            <EscolherFormato selected={formatos} onToggle={handleToggleFormato} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(0)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" isDisabled={formatos.length === 0} onPress={advanceFromFormato}>
                Avançar
              </Button>
            </div>
          </div>
        )}

        {/* Passo 2 — Selecionar fotos */}
        {step === 2 && vehicle && (
          <div className="space-y-6">

            {/* Seletor de fotos do carrossel */}
            {formatos.includes("carousel") && (
              <div className="space-y-3">
                {formatos.includes("story-collage") && (
                  <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Fotos do carrossel</p>
                )}
                <SelecionarFotos
                  images={vehicle.images ?? []}
                  selected={carouselPhotos}
                  onChange={setCarouselPhotos}
                />
              </div>
            )}

            {/* Seletor de fotos da colagem */}
            {formatos.includes("story-collage") && (
              <div className="space-y-3">
                {formatos.includes("carousel") && (
                  <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>Fotos do story (3 fotos)</p>
                )}
                <SelecionarFotosCollage
                  images={vehicle.images ?? []}
                  selected={collagePhotos}
                  onChange={setCollagePhotos}
                />
              </div>
            )}

            {/* Info box */}
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}>
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
              <div>
                <p className="text-[14px] font-bold" style={{ color: TEXT }}>
                  Gerar {formatsLabel} pra {vehicle.brand} {vehicle.name}
                </p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                  {needsCaption
                    ? "Vou montar o preview e a legenda automaticamente com os dados desse veículo. Você pode editar tudo antes de salvar."
                    : "Vou montar o preview automaticamente com os dados desse veículo. Story não usa legenda."}
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
                  (formatos.includes("carousel")      && (vehicle.images?.length ?? 0) > 0 && carouselPhotos.length === 0) ||
                  (formatos.includes("story-collage") && collagePhotos.filter(Boolean).length < 3)
                }
                onPress={advanceFromFotos}
              >
                Gerar mídia
              </Button>
            </div>
          </div>
        )}

        {/* Passo 3 — Gerar legenda (só se tiver carrossel) */}
        {step === 3 && needsCaption && (
          <div className="space-y-5">
            <Legenda caption={caption} hashtags={hashtags} onChange={setCaption} />
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Button variant="outline" size="sm" className="font-semibold" onPress={() => setStep(needsPhotos ? 2 : 1)}>Voltar</Button>
              <Button variant="primary" size="sm" className="font-semibold" onPress={advanceFromLegenda}>Avançar pro preview</Button>
            </div>
          </div>
        )}

        {/* Passo 4 — Preview e salvar */}
        {step === 4 && vehicle && activePreviewTab && (
          <div className="space-y-5">

            {/* Tabs de formato (só quando mais de um selecionado) */}
            {formatos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {formatos.map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setActivePreviewTab(fmt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                    style={{
                      backgroundColor: activePreviewTab === fmt ? ACCENT : savedFormats.has(fmt) ? "rgba(37,211,102,0.1)" : SURF2,
                      color:           activePreviewTab === fmt ? "#fff"  : savedFormats.has(fmt) ? SUCCESS              : MUTED,
                      border:          `1px solid ${activePreviewTab === fmt ? ACCENT : savedFormats.has(fmt) ? "rgba(37,211,102,0.3)" : BORDER}`,
                    }}
                  >
                    {savedFormats.has(fmt) && activePreviewTab !== fmt && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {FORMATO_LABEL[fmt]}
                  </button>
                ))}

                {allSaved && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={{ backgroundColor: "rgba(37,211,102,0.1)", color: SUCCESS, border: "1px solid rgba(37,211,102,0.3)" }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tudo salvo!
                  </span>
                )}
              </div>
            )}

            {/* Preview da tab ativa */}
            {formatos.map(fmt => activePreviewTab === fmt && (
              <PreviewFinal
                key={fmt}
                vehicle={getPreviewVehicle(fmt)}
                mediaType={mediaTypeFromFormato(fmt)}
                storyCollage={fmt === "story-collage"}
                caption={mediaTypeFromFormato(fmt) === "story" ? "" : caption}
                hashtags={mediaTypeFromFormato(fmt) === "story" ? [] : hashtags}
                onChangeCaption={setCaption}
                onBack={() => setStep(getBackFromPreview())}
                onSave={() => handleSave(fmt)}
                onDone={() => router.push("/midias")}
                onToggleNewBadge={handleToggleNewBadge}
                updatingNewBadge={updatingNewBadge}
                saving={savingFormato === fmt}
                saved={savedFormats.has(fmt)}
                error={error}
              />
            ))}

          </div>
        )}

      </div>
    </div>
  )
}
