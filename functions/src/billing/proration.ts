/**
 * Proration Calculation Engine
 *
 * Day-granularity proration, half-up rounding, all math in kobo (minor units).
 * Formula: remainingDays/totalDays × price
 *
 * Upgrades: charge difference immediately, activate on payment
 * Downgrades: schedule to period end, no refund
 * Monthly→Annual: treated as upgrade with credit for unused monthly
 * Annual→Monthly: scheduled to annual period end
 */

// ─── Helpers ─────────────────────────────────────────────────────

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

/** Half-up rounding to nearest kobo */
export function roundKobo(value: number): number {
  return Math.round(value)
}

// ─── Core Calculations ───────────────────────────────────────────

export interface ProrationInput {
  currentPrice: number        // in kobo (minor unit)
  newPrice: number            // in kobo (minor unit)
  currentPeriodStart: string  // ISO timestamp
  currentPeriodEnd: string    // ISO timestamp
  now?: Date                  // defaults to new Date()
}

export interface UpgradeProrationResult {
  /** Amount to charge now (kobo). 0 means no charge needed. */
  chargeNow: number
  /** Amount of unused current plan (kobo) */
  unusedCurrent: number
  /** Prorated cost of new plan for remaining days (kobo) */
  newProrated: number
  /** Days remaining in current period */
  remainingDays: number
  /** Total days in billing period */
  totalDays: number
}

export interface DowngradeCreditResult {
  /** Credit amount (kobo) — NOT refunded, applied to future invoices */
  creditAmount: number
  /** Days remaining in current period */
  remainingDays: number
  /** Total days in billing period */
  totalDays: number
  /** Date the downgrade takes effect */
  effectiveDate: string
}

/**
 * Calculate the prorated charge for an immediate upgrade.
 * chargeNow = newProrated - unusedCurrent
 * If chargeNow ≤ 0, no charge needed.
 */
export function calculateUpgradeProration(input: ProrationInput): UpgradeProrationResult {
  const now = input.now ?? new Date()
  const periodEnd = new Date(input.currentPeriodEnd)
  const periodStart = new Date(input.currentPeriodStart)

  const totalDays = daysBetween(periodStart, periodEnd)
  const remainingDays = daysBetween(now, periodEnd)

  const unusedCurrent = roundKobo((input.currentPrice / totalDays) * remainingDays)
  const newProrated = roundKobo((input.newPrice / totalDays) * remainingDays)
  const chargeNow = Math.max(0, newProrated - unusedCurrent)

  return {
    chargeNow,
    unusedCurrent,
    newProrated,
    remainingDays,
    totalDays,
  }
}

/**
 * Calculate the credit for a scheduled downgrade.
 * No refund is issued; the credit is informational for display.
 */
export function calculateDowngradeCredit(input: ProrationInput): DowngradeCreditResult {
  const now = input.now ?? new Date()
  const periodEnd = new Date(input.currentPeriodEnd)
  const periodStart = new Date(input.currentPeriodStart)

  const totalDays = daysBetween(periodStart, periodEnd)
  const remainingDays = daysBetween(now, periodEnd)

  const creditAmount = roundKobo((input.currentPrice / totalDays) * remainingDays)

  return {
    creditAmount,
    remainingDays,
    totalDays,
    effectiveDate: periodEnd.toISOString(),
  }
}

/**
 * Monthly → Annual conversion.
 * Credits remaining unused monthly value against the annual price.
 */
export function calculateMonthlyToAnnual(input: ProrationInput): UpgradeProrationResult {
  const now = input.now ?? new Date()
  const periodEnd = new Date(input.currentPeriodEnd)
  const periodStart = new Date(input.currentPeriodStart)

  const totalDays = daysBetween(periodStart, periodEnd)
  const remainingDays = daysBetween(now, periodEnd)

  const unusedCurrent = roundKobo((input.currentPrice / totalDays) * remainingDays)
  // newPrice here is the annual amount (10× monthly)
  const chargeNow = Math.max(0, input.newPrice - unusedCurrent)

  return {
    chargeNow,
    unusedCurrent,
    newProrated: 0, // Not applicable for annual conversion
    remainingDays,
    totalDays,
  }
}

