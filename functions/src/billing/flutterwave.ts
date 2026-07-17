/**
 * Flutterwave Payment Provider Adapter
 *
 * Implements the PaymentProvider interface for Flutterwave.
 * Flutterwave is the joint-primary provider alongside Paystack for Nigerian Naira.
 *
 * Key behaviors:
 *   - ~1.4% local card transactions
 *   - ~3.8% international
 *   - Card tokenisation and NIBSS e-mandate direct debit for recurring
 *   - CBN Microfinance Bank licence (April 2026)
 *   - No built-in proration — platform handles it
 *   - Webhook signature: configured verify hash
 *
 * Note: This is a stub implementation. Full production integration
 * requires Flutterwave API keys in environment variables.
 */

import type {
  PaymentProvider,
  CheckoutParams,
  CheckoutSession,
  PaymentVerification,
  ChargeParams,
  RefundResult,
} from './provider'

const FLUTTERWAVE_BASE = 'https://api.flutterwave.com/v3'
const SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY ?? ''
const VERIFY_HASH = process.env.FLUTTERWAVE_VERIFY_HASH ?? ''

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export const flutterwaveProvider: PaymentProvider = {
  id: 'flutterwave',

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    if (!SECRET_KEY) throw new Error('Flutterwave secret key not configured')

    const body = {
      tx_ref: `staffiq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      amount: params.amount / 100, // Flutterwave uses main unit (Naira), not kobo
      currency: params.currency,
      redirect_url: params.callbackUrl,
      customer: { email: params.email },
      meta: {
        tenantId: params.tenantId,
        planId: params.planId,
        billingInterval: params.billingInterval,
      },
    }

    const res = await fetch(`${FLUTTERWAVE_BASE}/payments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Flutterwave checkout failed: ${(err as Record<string, unknown>).message ?? res.statusText}`)
    }

    const data = (await res.json()) as {
      status: string
      data: { link: string }
    }

    if (data.status !== 'success') {
      throw new Error('Flutterwave checkout initialization failed')
    }

    return {
      sessionId: body.tx_ref,
      authorizationUrl: data.data.link,
      reference: body.tx_ref,
    }
  },

  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    if (!SECRET_KEY) throw new Error('Flutterwave secret key not configured')

    const res = await fetch(`${FLUTTERWAVE_BASE}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: headers(),
    })

    if (!res.ok) throw new Error(`Flutterwave verification failed: ${res.statusText}`)

    const data = (await res.json()) as {
      status: string
      data: {
        status: string
        amount: number
        currency: string
        tx_ref: string
        card?: {
          first_6digits: string
          last_4digits: string
          type: string
        }
        customer?: { id: number }
      }
    }

    if (data.status !== 'success') {
      return { success: false, amount: 0, currency: 'NGN', reference: transactionId }
    }

    const tx = data.data
    const success = tx.status === 'successful'

    return {
      success,
      amount: tx.amount * 100, // Convert back to kobo
      currency: tx.currency,
      reference: tx.tx_ref,
      customerId: tx.customer ? String(tx.customer.id) : undefined,
      authorization: tx.card
        ? {
            authorizationCode: tx.tx_ref,
            cardType: tx.card.type,
            last4: tx.card.last_4digits,
            expMonth: '',
            expYear: '',
            bank: '',
          }
        : undefined,
    }
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!VERIFY_HASH) return false
    const crypto = require('crypto')
    const expected = crypto.createHmac('sha256', VERIFY_HASH).update(rawBody).digest('hex')
    return expected === signature
  },

  async chargeAuthorization(_params: ChargeParams): Promise<PaymentVerification> {
    // Flutterwave recurring charges use tokenised cards via the tokenised charge endpoint.
    // Full implementation requires card token from initial payment.
    throw new Error('Flutterwave recurring charge not yet implemented — use Paystack for recurring billing')
  },

  async createRefund(_transactionId: string, _amount?: number): Promise<RefundResult> {
    throw new Error('Flutterwave refund not yet implemented')
  },

  getEventType(rawBody: unknown): string {
    const body = rawBody as Record<string, unknown> | undefined
    return String(body?.event ?? '')
  },

  getEventId(rawBody: unknown): string {
    const body = rawBody as Record<string, unknown> | undefined
    const data = body?.data as Record<string, unknown> | undefined
    return String(data?.id ?? `${body?.event ?? 'unknown'}-${Date.now()}`)
  },
}
