"use client"

import { useState } from "react"
import { Button } from "@heroui/react"
import { Send } from "lucide-react"

const SURF2  = "#111111"
const BORDER = "rgba(255,255,255,0.08)"
const TEXT   = "#ffffff"
const ACCENT = "#cc1111"

type Props = {
  disabled: boolean
  onSend: (text: string) => void
}

export function ChatInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("")

  function handleSubmit() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue("")
  }

  return (
    <div className="flex items-end gap-2 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder="Digite um comando, ex: marca o Civic como vendido"
        className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-colors"
        style={{ backgroundColor: SURF2, border: `1px solid ${BORDER}`, color: TEXT, maxHeight: "120px" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="font-semibold shrink-0"
        onPress={handleSubmit}
        isDisabled={disabled || !value.trim()}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}
