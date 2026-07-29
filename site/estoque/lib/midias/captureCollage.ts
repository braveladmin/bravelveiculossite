import { STORE_NAME } from "@/lib/constants"
import type { Vehicle } from "@/lib/types"

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1503736334956-4c8f8e4733e7?w=800&q=80&auto=format&fit=crop"

// Carrega imagem via proxy server-side → blob URL → HTMLImageElement.
// Revoga o blob URL imediatamente após o load pra liberar memória.
async function loadImg(src: string): Promise<HTMLImageElement> {
  let blobUrl: string | null = null
  try {
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      const fetchUrl = src.startsWith("/")
        ? src
        : `/admin/api/image-proxy?url=${encodeURIComponent(src)}`
      const res = await fetch(fetchUrl)
      if (res.ok) blobUrl = URL.createObjectURL(await res.blob())
    }
  } catch { /* usa src original */ }

  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image()
    img.onload = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); resolve(img) }
    img.onerror = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); resolve(img) }
    img.src = blobUrl ?? src
  })
}

// Desenha imagem com comportamento object-cover na área (x, y, w, h).
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  if (!img.naturalWidth || !img.naturalHeight) return
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / s, sh = h / s
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) / 2
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  ctx.restore()
}

// Degradê escuro do rodapé, igual ao preview React.
function drawGrad(ctx: CanvasRenderingContext2D, y: number, h: number, w: number) {
  const g = ctx.createLinearGradient(0, y + h, 0, y)
  g.addColorStop(0, "rgba(10,10,10,0.9)")
  g.addColorStop(0.7, "rgba(10,10,10,0.3)")
  g.addColorStop(1, "rgba(10,10,10,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, y, w, h)
}

/**
 * Renderiza o story-collage de 3 fotos direto no Canvas 2D — sem html2canvas.
 * Carrega 1 foto por vez pra não estourar a memória do iOS.
 */
export async function captureCollage(vehicle: Vehicle): Promise<Blob> {
  await document.fonts.ready

  const SC   = 4                               // scale
  const W    = 360 * SC                        // 1440
  const BH   = Math.round((640 * SC) / 3)     // ~853 (altura de cada banda)
  const H    = BH * 3                          // ~2559
  const PH   = Math.round(W * 0.06)           // padding horizontal (~86px)
  const PB   = Math.round(BH * 0.05)          // padding bottom (~43px)
  const RED  = "#cc1111"
  const LINE = SC * 2                          // 2px CSS × scale

  const canvas  = document.createElement("canvas")
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, H)

  const photos = vehicle.images?.length ? vehicle.images : []
  const urls = [
    photos[0] ?? PLACEHOLDER,
    photos[1] ?? photos[0] ?? PLACEHOLDER,
    photos[2] ?? photos[0] ?? PLACEHOLDER,
  ]

  const anoLinha = vehicle.yearModel
    ? `${vehicle.year}/${vehicle.yearModel}`
    : vehicle.year ? `${vehicle.year}` : ""

  const specs = [
    anoLinha || null,
    vehicle.fuel || null,
    vehicle.km
      ? `${new Intl.NumberFormat("pt-BR").format(vehicle.km)} km`
      : null,
    vehicle.transmission || null,
  ].filter(Boolean) as string[]

  const F_DISPLAY = `bold ${SC * 16}px 'Bebas Neue', sans-serif`
  const F_SM7     = `bold ${SC * 7}px 'Montserrat', sans-serif`
  const F_SM6     = `bold ${SC * 6}px 'Montserrat', sans-serif`
  const F_SM9     = `600 ${SC * 9}px 'Montserrat', sans-serif`

  ctx.textBaseline = "bottom"

  // ─── Banda 1: foto externa · nome do carro ────────────────────────────────
  const img1 = await loadImg(urls[0])
  drawCover(ctx, img1, 0, 0, W, BH)
  drawGrad(ctx, 0, BH, W)
  // Linha vermelha separadora
  ctx.fillStyle = RED
  ctx.fillRect(0, BH - LINE, W, LINE)
  // Texto
  const b1Bottom = BH - PB
  ctx.font = F_DISPLAY
  ctx.fillStyle = "#ffffff"
  ctx.fillText(vehicle.name || `${vehicle.brand} ${vehicle.model}`, PH, b1Bottom)
  ctx.font = F_SM7
  ctx.fillStyle = RED
  ctx.fillText(
    [vehicle.brand, vehicle.model].filter(Boolean).join(" · ").toUpperCase(),
    PH, b1Bottom - SC * 18
  )

  // ─── Banda 2: interior · specs + preço ───────────────────────────────────
  const img2 = await loadImg(urls[1])
  const B2 = BH
  drawCover(ctx, img2, 0, B2, W, BH)
  drawGrad(ctx, B2, BH, W)
  ctx.fillStyle = RED
  ctx.fillRect(0, B2 + BH - LINE, W, LINE)

  let curY = B2 + BH - PB

  if (vehicle.price > 0) {
    const priceStr = new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL",
    }).format(vehicle.price).replace(/,00$/, "")

    ctx.font = F_DISPLAY
    ctx.fillStyle = "#ffffff"
    ctx.fillText(priceStr, PH, curY)
    curY -= SC * 18

    // Linha vermelha acima do preço
    ctx.fillStyle = RED
    ctx.fillRect(PH, curY - LINE, Math.round(W * 0.14), LINE)
    curY -= SC * 4

    ctx.font = F_SM6
    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.fillText("VALOR A VISTA", PH, curY)
    curY -= SC * 14
  }

  if (specs.length > 0) {
    ctx.font = F_SM7
    const CPH = SC * 6   // chip padding horizontal
    const CPV = SC * 2   // chip padding vertical
    const CH  = SC * 7 + CPV * 2  // chip height (~32px)
    let chipX = PH
    curY -= CH
    for (const spec of specs) {
      const tw   = ctx.measureText(spec).width
      const chipW = tw + CPH * 2
      ctx.fillStyle = "rgba(255,255,255,0.12)"
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(chipX, curY, chipW, CH, SC * 2)
      } else {
        ctx.rect(chipX, curY, chipW, CH)
      }
      ctx.fill()
      ctx.fillStyle = "#ffffff"
      ctx.fillText(spec, chipX + CPH, curY + CH - CPV)
      chipX += chipW + SC * 4
    }
  }

  // ─── Banda 3: foto traseira · logo + loja ────────────────────────────────
  const img3 = await loadImg(urls[2])
  const B3 = BH * 2
  drawCover(ctx, img3, 0, B3, W, BH)
  drawGrad(ctx, B3, BH, W)

  // Logo da loja (same-origin — sem proxy)
  try {
    const logo = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(img)
      img.src = "/admin/bravel-logo.png"
    })
    if (logo.naturalWidth) {
      const LS = SC * 24                              // 24px CSS
      const lx = W - PH - LS
      const ly = H - Math.round(BH * 0.04) - LS - SC * 9
      ctx.save()
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(lx, ly, LS, LS, SC * 4)
      } else {
        ctx.rect(lx, ly, LS, LS)
      }
      ctx.clip()
      ctx.drawImage(logo, lx, ly, LS, LS)
      ctx.restore()
    }
  } catch { /* sem logo */ }

  // Nome da loja centralizado no rodapé
  ctx.textAlign  = "center"
  ctx.textBaseline = "bottom"
  ctx.font       = F_SM9
  ctx.fillStyle  = "rgba(255,255,255,0.7)"
  ctx.fillText(STORE_NAME, W / 2, H - Math.round(BH * 0.04))
  ctx.textAlign  = "left"

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Captura retornou vazia"))),
      "image/png"
    )
  )
}
