export const chapaConfig = {
  secretKey: process.env.CHAPA_SECRET_KEY || 'CHASECK_test-xxx',
  apiUrl: 'https://api.chapa.co/v1',
  webhookUrl: process.env.CHAPA_WEBHOOK_URL || 'http://localhost:4000/api/chapa/webhook',
  returnUrl: process.env.CHAPA_RETURN_URL || 'http://localhost:3000/payment-success',
}

export const telebirrConfig = {
  baseUrl: 'https://api.telebirr.com',
  fabricAppId: process.env.TELEBIRR_FABRIC_APP_ID || '',
  fabricAppSecret: process.env.TELEBIRR_FABRIC_APP_SECRET || '',
  merchantCode: process.env.TELEBIRR_MERCHANT_CODE || '',
  merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID || '',
  privateKey: process.env.TELEBIRR_PRIVATE_KEY || '',
  publicKey: process.env.TELEBIRR_PUBLIC_KEY || '',
  notifyUrl: process.env.TELEBIRR_NOTIFY_URL || 'http://localhost:4000/api/telebirr/notify',
  redirectUrl: process.env.TELEBIRR_REDIRECT_URL || 'http://localhost:3000/payment-success',
}