// ─── Worked Examples (to be encoded as tests) ────────────────────

/**
 * All 10 worked examples from the plan document, encoded as test data.
 * Test: run each through calculateUpgradeProration or calculateDowngradeCredit
 * and verify ±1 kobo tolerance.
 */
export const PRORATION_TEST_CASES = [
  // Example 1: Monthly upgrade day 15 of 30
  // Current: Growth N12,500, New: Command N15,000, 15 days remaining
  {
    description: 'Monthly upgrade halfway through month',
    currentPrice: 1_250_000, // kobo
    newPrice: 1_500_000,
    remainingDays: 15,
    totalDays: 30,
    expectedCharge: 125_000, // N1,250 in kobo
    tolerance: 1,
  },
  // Example 2: Monthly downgrade — no charge, scheduled
  {
    description: 'Monthly downgrade day 15 — no charge',
    currentPrice: 1_500_000,
    newPrice: 1_250_000,
    remainingDays: 15,
    totalDays: 30,
    expectedCharge: 0, // Downgrade = no charge
    tolerance: 0,
  },
  // Example 3: Monthly→Annual with 20 days remaining
  {
    description: 'Monthly to annual with 20 days remaining',
    currentPrice: 1_250_000, // monthly
    newPrice: 12_500_000,    // annual (10×)
    remainingDays: 20,
    totalDays: 30,
    expectedCharge: 11_666_700, // N116,667
    tolerance: 100, // 1 Naira tolerance for division
  },
  // Example 4: Upgrade with same price — zero charge
  {
    description: 'Upgrade with same price',
    currentPrice: 1_250_000,
    newPrice: 1_250_000,
    remainingDays: 15,
    totalDays: 30,
    expectedCharge: 0,
    tolerance: 0,
  },
  // Example 5: Seat increase on Growth day 15 (3 seats)
  {
    description: 'Seat increase of 3 on Growth day 15',
    currentPrice: 1_250_000, // 1 seat
    newPrice: 5_000_000,     // 4 seats (1 + 3)
    remainingDays: 15,
    totalDays: 30,
    expectedCharge: 1_875_000, // N18,750
    tolerance: 100,
  },
  // Example 6: Leap year — Feb 29 to Mar 29 (28 days)
  {
    description: 'Leap year upgrade Feb 29',
    currentPrice: 1_250_000,
    newPrice: 1_500_000,
    remainingDays: 28,
    totalDays: 29,
    expectedCharge: Math.round((1_500_000 / 29) * 28 - (1_250_000 / 29) * 28),
    tolerance: 10,
  },
  // Example 7: Full period upgrade — zero charge
  {
    description: 'Upgrade on last day — zero charge',
    currentPrice: 1_250_000,
    newPrice: 1_500_000,
    remainingDays: 0,
    totalDays: 30,
    expectedCharge: 0,
    tolerance: 1,
  },
  // Example 8: One day remaining upgrade
  {
    description: 'Upgrade with 1 day remaining',
    currentPrice: 1_250_000,
    newPrice: 1_500_000,
    remainingDays: 1,
    totalDays: 30,
    expectedCharge: Math.round(1_500_000 / 30 - 1_250_000 / 30),
    tolerance: 1,
  },
  // Example 9: Starter to Command on day 10
  {
    description: 'Starter to Command day 10 of 30',
    currentPrice: 750_000,
    newPrice: 1_500_000,
    remainingDays: 20,
    totalDays: 30,
    expectedCharge: Math.round((1_500_000 / 30) * 20 - (750_000 / 30) * 20),
    tolerance: 1,
  },
  // Example 10: Zero price upgrade (complimentary)
  {
    description: 'Complimentary plan upgrade — zero charge',
    currentPrice: 0,
    newPrice: 1_250_000,
    remainingDays: 15,
    totalDays: 30,
    expectedCharge: Math.round((1_250_000 / 30) * 15),
    tolerance: 1,
  },
]
