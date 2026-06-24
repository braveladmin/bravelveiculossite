"use client"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const ACCENT = "#cc1111"
const TEXT   = "#ffffff"

type Props = {
  role: "user" | "assistant"
  content: string
}

export function ChatBubble({ role, content }: Props) {
  const isUser = role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{
          backgroundColor: isUser ? ACCENT : SURF2,
          color: TEXT,
          border: isUser ? "none" : `1px solid ${BORDER}`,
        }}
      >
        {content}
      </div>
    </div>
  )
}
