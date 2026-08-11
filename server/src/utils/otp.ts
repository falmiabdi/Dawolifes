import crypto from 'crypto'

export const OTP_EXPIRY_MS = 60 * 60 * 1000

export function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0')
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS)
}
