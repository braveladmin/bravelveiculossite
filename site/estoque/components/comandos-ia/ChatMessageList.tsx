"use client"

import { useEffect, useRef } from "react"
import { ChatBubble } from "./ChatBubble"
import type { ChatMessage } from "@/lib/ai/types"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const MUTED  = "#777777"

type Props = {
  messages: ChatMessage[]
  loading: boolean
}

export function ChatMessageList({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, loading])

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <ChatBubble key={m.id} role={m.role} content={m.content} />
      ))}
      {loading && (
        <div className="flex justify-start">
          <div
            className="rounded-2xl px-4 py-2.5 text-[13px]"
            style={{ backgroundColor: SURF2, color: MUTED, border: `1px solid ${BORDER}` }}
          >
            Pensando…
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
