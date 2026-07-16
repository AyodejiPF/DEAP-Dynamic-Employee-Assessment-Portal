/**
 * Paystack Payment Provider Adapter
 *
 * Implements the PaymentProvider interface for Paystack.
 * Paystack is the primary provider for Nigerian Naira transactions.
 *
 * Key behaviors:
 *   - 1.5% + NGN 100 local (capped NGN 2,000, waived under NGN 2,500)
 *   - 3.9% + NGN 100 international (no cap)
 *   - Subscriptions managed via plans API + recurring charge authorization
 *   - No built-in proration — the platform handles that
 *   - Webhook signature: HMAC SHA-512
 */

import * as crypto from 'crypto'
import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutSession,
  PaymentVerification,
  ChargeParams,
  RefundResult,
} from './provider'

// ─── Configuration ───────────────────────────────────────────────

const PAYSTACK_BASE = 'https://api.paystack.co'
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? ''

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

// ─── Adapter ─────────────────────────────────────────────────────

export const paystackProvider: PaymentProvider = {
  id: 'paystack',

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    const body = {
      email: params.email,
      amount: params.amount, // already in kobo/subunit
      currency: params.currency,
      callback_url: params.callbackUrl,
      metadata: {
        tenantId: params.tenantId,
        planId: params.planId,
        billingInterval: params.billingInterval,
        couponCode: params.couponCode ?? '',
        ...params.metadata,
      },
    }

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Paystack checkout failed: ${(err as Record<string, unknown>).message ?? res.statusText}`)
    }

    const data = (await res.json()) as {
      status: boolean
      data: { reference: string; authorization_url: string; access_code: string }
    }

    if (!data.status) {
      throw new Error('Paystack checkout initialization failed.')
    }

    return {
      sessionId: data.data.access_code,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    }
  },

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: headers(),
    })

    if (!res.ok) {
      throw new Error(`Paystack verification failed: ${res.statusText}`)
    }

    const data = (await res.json()) as {
      status: boolean
      data: {
        status: string
        amount: number
        currency: string
        reference: string
        customer: { id: number; email: string }
        authorization: {
          authorization_code: string
          card_type: string
          last4: string
          exp_month: string
          exp_year: string
          bank: string
        }
        channel: string
      }
    }

    if (!data.status) {
      return { success: false, amount: 0, currency: 'NGN', reference }
    }

    const tx = data.data
    const success = tx.status === 'success'

    return {
      success,
      amount: tx.amount,
      currency: tx.currency,
      reference: tx.reference,
      customerId: tx.customer ? String(tx.customer.id) : undefined,
      channel: tx.channel,
      authorization: tx.authorization
        ? {
            authorizationCode: tx.authorization.authorization_code,
            cardType: tx.authorization.card_type,
            last4: tx.authorization.last4,
            expMonth: tx.authorization.exp_month,
            expYear: tx.authorization.exp_year,
            bank: tx.authorization.bank,
          }
        : undefined,
    }
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!SECRET_KEY) return false
    const expected = crypto
      .createHmac('sha512', SECRET_KEY)
      .update(rawBody)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  },

  async chargeAuthorization(params: ChargeParams): Promise<PaymentVerification> {
    const body = {
      authorization_code: params.authorizationCode,
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata ?? {},
    }

    const res = await fetch(`${PAYSTACK_BASE}/transaction/charge_authorization`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Paystack charge failed: ${(err as Record<string, unknown>).message ?? res.statusText}`)
    }

    const data = (await res.json()) as {
      status: boolean
      data: {
        status: string
        amount: number
        currency: string
        reference: string
        channel: string
      }
    }

    if (!data.status) {
      return { success: false, amount: params.amount, currency: params.currency, reference: '' }
    }

    return {
      success: data.data.status === 'success',
      amount: data.data.amount,
      currency: data.data.currency,
      reference: data.data.reference,
      channel: data.data.channel,
    }
  },

  async createRefund(transactionId: string, amount?: number): Promise<RefundResult> {
    const body: Record<string, unknown> = { transaction: transactionId }
    if (amount) body.amount = amount

    const res = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Paystack refund failed: ${(err as Record<string, unknown>).message ?? res.statusText}`)
    }

    const data = (await res.json()) as {
      status: boolean
      data: { id: number; amount: number; status: string }
    }

    return {
      refundId: String(data.data.id),
      amount: data.data.amount,
      status: data.data.status === 'success' ? 'processed' : 'pending',
    }
  },

  getEventType(rawBody: unknown): string {
    const body = rawBody as Record<string, unknown> | undefined
    return String(body?.event ?? '')
  },

  getEventId(rawBody: unknown): string {
    const body = rawBody as Record<string, unknown> | undefined
    // Paystack uses data.id for idempotency
    const data = body?.data as Record<string, unknown> | undefined
    return String(data?.id ?? `${body?.event ?? 'unknown'}-${Date.now()}`)
  },
}
