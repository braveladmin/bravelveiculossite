"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, ImagePlus } from "lucide-react"
import { Chip } from "@heroui/react"
import { PhotoManager } from "@/components/vehicles/PhotoManager"
import { setDraftImages } from "@/lib/actions/pendingActions"
import { formatCurrency } from "@/lib/format"
import type { MCPPendingAction } from "@/lib/mcp/types"

const SURFACE = "#181818"
const SURF2   = "#111111"
const BORDER  = "rgba(255,255,255,0.08)"
const ACCENT  = "#cc1111"
const TEXT    = "#ffffff"
const MUTED   = "#777777"
const SUCCESS = "#25d366"

const KIND_LABEL: Record<MCPPendingAction["kind"], string> = {
  criar: "Cadastro novo",
  editar: "Edição",
  remover: "Remoção",
  publicar: "Publicação no Instagram",
}

const STATUS_CFG: Record<MCPPendingAction["status"], { label: string; chipColor: "warning" | "success" | "default" }> = {
  pending:   { label: "Pendente de confirmação", chipColor: "warning" },
  confirmed: { label: "Confirmado",               chipColor: "success" },
  cancelled: { label: "Cancelado",                chipColor: "default" },
  expired:   { label: "Expirado",                 chipColor: "default" },
}

type Props = {
  pendingAction: MCPPendingAction
}

export function RascunhoClient({ pendingAction }: Props) {
  const initialImages = Array.isArray(pendingAction.payload.images)
    ? (pendingAction.payload.images as string[])
    : []
  const [images, setImages] = useState<string[]>(initialImages)
  const [saved, setSaved] = useState(true)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const isPending = pendingAction.status === "pending"
  const canUploadPhotos = pendingAction.kind === "criar" && isPending

  async function handleImagesChange(next: string[]) {
    setImages(next)
    setSaved(false)
    setSaveErr(null)
    const { error } = await setDraftImages(pendingAction.id, next)
    if (error) setSaveErr(error)
    setSaved(true)
  }

  const payload = pendingAction.payload as Record<string, unknown>

  return (
    <div className="p-5 space-y-6 max-w-180 mx-auto">
      <div>
        <Link
          href="/estoque"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:underline"
          style={{ color: MUTED }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao estoque
        </Link>
        <h1 className="text-[22px] font-black mt-2" style={{ color: TEXT }}>Rascunho do conector</h1>
        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
          Criado via comando no Claude — confirme ou cancele de volta na conversa.
        </p>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(204,17,17,0.12)", color: ACCENT }}
          >
            {KIND_LABEL[pendingAction.kind]}
          </span>
          <Chip size="sm" variant="soft" color={STATUS_CFG[pendingAction.status].chipColor} className="text-[10px] font-bold">
            {STATUS_CFG[pendingAction.status].label}
          </Chip>
        </div>

        <p className="text-[14px] leading-relaxed" style={{ color: TEXT }}>{pendingAction.summary}</p>

        {pendingAction.kind === "criar" && (
          <div className="rounded-xl p-3 text-[12px] space-y-1" style={{ backgroundColor: SURF2, color: MUTED }}>
            {typeof payload.brand === "string" && <p><span style={{ color: TEXT }}>Marca:</span> {payload.brand}</p>}
            {typeof payload.name === "string" && <p><span style={{ color: TEXT }}>Nome:</span> {payload.name}</p>}
            {typeof payload.year === "number" && <p><span style={{ color: TEXT }}>Ano:</span> {payload.year}</p>}
            {typeof payload.km === "number" && <p><span style={{ color: TEXT }}>KM:</span> {payload.km.toLocaleString("pt-BR")}</p>}
            {typeof payload.price === "number" && <p><span style={{ color: TEXT }}>Preço:</span> {formatCurrency(payload.price)}</p>}
          </div>
        )}

        {!isPending && (
          <p className="text-[12px]" style={{ color: MUTED }}>
            Esse rascunho não está mais pendente — não é possível alterar as fotos.
          </p>
        )}
      </div>

      {canUploadPhotos && (
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4" style={{ color: ACCENT }} />
            <p className="text-[14px] font-bold" style={{ color: TEXT }}>Fotos do veículo</p>
          </div>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Suba as fotos antes de voltar pro Claude e confirmar o cadastro. A primeira foto vira a capa.
          </p>

          <PhotoManager images={images} onChange={handleImagesChange} />

          {saveErr && <p className="text-[12px]" style={{ color: "#ff6b6b" }}>{saveErr}</p>}
          {saved && images.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: "rgba(37,211,102,0.1)", color: SUCCESS }}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {images.length} foto{images.length > 1 ? "s" : ""} salva{images.length > 1 ? "s" : ""}. Pode voltar pro Claude e confirmar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
