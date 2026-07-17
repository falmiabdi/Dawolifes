import { chapaConfig } from './chapa-config'

export interface InitializeTransactionParams {
  amount: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  txRef: string
  currency?: string
  returnUrl?: string
  callbackUrl?: string
  title?: string
  description?: string
}

export interface InitializeTransactionResult {
  checkoutUrl: string
  txRef: string
}

export interface VerifyTransactionResult {
  status: string
  txRef: string
  refId: string
  amount: string
  currency: string
  charge: string
  method: string
}

function generateTxRef(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `DELAHARME-${timestamp}-${random}`
}

export function createTxRef(): string {
  return generateTxRef()
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Chapa returned non-JSON (${response.status}): ${text.substring(0, 300)}`)
  }
}

export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResult> {
  if (!chapaConfig.secretKey) {
    throw new Error('CHAPA_SECRET_KEY is not set in environment variables')
  }

  const body: Record<string, any> = {
    amount: params.amount,
    currency: params.currency || 'ETB',
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    phone_number: params.phoneNumber,
    tx_ref: params.txRef,
  }

  const returnUrl = params.returnUrl || chapaConfig.returnUrl
  if (returnUrl) body.return_url = returnUrl

  const callbackUrl = params.callbackUrl || chapaConfig.webhookUrl
  if (callbackUrl) body.callback_url = callbackUrl

  if (params.title) {
    body['customization[title]'] = params.title
  }
  if (params.description) {
    body['customization[description]'] = params.description
  }

  console.log('[Chapa] POST', `${chapaConfig.apiUrl}/transaction/initialize`)
  console.log('[Chapa] Body:', JSON.stringify(body))

  const response = await fetch(`${chapaConfig.apiUrl}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${chapaConfig.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  console.log('[Chapa] Response status:', response.status)

  const data = await safeJson(response)
  console.log('[Chapa] Response:', JSON.stringify(data))

  if (!response.ok || data.status === 'failed') {
    throw new Error(data.message || `Chapa error: ${response.status}`)
  }

  const checkoutUrl = data.data?.checkout_url
  if (!checkoutUrl) {
    throw new Error('Chapa did not return a checkout URL. Response: ' + JSON.stringify(data))
  }

  return { checkoutUrl, txRef: params.txRef }
}

export async function verifyTransaction(txRef: string): Promise<VerifyTransactionResult> {
  if (!chapaConfig.secretKey) {
    throw new Error('CHAPA_SECRET_KEY is not set in environment variables')
  }

  const response = await fetch(`${chapaConfig.apiUrl}/transaction/verify/${txRef}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${chapaConfig.secretKey}`,
    },
  })

  const data = await safeJson(response)

  if (!response.ok) {
    throw new Error(data.message || `Chapa verify error: ${response.status}`)
  }

  const result = data.data

  return {
    status: result?.status || 'unknown',
    txRef: result?.tx_ref || txRef,
    refId: result?.ref_id || '',
    amount: result?.amount || '',
    currency: result?.currency || 'ETB',
    charge: result?.charge || '',
    method: result?.method || '',
  }
}
