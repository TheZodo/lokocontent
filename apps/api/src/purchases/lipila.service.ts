import { Injectable, Logger } from '@nestjs/common'

const DEFAULT_BASE_URL = 'https://api.lipila.dev'
const DEFAULT_USD_TO_ZMW = 25

export interface LipilaCardCustomerInfo {
  firstName: string
  lastName: string
  phoneNumber: string
  city: string
  country: string
  address: string
  zip: string
  email: string
}

export interface LipilaCardCollectionRequest {
  referenceId: string
  amount: number
  narration: string
  accountNumber: string
  currency: string
  backUrl: string
  redirectUrl: string
}

export interface LipilaCardCollectionResponse {
  cardRedirectionUrl: string
  referenceId: string
  identifier: string
  status: string
  amount: number
  currency: string
}

export interface LipilaMobileMoneyRequest {
  referenceId: string
  amount: number
  narration: string
  accountNumber: string
  currency: string
  email?: string
}

export interface LipilaMobileMoneyResponse {
  referenceId: string
  identifier: string
  status: string
  amount: number
  currency: string
  paymentType?: string
  cardRedirectionUrl: null
}

@Injectable()
export class LipilaService {
  private readonly logger = new Logger(LipilaService.name)

  private getBaseUrl(): string {
    return process.env.LIPILA_BASE_URL ?? DEFAULT_BASE_URL
  }

  private getApiKey(): string {
    const key = process.env.LIPILA_API_KEY
    if (!key) {
      throw new Error('LIPILA_API_KEY is not configured')
    }
    return key
  }

  private getCallbackUrl(): string {
    const url = process.env.LIPILA_CALLBACK_URL
    if (!url) {
      throw new Error('LIPILA_CALLBACK_URL is not configured')
    }
    return url
  }

  /** Convert USD amount to ZMW for Lipila (uses LIPILA_USD_TO_ZMW env or default). */
  getAmountInZMW(amountUsd: number): number {
    const rate = process.env.LIPILA_USD_TO_ZMW
      ? Number(process.env.LIPILA_USD_TO_ZMW)
      : DEFAULT_USD_TO_ZMW
    return Math.round(amountUsd * rate * 100) / 100
  }

  async createCardCollection(
    customerInfo: LipilaCardCustomerInfo,
    collectionRequest: LipilaCardCollectionRequest,
  ): Promise<LipilaCardCollectionResponse> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/api/v1/collections/card`
    const apiKey = this.getApiKey()
    const callbackUrl = this.getCallbackUrl()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        callbackUrl,
      },
      body: JSON.stringify({
        customerInfo,
        collectionRequest,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      this.logger.warn(`Lipila card collection failed: ${res.status} ${text}`)
      throw new Error(`Lipila card collection failed: ${res.status}`)
    }

    const data = (await res.json()) as LipilaCardCollectionResponse
    return data
  }

  async createMobileMoneyCollection(
    params: LipilaMobileMoneyRequest,
  ): Promise<LipilaMobileMoneyResponse> {
    const baseUrl = this.getBaseUrl()
    const url = `${baseUrl}/api/v1/collections/mobile-money`
    const apiKey = this.getApiKey()
    const callbackUrl = this.getCallbackUrl()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        callbackUrl,
      },
      body: JSON.stringify({
        referenceId: params.referenceId,
        amount: params.amount,
        narration: params.narration,
        accountNumber: params.accountNumber,
        currency: params.currency,
        ...(params.email && { email: params.email }),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      this.logger.warn(
        `Lipila mobile money collection failed: ${res.status} ${text}`,
      )
      throw new Error(`Lipila mobile money collection failed: ${res.status}`)
    }

    const data = (await res.json()) as LipilaMobileMoneyResponse
    return data
  }
}
