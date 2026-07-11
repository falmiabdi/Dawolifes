import crypto from 'crypto'
import { telebirrConfig } from './telebirr-config'

const EXCLUDE_FIELDS = ['sign', 'sign_type', 'header', 'refund_info', 'openType', 'raw_request', 'biz_content']

function ensurePemKey(raw: string, type: 'private' | 'public'): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  const header = type === 'private' ? '-----BEGIN PRIVATE KEY-----' : '-----BEGIN PUBLIC KEY-----'
  const footer = type === 'private' ? '-----END PRIVATE KEY-----' : '-----END PUBLIC KEY-----'
  if (trimmed.includes(header)) return trimmed
  return `${header}\n${trimmed}\n${footer}`
}

function signString(text: string, privateKey: string): string {
  const pemKey = ensurePemKey(privateKey, 'private')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(text)
  sign.end()
  const signature = sign.sign({
    key: pemKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }, 'base64')
  return signature
}

export function signRequestObject(requestObject: Record<string, any>): string {
  const fields: string[] = []
  const fieldMap: Record<string, string> = {}

  for (const key in requestObject) {
    if (EXCLUDE_FIELDS.includes(key)) continue
    fields.push(key)
    fieldMap[key] = String(requestObject[key])
  }

  if (requestObject.biz_content) {
    const biz = requestObject.biz_content
    for (const key in biz) {
      if (EXCLUDE_FIELDS.includes(key)) continue
      fields.push(key)
      fieldMap[key] = String(biz[key])
    }
  }

  fields.sort()

  const signStrList = fields.map((key) => `${key}=${fieldMap[key]}`)
  const signOriginStr = signStrList.join('&')

  return signString(signOriginStr, telebirrConfig.privateKey)
}

export function createTimeStamp(): string {
  return Math.round(Date.now() / 1000).toString()
}

export function createNonceStr(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let str = ''
  for (let i = 0; i < 32; i++) {
    str += chars[Math.floor(Math.random() * chars.length)]
  }
  return str
}

export function createMerchantOrderId(): string {
  return Date.now().toString()
}

export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  try {
    const pemKey = ensurePemKey(publicKey, 'public')
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(data)
    verify.end()
    return verify.verify(pemKey, signature, 'base64')
  } catch {
    return false
  }
}

export function buildNotifySignString(body: Record<string, any>): string {
  const exclude = ['sign', 'sign_type']
  const fields: string[] = []
  const fieldMap: Record<string, string> = {}

  for (const key in body) {
    if (exclude.includes(key)) continue
    fields.push(key)
    fieldMap[key] = typeof body[key] === 'string' ? body[key] : JSON.stringify(body[key])
  }

  fields.sort()
  return fields.map((key) => `${key}=${fieldMap[key]}`).join('&')
}
