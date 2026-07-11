function parsePrivateKey(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (trimmed.includes('-----BEGIN PRIVATE KEY-----')) {
    return trimmed
  }
  return `-----BEGIN PRIVATE KEY-----\n${trimmed}\n-----END PRIVATE KEY-----`
}

function parsePublicKey(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (trimmed.includes('-----BEGIN PUBLIC KEY-----')) {
    return trimmed
  }
  return `-----BEGIN PUBLIC KEY-----\n${trimmed}\n-----END PUBLIC KEY-----`
}

export const telebirrConfig = {
  baseUrl: process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway',
  fabricAppId: process.env.TELEBIRR_FABRIC_APP_ID || '',
  appSecret: process.env.TELEBIRR_APP_SECRET || '',
  merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID || '',
  merchantCode: process.env.TELEBIRR_MERCHANT_CODE || '',
  privateKey: parsePrivateKey(process.env.TELEBIRR_PRIVATE_KEY || ''),
  publicKey: parsePublicKey(process.env.TELEBIRR_PUBLIC_KEY || ''),
  notifyUrl: process.env.TELEBIRR_NOTIFY_URL || '',
  redirectUrl: process.env.TELEBIRR_REDIRECT_URL || '',
}
