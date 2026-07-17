# DECISIONS (append only)

Schema: date | decision | reason | affected files or areas

---

2026-07-17 | Keep one Platform Owner per app for now; a future Fourth Gear Luffy SuperAdmin federates both | Each app has a separate owner identity today; federation is a later, deliberate step | src/superadmin (StaffiQ), src/lib/auth (TaskPulse)
2026-07-17 | Payments are Nigeria first: Paystack and Flutterwave live, Monnify, Squad, Interswitch ready to add, Stripe as international fallback | Verified 2026 fees and recurring support; provider abstraction keeps the platform portable | billing modules in both apps
2026-07-16 | Starter price is 10,000 per user monthly | Approved pricing recorded on the pricing page and comparison table | staffiq-website index.html, pricing.html
