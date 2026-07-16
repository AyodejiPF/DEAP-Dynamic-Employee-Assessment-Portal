/**
 * Payment Provider Abstraction
 *
 * Business logic must NEVER bind to a specific payment provider.
 * All provider-specific code lives behind this interface so the
 * platform can switch providers with minimal code changes.
 *
 * Live providers: Paystack, Flutterwave
 * Ready to add: Monnify, Squad, Interswitch
 * Fallback: Stripe (for international expansion)
 */

// ─── Common Types ────────────────────────────────────────────────

export interface CheckoutParams {
  /** Amount in minor currency unit (kobo for NGN) */
  amount: number
  /** ISO 4217 currency code, e.g. 'NGN' */
  currency: string
  /** Customer email */
  email: string
  /** Tenant ID for attribution */
  tenantId: string
  /** Plan ID being purchased */
  planId: string
  /** Billing interval: 'monthly' | 'annual' */
  billingInterval: 'monthly' | 'annual'
  /** URL to redirect after payment */
  callbackUrl: string
  /** Optional discount code */
  couponCode?: string
  /** Optional metadata */
  metadata?: Record<string, string>
}

export interface CheckoutSession {
  /** Provider-specific session ID */
  sessionId: string
  /** URL to redirect the customer to */
  authorizationUrl: string
  /** Provider reference for verification */
  reference: string
}

export interface PaymentVerification {
  /** Whether payment was successful */
  success: boolean
  /** Amount paid (in minor unit) */
  amount: number
  /** Currency */
  currency: string
  /** Provider transaction reference */
  reference: string
  /** Provider customer ID */
  customerId?: string
  /** Payment method used */
  channel?: string
  /** Authorization for recurring charges */
  authorization?: {
    authorizationCode: string
    cardType: string
    last4: string
    expMonth: string
    expYear: string
    bank: string
  }
}

export interface ChargeParams {
  /** Amount in minor unit */
  amount: number
  /** Currency */
  currency: string
  /** Authorization code from previous payment */
  authorizationCode: string
  /** Customer email */
  email: string
  /** Optional metadata */
  metadata?: Record<string, string>
}

export interface RefundResult {
  /** Provider refund ID */
  refundId: string
  /** Amount refunded */
  amount: number
  /** Status */
  status: 'pending' | 'processed' | 'failed'
}

// ─── Provider Interface ──────────────────────────────────────────

export interface PaymentProvider {
  /** Provider identifier */
  readonly id: 'paystack' | 'flutterwave' | 'monnify' | 'squad' | 'interswitch' | 'stripe'

  /** Create a checkout session for one-time or initial payment */
  createCheckout(params: CheckoutParams): Promise<CheckoutSession>

  /** Verify a payment after redirect or via webhook */
  verifyPayment(reference: string): Promise<PaymentVerification>

  /** Verify authenticity of incoming webhook */
  verifyWebhookSignature(rawBody: string, signature: string): boolean

  /** Charge a saved authorization (for recurring billing and proration) */
  chargeAuthorization(params: ChargeParams): Promise<PaymentVerification>

  /** Create a refund */
  createRefund(transactionId: string, amount?: number): Promise<RefundResult>

  /** Get the provider's webhook event type from raw payload */
  getEventType(rawBody: unknown): string

  /** Get the provider's unique event ID for idempotency */
  getEventId(rawBody: unknown): string
}
