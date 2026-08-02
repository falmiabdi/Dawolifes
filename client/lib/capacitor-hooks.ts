'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { initializeCapacitorPlugins } from '@/lib/capacitor-plugins'
import { patchFetchForCapacitor } from '@/lib/get-api-url'

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform()
    setIsNative(isNativePlatform)
    if (isNativePlatform) {
      patchFetchForCapacitor()
    }
    initializeCapacitorPlugins()
    setIsReady(true)
  }, [])

  return { isNative, isReady }
}

export function useNetworkStatus() {
  const [status, setStatus] = useState({ connected: true, connectionType: 'wifi' })

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const { Network } = require('@capacitor/network')
    const updateStatus = async () => {
      const netStatus = await Network.getStatus()
      setStatus({
        connected: netStatus.connected,
        connectionType: netStatus.connectionType || 'unknown',
      })
    }

    updateStatus()
    Network.addListener('networkStatusChange', (change: any) => {
      setStatus({
        connected: change.connected,
        connectionType: change.connectionType || 'unknown',
      })
    })

    return () => {
      Network.removeAllListeners()
    }
  }, [])

  return status
}
