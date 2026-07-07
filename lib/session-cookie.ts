export interface SessionPayload {
  userId: string
  email: string
  role: string
  status: string
}

const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(data: string): Promise<string> {
  const key = await getKey()
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64(new Uint8Array(signature))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return result === 0
}

export async function createSessionCookie(session: SessionPayload) {
  const payload = btoa(encodeURIComponent(JSON.stringify(session)))
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function readSessionCookie(value?: string | null) {
  if (!value) {
    return null
  }

  const [payload, signature] = value.split('.')
  if (!payload || !signature) {
    return null
  }

  const expected = await sign(payload)
  if (!timingSafeEqual(expected, signature)) {
    return null
  }

  try {
    return JSON.parse(decodeURIComponent(atob(payload))) as SessionPayload
  } catch {
    return null
  }
}
