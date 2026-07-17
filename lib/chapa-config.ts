export const chapaConfig = {
  secretKey: process.env.CHAPA_SECRET_KEY || '',
  publicKey: process.env.CHAPA_PUBLIC_KEY || '',
  apiUrl: process.env.CHAPA_API_URL || 'https://api.chapa.co/v1',
  webhookUrl: process.env.CHAPA_WEBHOOK_URL || '',
  returnUrl: process.env.CHAPA_RETURN_URL || '',
}
