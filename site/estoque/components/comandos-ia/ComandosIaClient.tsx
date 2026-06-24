"use client"

import { useState } from "react"
import { ChatMessageList } from "./ChatMessageList"
import { ChatInput } from "./ChatInput"
import { PendingActionCard } from "./PendingActionCard"
import { MediaPreviewCard } from "./MediaPreviewCard"
import { runAiCommand, confirmAiAction, cancelAiAction } from "@/lib/actions/aiCommands"
import { getVehicleById, type UserInfo } from "@/lib/actions/vehicles"
import type { ChatMessage, PendingAction, MediaPreviewParams } from "@/lib/ai/types"
import type { Vehicle } from "@/lib/types"

const SURFACE = "#181818"
const BORDER  = "rgba(255,255,255,0.08)"
const TEXT    = "#ffffff"
const MUTED   = "#777777"

type Props = {
  userInfo: UserInfo
}

export function ComandosIaClient({ userInfo }: Props) {
  const [messages,      setMessages]      = useState<ChatMessage[]>([])
  const [loading,       setLoading]       = useState(false)
  const [sendError,     setSendError]     = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [confirming,    setConfirming]    = useState(false)
  const [mediaPreview,  setMediaPreview]  = useState<{ preview: MediaPreviewParams; vehicle: Vehicle } | null>(null)

  const busy = loading || confirming || !!pendingAction

  async function handleSend(text: string) {
    setSendError(null)
    const history = messages
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const result = await runAiCommand(history, text)
    setLoading(false)

    if (result.error) {
      setSendError(result.error)
      return
    }

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result.reply }])

    if (result.pendingAction) setPendingAction(result.pendingAction)

    if (result.mediaPreview) {
      const { vehicle } = await getVehicleById(result.mediaPreview.vehicleId)
      if (vehicle) setMediaPreview({ preview: result.mediaPreview, vehicle })
    }
  }

  async function handleConfirm() {
    if (!pendingAction) return
    setConfirming(true)
    const result = await confirmAiAction(pendingAction)
    setConfirming(false)
    setPendingAction(null)
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result.message }])
  }

  async function handleCancel() {
    if (!pendingAction) return
    await cancelAiAction(pendingAction)
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Ação cancelada." }])
    setPendingAction(null)
  }

  return (
    <div className="p-5 space-y-4 max-w-180 mx-auto">
      <div>
        <h1 className="text-[22px] font-black" style={{ color: TEXT }}>Comandos por IA</h1>
        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
          Digite um comando em português — ex: &quot;marca o Civic como vendido&quot;, &quot;cria um story pro T-Cross&quot;
        </p>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
        {messages.length === 0 && !loading && (
          <p className="text-[13px]" style={{ color: MUTED }}>
            Oi, {userInfo.name.split(" ")[0]}! Pode pedir pra eu listar, cadastrar, editar, vender,
            disponibilizar ou destacar veículos, e gerar/postar mídias pro Instagram. Antes de qualquer
            mudança ou publicação eu vou te mostrar uma prévia pra você confirmar.
          </p>
        )}

        <ChatMessageList messages={messages} loading={loading} />

        {pendingAction && (
          <PendingActionCard
            pendingAction={pendingAction}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            confirming={confirming}
          />
        )}

        {mediaPreview && (
          <MediaPreviewCard preview={mediaPreview.preview} vehicle={mediaPreview.vehicle} />
        )}

        {sendError && <p className="text-[13px]" style={{ color: "#ff6b6b" }}>{sendError}</p>}

        <ChatInput disabled={busy} onSend={handleSend} />
      </div>
    </div>
  )
}
