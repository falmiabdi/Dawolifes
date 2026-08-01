'use client'

let cachedUrl: string | null = null
let patched = false
let isNativePlatform = false
let nativeResolvePromise: Promise<string> | null = null
let rawFetch: typeof fetch | undefined

const DEFAULT_API_URL = 'http://localhost:4000'
const localApiOrigins = [DEFAULT_API_URL]

function rewriteLocalApiOrigin(url: string, baseUrl: string): string {
  const origins = [DEFAULT_API_URL, defaultApiUrl()]
  for (const origin of origins) {
    if (origin && url.startsWith(origin)) {
      return `${baseUrl}${url.slice(origin.length)}`
    }
  }
  return url
}

function defaultApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}

function isDetectableNative(): boolean {
  try {
    const Capacitor = require('@capacitor/core').Capacitor
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

// On a real phone reachable addresses differ per setup:
//  - "localhost" works when the app was launched with `adb reverse tcp:4000 tcp:4000` (USB)
//  - the baked NEXT_PUBLIC_API_URL (LAN IP) works when phone + PC share Wi-Fi
function nativeCandidates(): string[] {
  const list: string[] = []
  const env = process.env.NEXT_PUBLIC_API_URL
  if (env && env !== DEFAULT_API_URL) list.push(env)
  list.push(DEFAULT_API_URL)
  return list
}

async function probeUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const fetcher = rawFetch || (typeof window !== 'undefined' ? window.fetch : undefined) || fetch
    const res = await fetcher(`${url}/api/health`, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok ? url : null
  } catch {
    return null
  }
}

export async function resolveNativeApiUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl
  if (nativeResolvePromise) return nativeResolvePromise

  nativeResolvePromise = (async () => {
    const candidates = nativeCandidates()
    const winner = await new Promise<string | null>((resolve) => {
      let settled = 0
      let found: string | null = null
      for (const candidate of candidates) {
        probeUrl(candidate).then((url) => {
          settled += 1
          if (url && !found) {
            found = url
            resolve(url)
            return
          }
          if (settled === candidates.length && !found) resolve(null)
        })
      }
    })
    if (winner) cachedUrl = winner
    return cachedUrl || candidates[0]
  })()

  return nativeResolvePromise
}

export function getApiUrl(): string {
  if (cachedUrl) return cachedUrl

  if (isDetectableNative()) {
    isNativePlatform = true
    cachedUrl = defaultApiUrl()
    // Upgrade to a working host without blocking the first paint
    resolveNativeApiUrl().then((url) => {
      if (url && url !== cachedUrl) cachedUrl = url
    })
    return cachedUrl
  }

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

  cachedUrl = defaultApiUrl()
  return cachedUrl
}

// Waits until the native API host is confirmed reachable (used by auth / data calls).
export async function getApiUrlAsync(): Promise<string> {
  if (cachedUrl) return cachedUrl
  if (isDetectableNative()) {
    isNativePlatform = true
    return resolveNativeApiUrl()
  }
  return getApiUrl()
}

export function getWsUrl(path = '/ws'): string {
  return `${getApiUrl().replace(/^http/, 'ws')}${path}`
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg'
  return rewriteLocalApiOrigin(url, getApiUrl())
}

export function patchFetchForCapacitor() {
  if (patched || typeof window === 'undefined') return
  try {
    const Capacitor = require('@capacitor/core').Capacitor
    isNativePlatform = Capacitor.isNativePlatform()
  } catch {
    return
  }
  if (!isNativePlatform) return

  const originalFetch = window.fetch
  rawFetch = originalFetch.bind(window)

  getApiUrl()

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    let url: string
    if (input instanceof Request) {
      url = input.url
    } else if (typeof input === 'string') {
      url = input
    } else {
      url = input.toString()
    }

    // Wait until a reachable API host is confirmed so first-load requests
    // don't hit an unreachable default (localhost on a phone, etc.).
    const baseUrl = await resolveNativeApiUrl()

    const rewrittenUrl = rewriteLocalApiOrigin(url, baseUrl)
    if (rewrittenUrl !== url) {
      url = rewrittenUrl
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
