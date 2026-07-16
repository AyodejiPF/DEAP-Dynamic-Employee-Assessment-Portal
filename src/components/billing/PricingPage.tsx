/**
 * PricingPage — Public pricing display with monthly/annual toggle.
 *
 * Features:
 *   - Monthly/annual toggle (annual is default)
 *   - Three plan cards: Starter, Growth (recommended), Command
 *   - "2 MONTHS FREE!" savings badge on annual
 *   - Monthly equivalent shown below annual total
 *   - Subscribe CTAs that link to checkout flow
 */

import { useState } from 'react'

interface PlanData {
  id: string
  name: string
  description: string
  monthlyPrice: number       // in Naira
  annualPrice: number        // in Naira (monthly × 10)
  annualListValue: number    // monthly × 12 (for savings display)
  features: string[]
  isRecommended: boolean
  cta: string
}

const PLANS: PlanData[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For a focused team starting structured staff development.',
    monthlyPrice: 7500,
    annualPrice: 75000,
    annualListValue: 90000,
    features: [
      'User and role administration',
      'Training and assessments',
      'Question and result records',
      'Core administrative reporting',
    ],
    isRecommended: false,
    cta: 'Start with Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For an SME that needs deeper insight and more control.',
    monthlyPrice: 12500,
    annualPrice: 125000,
    annualListValue: 150000,
    features: [
      'Everything in Starter',
      'Analytics and advanced reports',
      'Organisation-specific content',
      'AI-powered insights & recommendations',
      'Feedback and contribution workflows',
    ],
    isRecommended: true,
    cta: 'Choose Growth',
  },
  {
    id: 'command',
    name: 'Command',
    description: 'For complex structures, branches and stronger governance.',
    monthlyPrice: 15000,
    annualPrice: 150000,
    annualListValue: 180000,
    features: [
      'Everything in Growth',
      'Multi-branch configuration',
      'Advanced permissions and governance',
      'Implementation support',
      'TaskPulse cross-product planning',
    ],
    isRecommended: false,
    cta: 'Choose Command',
  },
]

type BillingInterval = 'monthly' | 'annual'

export function PricingPage() {
  const [interval, setInterval_] = useState<BillingInterval>('annual')

  const formatNaira = (amount: number) =>
    `₦${amount.toLocaleString('en-NG')}`

  const getSavings = (plan: PlanData) =>
    plan.annualListValue - plan.annualPrice

  const getMonthlyEquivalent = (plan: PlanData) =>
    Math.round(plan.annualPrice / 12)

  return (
    <div className="pricing-page">
      <header className="pricing-hero">
        <h1>Start with the plan that fits your team</h1>
        <p>Every plan has a clear price. Switch to annual and get two months free.</p>
      </header>

      {/* Toggle */}
      <div className="pricing-toggle" role="radiogroup" aria-label="Billing interval">
        <button
          role="radio"
          aria-checked={interval === 'monthly'}
          className={`toggle-option ${interval === 'monthly' ? 'active' : ''}`}
          onClick={() => setInterval_('monthly')}
        >
          Monthly
        </button>
        <button
          role="radio"
          aria-checked={interval === 'annual'}
          className={`toggle-option ${interval === 'annual' ? 'active' : ''}`}
          onClick={() => setInterval_('annual')}
        >
          Annual
        </button>
      </div>

      {/* Plan Cards */}
      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.isRecommended ? 'recommended' : ''}`}
          >
            {plan.isRecommended && (
              <span className="pricing-badge">Recommended</span>
            )}

            <h2 className="plan-name">{plan.name}</h2>
            <p className="plan-desc">{plan.description}</p>

            <div className="plan-price">
              {interval === 'annual' ? (
                <>
                  <span className="price-amount">{formatNaira(plan.annualPrice)}</span>
                  <span className="price-period">/year</span>
                  <span className="price-equivalent">
                    That's only {formatNaira(getMonthlyEquivalent(plan))}/month
                  </span>
                  <span className="price-savings">
                    Save {formatNaira(getSavings(plan))} — 2 MONTHS FREE!
                  </span>
                </>
              ) : (
                <>
                  <span className="price-amount">{formatNaira(plan.monthlyPrice)}</span>
                  <span className="price-period">/month</span>
                </>
              )}
            </div>

            <ul className="plan-features">
              {plan.features.map((feat) => (
                <li key={feat}>✓ {feat}</li>
              ))}
            </ul>

            <a
              href={`/checkout?plan=${plan.id}&interval=${interval}`}
              className={`plan-cta ${plan.isRecommended ? 'primary' : 'secondary'}`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
