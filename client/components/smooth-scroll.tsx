'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<any>(null)
  const pathname = usePathname()

  useEffect(() => {
    let isNative = false
    try {
      const Capacitor = require('@capacitor/core').Capacitor
      isNative = Capacitor.isNativePlatform()
    } catch {}

    if (!isNative) return

    async function initLenis() {
      const Lenis = (await import('lenis')).default
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
      lenisRef.current = lenis
    }

    initLenis()

    return () => {
      lenisRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  return <>{children}</>
}
