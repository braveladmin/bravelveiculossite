"use client"

import { Button } from "@heroui/react"
import { AlertTriangle, Check, X } from "lucide-react"
import type { PendingAction } from "@/lib/ai/types"

const SURF2  = "#111111"
const BORDER = "rgba(204,17,17,0.3)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"

type Props = {
  pendingAction: PendingAction
  onConfirm: () => void
  onCancel: () => void
  confirming: boolean
}

export function PendingActionCard({ pendingAction, onConfirm, onCancel, confirming }: Props) {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
        <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{pendingAction.summary}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="font-semibold" onPress={onCancel} isDisabled={confirming}>
          <X className="w-3.5 h-3.5" />
          Cancelar
        </Button>
        <Button variant="primary" size="sm" className="font-semibold" onPress={onConfirm} isPending={confirming}>
          <Check className="w-3.5 h-3.5" />
          Confirmar
        </Button>
      </div>
    </div>
  )
}
