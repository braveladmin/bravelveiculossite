"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import JSZip from "jszip"
import { createClient } from "@/lib/supabase/client"
import type { MediaType, Vehicle } from "@/lib/types"

// pixelRatio 4 sobre o quadro 360x640 do preview gera 1440x2560 — acima do mínimo
// 1080x1920 do Instagram, então a arte sai nítida mesmo depois do Instagram comprimir/redimensionar.
const EXPORT_OPTIONS = { pixelRatio: 4, cacheBust: true, backgroundColor: "#0a0a0a", style: { borderRadius: "0px" } } as const

async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts) await document.fonts.ready
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  link.click()
}

/**
 * Pipeline de captura/upload da arte (Story/Post/Carrossel), extraído pra ser
 * compartilhado entre o wizard de mídias (PreviewFinal.tsx) e a prévia de mídia
 * do chat de Comandos por IA (MediaPreviewCard.tsx) — mesma fonte de verdade
 * pro pixelRatio, espera de fontes e zip do carrossel.
 */
export function useArtCapture(mediaType: MediaType, vehicle: Pick<Vehicle, "brand" | "name">) {
  const previewWrapRef  = useRef<HTMLDivElement>(null)
  const hiddenSlidesRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadErr, setDownloadErr] = useState<string | null>(null)

  function slug() {
    return `${vehicle.brand}-${vehicle.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  }

  async function captureArtImages(): Promise<string[]> {
    await waitForFonts()
    if (mediaType === "story") {
      const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
      if (!node) throw new Error("Preview do Story não encontrado")
      return [await toPng(node, EXPORT_OPTIONS)]
    }

    const nodes = hiddenSlidesRef.current?.querySelectorAll(".media-preview") ?? []
    const dataUrls: string[] = []
    for (const node of Array.from(nodes)) {
      dataUrls.push(await toPng(node as HTMLElement, EXPORT_OPTIONS))
    }
    return dataUrls
  }

  async function uploadArtImages(dataUrls: string[]): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < dataUrls.length; i++) {
      const blob = await (await fetch(dataUrls[i])).blob()
      const path = `instagram-posts/${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.png`
      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(path, blob, { contentType: "image/png" })
      if (uploadError) throw new Error(uploadError.message)
      const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleDownload() {
    setDownloading(true)
    setDownloadErr(null)
    try {
      await waitForFonts()
      if (mediaType === "carousel") {
        const nodes = hiddenSlidesRef.current?.querySelectorAll(".media-preview") ?? []
        const zip = new JSZip()
        let i = 0
        for (const node of Array.from(nodes)) {
          const dataUrl = await toPng(node as HTMLElement, EXPORT_OPTIONS)
          const base64 = dataUrl.split(",")[1]
          zip.file(`carousel-${slug()}-${++i}.png`, base64, { base64: true })
        }
        const zipBlob = await zip.generateAsync({ type: "blob" })
        downloadDataUrl(URL.createObjectURL(zipBlob), `carousel-${slug()}.zip`)
      } else {
        const node = previewWrapRef.current?.querySelector(".media-preview") as HTMLElement | null
        if (!node) return
        const dataUrl = await toPng(node, EXPORT_OPTIONS)
        downloadDataUrl(dataUrl, `${mediaType}-${slug()}.png`)
      }
    } catch {
      setDownloadErr("Não consegui gerar a imagem. Tenta de novo.")
    }
    setDownloading(false)
  }

  return { previewWrapRef, hiddenSlidesRef, downloading, downloadErr, handleDownload, captureArtImages, uploadArtImages }
}
