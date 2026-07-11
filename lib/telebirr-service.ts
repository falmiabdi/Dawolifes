import { telebirrConfig } from './telebirr-config'
import { signRequestObject, createTimeStamp, createNonceStr, createMerchantOrderId } from './telebirr-utils'
import { Agent } from 'undici'

const httpsAgent = new Agent({ connect: { rejectUnauthorized: false } })

async function telebirrFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    dispatcher: httpsAgent,
  } as any)
}

export interface CreateOrderParams {
  title: string
  amount: string
}

export interface CreateOrderResult {
  toPayUrl: string
  merchOrderId: string
  prepayId: string
}

function sanitizeTitle(title: string): string {
  return title.replace(/[^a-zA-Z0-9 .,@'_\-]/g, '')
}

async function applyFabricToken(): Promise<string> {
  const response = await telebirrFetch(`${telebirrConfig.baseUrl}/payment/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': telebirrConfig.fabricAppId,
    },
    body: JSON.stringify({ appSecret: telebirrConfig.appSecret }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to apply fabric token: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  return data.token
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const sanitizedTitle = sanitizeTitle(params.title)
  const fabricToken = await applyFabricToken()
  const merchOrderId = createMerchantOrderId()

  const bizContent: Record<string, any> = {
    trade_type: 'H5',
    appid: telebirrConfig.merchantAppId,
    merch_code: telebirrConfig.merchantCode,
    merch_order_id: merchOrderId,
    title: sanitizedTitle,
    total_amount: String(params.amount),
    trans_currency: 'ETB',
    timeout_express: '120m',
    payee_identifier: telebirrConfig.merchantCode,
    payee_identifier_type: '04',
    payee_type: '5000',
  }

  if (telebirrConfig.notifyUrl) {
    bizContent.notify_url = telebirrConfig.notifyUrl
  }

  if (telebirrConfig.redirectUrl) {
    bizContent.redirect_url = telebirrConfig.redirectUrl
  }

  const reqObject: Record<string, any> = {
    timestamp: createTimeStamp(),
    nonce_str: createNonceStr(),
    method: 'payment.preorder',
    version: '1.0',
    biz_content: bizContent,
  }

  reqObject.sign = signRequestObject(reqObject)
  reqObject.sign_type = 'SHA256WithRSA'

  const response = await telebirrFetch(`${telebirrConfig.baseUrl}/payment/v1/merchant/preOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': telebirrConfig.fabricAppId,
      Authorization: fabricToken,
    },
    body: JSON.stringify(reqObject),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Failed to create order: ${response.status} - ${errText}`)
  }

  const data = await response.json()

  if (data.return_code !== '000000' && !data.biz_content?.prepay_id) {
    throw new Error(`TeleBirr error: ${data.return_code} - ${data.return_msg || 'Unknown error'}`)
  }

  const prepayId = data.biz_content.prepay_id
  const toPayUrl = data.biz_content.to_pay_url || ''

  if (!toPayUrl) {
    throw new Error('TeleBirr did not return a payment URL. Ensure H5 trade type is enabled for your merchant account.')
  }

  return { toPayUrl, merchOrderId, prepayId }
}
