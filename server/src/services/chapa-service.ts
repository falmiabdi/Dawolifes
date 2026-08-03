import { signAccessToken, signRefreshToken } from '../utils/jwt.js'

export async function initializeTransaction(data: {
  title: string
  amount: string
  propertyId?: string
  propertyTitle?: string
  paymentType: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
}) {
  const txRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  // Chapa API call would go here
  const checkoutUrl = `https://checkout.chapa.co/hosted/${txRef}`

  return {
    checkoutUrl,
    txRef,
    amount: data.amount,
    title: data.title,
  }
}

export async function verifyTransaction(txRef: string) {
  // Chapa API verification would go here
  return {
    status: 'Completed',
    txRef,
    message: 'Transaction verified',
  }
}
