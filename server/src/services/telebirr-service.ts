import { v4 as uuidv4 } from 'uuid'

export async function createOrder(data: {
  title: string
  amount: string
  propertyId?: string
  propertyTitle?: string
  paymentType: string
}) {
  const merchOrderId = `TB-${uuidv4().substring(0, 8)}`
  const toPayUrl = `https://pay.telebirr.com/order/${merchOrderId}`

  return {
    toPayUrl,
    merchOrderId,
    amount: data.amount,
    title: data.title,
  }
}
