'use client'

let cachedUrl: string | null = null
let patched = false

export function getApiUrl(): string {
  if (cachedUrl) return cachedUrl

  const fallback = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  try {
    const Capacitor = require('@capacitor/core').Capacitor
    if (Capacitor.isNativePlatform()) {
      if (Capacitor.getPlatform() === 'android') {
        cachedUrl = 'http://10.0.2.2:4000'
      } else {
        cachedUrl = fallback
      }
      return cachedUrl
    }
  } catch {}

  cachedUrl = fallback
  return cachedUrl
}

export function patchFetchForCapacitor() {
  if (patched || typeof window === 'undefined') return
  let isNative = false
  try {
    const Capacitor = require('@capacitor/core').Capacitor
    isNative = Capacitor.isNativePlatform()
  } catch {}
  if (!isNative) return

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

patchFetchForCapacitor()
