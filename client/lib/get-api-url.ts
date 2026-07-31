'use client'

let cachedUrl: string | null = null
let patched = false
let isNativePlatform = false

export function getApiUrl(): string {
  if (cachedUrl) return cachedUrl

  const fallback = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  try {
    const Capacitor = require('@capacitor/core').Capacitor
    if (Capacitor.isNativePlatform()) {
      isNativePlatform = true
      if (Capacitor.getPlatform() === 'android') {
        cachedUrl = fallback.includes('localhost')
          ? 'http://10.0.2.2:4000'
          : fallback
      } else {
        cachedUrl = fallback
      }
      return cachedUrl
    }
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const port = window.location.port
      if (port === '3000' || port === '') {
        cachedUrl = `${window.location.protocol}//${hostname}:4000`
        return cachedUrl
      }
    }
  }

  cachedUrl = fallback
  return cachedUrl
}

export function getWsUrl(path = '/ws'): string {
  return `${getApiUrl().replace(/^http/, 'ws')}${path}`
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('http://localhost:4000')) {
    const baseUrl = getApiUrl()
    return url.replace('http://localhost:4000', baseUrl)
  }
  return url
}

export function patchFetchForCapacitor() {
  if (patched || typeof window === 'undefined') return
  try {
    const Capacitor = require('@capacitor/core').Capacitor
    isNativePlatform = Capacitor.isNativePlatform()
  } catch {}
  if (!isNativePlatform) return

  const baseUrl = getApiUrl()
  const originalFetch = window.fetch

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url: string
    if (input instanceof Request) {
      url = input.url
    } else if (typeof input === 'string') {
      url = input
    } else {
      url = input.toString()
    }

    if (url.startsWith('http://localhost:4000')) {
      url = url.replace('http://localhost:4000', baseUrl)
      if (input instanceof Request) {
        input = new Request(url, input)
      } else {
        input = url
      }
    }

    return originalFetch.call(window, input, init)
  }

  patched = true
}

export function isNative(): boolean {
  return isNativePlatform
}

patchFetchForCapacitor()
