'use client'

import { useEffect } from 'react'
import { useCapacitor } from '@/lib/capacitor-hooks'

export function CapacitorInit() {
  const { isNative } = useCapacitor()

  useEffect(() => {
    if (!isNative) return

    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)')
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)')
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)')
    document.body.style.setProperty('padding-top', 'var(--sat)')
    document.body.style.setProperty('padding-bottom', 'var(--sab)')

    document.documentElement.classList.add('native-platform')
  }, [isNative])

  return null
}
