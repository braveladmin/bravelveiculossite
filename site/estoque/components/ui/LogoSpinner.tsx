"use client"

import Image from "next/image"
import { motion } from "motion/react"

export function LogoSpinner({ fullScreen = true, size = 64 }: { fullScreen?: boolean; size?: number }) {
  const logoSize = Math.round(size * 0.56)

  return (
    <div
      className={fullScreen ? "fixed inset-0 z-[100] flex items-center justify-center" : "flex items-center justify-center py-16"}
      style={{ backgroundColor: fullScreen ? "#0a0a0a" : "transparent" }}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: "2.5px solid rgba(204,17,17,0.18)", borderTopColor: "#cc1111" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/bravel-logo.png"
            alt="Bravel Veículos"
            width={logoSize}
            height={logoSize}
            className="rounded-xl"
            priority
          />
        </motion.div>
      </div>
    </div>
  )
}
