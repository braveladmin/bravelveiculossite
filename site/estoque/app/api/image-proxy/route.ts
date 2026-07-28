import { NextRequest, NextResponse } from "next/server"

// Hostname do Supabase desse projeto — só imagens daqui são proxied
const SUPABASE_HOST = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url")
  if (!rawUrl) return new NextResponse("Missing url", { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return new NextResponse("Invalid URL", { status: 400 })
  }

  // Bloqueia qualquer URL que não seja do nosso Supabase (previne SSRF)
  if (parsed.hostname !== SUPABASE_HOST) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const res = await fetch(rawUrl)
    if (!res.ok) return new NextResponse("Upstream error", { status: res.status })

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return new NextResponse("Proxy error", { status: 502 })
  }
}
