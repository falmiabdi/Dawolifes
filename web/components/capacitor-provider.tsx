'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

interface CapacitorProviderProps {
  children: React.ReactNode
}

export function CapacitorProvider({ children }: CapacitorProviderProps) {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  return (
    <>
      {children}
      {isNative && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-orange-500 z-50" />
      )}
    </>
  )
}
