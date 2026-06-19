"use client"

import { type ReactNode, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  { href: "/estoque",      label: "Estoque" },
  { href: "/estoque/novo", label: "Novo carro" },
  { href: "/midias",       label: "Central de Mídias" },
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [userName, setUserName] = useState<string | null>(null)

  // Render plain children on the login page (no header)
  if (pathname === '/login') {
    return <>{children}</>
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setUserName(data?.name ?? user.email?.split('@')[0] ?? 'BV')
        })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'BV'

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6"
        style={{ height: "64px", backgroundColor: "#181818", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Logo */}
        <Link href="/estoque" className="flex items-center gap-3 shrink-0">
          <Image src="/bravel-logo.png" alt="Bravel Veículos" width={36} height={36} className="w-9 h-9 rounded-xl" priority />
          <div className="leading-none">
            <p className="text-[15px] font-black text-white tracking-wider">BRAVEL</p>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#cc1111", marginTop: "3px" }}>
              Estoque
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1 ml-6">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/estoque"
                ? pathname === href || (pathname.startsWith("/estoque/") && pathname !== "/estoque/novo")
                : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  backgroundColor: active ? "#cc1111" : "transparent",
                  color:           active ? "#fff"    : "#777777",
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Mobile quick add */}
        <Link
          href="/estoque/novo"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 rounded-xl shrink-0 sm:hidden"
          style={{ height: "36px", background: "linear-gradient(135deg, #cc1111, #a80e0e)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
          style={{ color: "#777777", border: "1px solid rgba(255,255,255,0.08)" }}
          title="Sair"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background:  "linear-gradient(135deg, #cc1111, #a80e0e)",
            boxShadow:   "0 0 0 2px rgba(204,17,17,0.25)",
          }}
          title={userName ?? undefined}
        >
          <span className="text-[11px] font-black text-white select-none">{initials}</span>
        </div>
      </header>

      <main style={{ paddingTop: "64px" }}>
        {children}
      </main>
    </div>
  )
}
