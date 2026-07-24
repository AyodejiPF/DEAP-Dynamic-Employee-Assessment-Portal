# StaffiQ Brand Creative Brief — Agency Handoff Document

> **Prepared for**: Creative agency partner
> **Prepared by**: Ayodeji Peter Falope, Founder, RevenStrat Integrated Services
> **Date**: 20 July 2026
> **Status**: Authoritative — current as of this date
> **Purpose**: Single source of truth for any agency engaged to refine and bring the StaffiQ brand to life visually, through marketing, and across all touchpoints.

---

## Table of Contents

1. [Brand Snapshot](#1-brand-snapshot)
2. [Brand Origin and Story](#2-brand-origin-and-story)
3. [Brand Identity System](#3-brand-identity-system)
4. [Visual Identity](#4-visual-identity)
5. [Product Truth](#5-product-truth)
6. [Pricing and Commercial Model](#6-pricing-and-commercial-model)
7. [Target Audience and Market Positioning](#7-target-audience-and-market-positioning)
8. [Competitive Context](#8-competitive-context)
9. [Brand Voice, Tone, and Messaging](#9-brand-voice-tone-and-messaging)
10. [Existing Marketing Assets](#10-existing-marketing-assets)
11. [Technical Context for Brand Implementation](#11-technical-context-for-brand-implementation)
12. [Known Issues and Gaps](#12-known-issues-and-gaps)
13. [Brand Values and Philosophy](#13-brand-values-and-philosophy)
14. [The RevenStrat Ecosystem](#14-the-revenstrat-ecosystem)
15. [Agency Deliverables Wishlist](#15-agency-deliverables-wishlist)
16. [Appendix: Key Facts at a Glance](#16-appendix-key-facts-at-a-glance)

---

## 1. Brand Snapshot

| Element | Detail |
|---------|--------|
| **Brand name** | StaffiQ |
| **Pronunciation** | "Staff IQ" (as in "staff intelligence") |
| **Tagline** | Train. Assess. Grow. |
| **Positioning statement** | Know who is ready. |
| **Parent company** | RevenStrat Integrated Services, Lagos, Nigeria |
| **Product category** | Workforce training and assessment platform |
| **Primary market** | Nigerian and African SMEs (5–200 employees) |
| **Domain** | `www.staffiq.ng` |
| **Contact email** | `hello@staffiq.ng` |
| **Live since** | May 2026 (product); July 2026 (marketing website) |
| **Website** | 30-page static marketing site, live at `www.staffiq.ng` |
| **Web application** | React SPA, live behind client login |
| **Sibling product** | TaskPulse (task management & productivity) |

---

## 2. Brand Origin and Story

### The Founder

StaffiQ was created by **Ayodeji Peter Falope**, Lead Consultant and Founder of RevenStrat Integrated Services, a Lagos-based business management consultancy.

Ayodeji has spent **over 30 years** advising Nigerian and African SMEs on growth, structure, and organisational change. He is a licensed Business Development consultant and was named **BDSP of the Year** by the Enterprise Development Centre (EDC) of Lagos Business School and Pan Atlantic University. He serves as Public Relations Officer for the EDC Alumni Association and is currently reading Business Management at Miva University.

### Why StaffiQ Exists

Across decades of hands-on consulting, one pattern kept repeating:

> Organisations treated the symptom, not the cause. They blamed people when the real gap was training. And they spent on training with no dependable way to assess whether anyone actually understood.

StaffiQ was built to close that loop:

1. **Teach** the skill (training content)
2. **Assess** understanding (fair, timed assessments)
3. **Show leadership the evidence** (analytics and reports)

The product is best understood as **"root cause thinking built into practical software."** It is not a generic LMS adapted for Africa — it was designed from the ground up by people who spent decades in the room with African SME owners, understanding their real constraints: limited budgets, varying staff tech literacy, unreliable networks, and the need for decisions backed by evidence rather than instinct.

### The Name

StaffiQ = "Staff" + "IQ." It means **intelligence about your staff** — knowing who is ready, who needs support, and where your organisation stands. The capital Q gives it a distinctive, modern mark while the "IQ" suffix signals analytical depth.

> **Note on brand evolution**: The brand was briefly experimented with as "Staff iQ" (with a space) and "Staff-iQ" (with a hyphen) in mid-July 2026. Those variants have been **reverted**. The single authoritative spelling as of 20 July 2026 is **StaffiQ** — one word, capital S, capital Q, no space, no hyphen.

---

## 3. Brand Identity System

### 3.1 Brand Name Rules

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Primary spelling | **StaffiQ** | Staff iQ, Staff-iQ, Staff IQ, staffiq |
| In logo lockup | Staffi**Q** (Q in accent colour) | — |
| In body text | StaffiQ | Staff iQ |
| In code/URLs | staffiq | StaffiQ, staff-iq |
| Domain | staffiq.ng | staff-iq.ng |

### 3.2 Tagline

- **Primary**: "Train. Assess. Grow." — appears in the header lockup across all pages
- **Secondary/positioning**: "Know who is ready." — used in hero headlines and marketing copy

### 3.3 Domains and Contact

| Asset | Value |
|-------|-------|
| Primary domain | `www.staffiq.ng` (redirects to this) |
| Root domain | `staffiq.ng` |
| Email | `hello@staffiq.ng` |
| WhatsApp business | `+234 700 800 09000` (site-wide CTAs) |

---

## 4. Visual Identity

### 4.1 Colour Palette

#### Primary Colours

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| 🟢 | Evergreen (primary) | `#0a5b44` | Primary buttons, brand elements, header backgrounds |
| 🟢 | Evergreen 700 | `#0a5b44` | Button gradients, dark section backgrounds |
| 🟢 | Evergreen 900 | `#062a20` | Deepest dark, footer backgrounds |
| ⚫ | Ink | `#0c1a15` | Body text, headings on light backgrounds |

#### Accent Colours

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| 🟢 | Lime | `#7bd389` | Highlights, feature icons, accent elements |
| 🟢 | Lime Strong | `#57c06e` | Gradients, active states, checkmarks |
| 🟠 | Amber | `#ffb020` | Warning badges, recommended plan highlights |

#### Neutral Colours

| Swatch | Name | Hex | Usage |
|--------|------|-----|-------|
| ⚪ | Paper (white) | `#ffffff` | Card backgrounds, light sections |
| ⚪ | Cream | `#fbfaf6` | Page background, alternating section colour |
| ⚫ | Muted | `#5b6b64` | Secondary text, captions, muted elements |

#### Gradient Combinations (Existing)

```css
/* Primary button */
background: linear-gradient(180deg, #137a5b, #0a5b44);

/* Brand mark container */
background: linear-gradient(180deg, #a9f0b6, #57c06e);

/* Amber badge */
background: linear-gradient(180deg, #ffb020, #e89400);

/* Card surface */
background: linear-gradient(180deg, #ffffff, #f4f8f6);
```

### 4.2 Typography

| Role | Font | Weights | Source |
|------|------|---------|--------|
| **Headings** | Space Grotesk | 500, 600, 700 | Google Fonts |
| **Body** | Inter | 400, 500, 600, 700 | Google Fonts |
| **Fallback** | system-ui, -apple-system, sans-serif | — | System |

**Typography rules:**
- Heading letter-spacing: `-0.02em` (tight, modern)
- Body line-height: `1.5`
- Heading line-height: `1.04–1.1`
- UK English spelling throughout

### 4.3 Logo and Brand Mark

**Current file**: `staffiq-mark-v2.webp` (also available as `.png`)

**Description**: A 38×38 pixel rounded-corner square (border-radius: 11px) containing the StaffiQ symbol. On dark backgrounds, it sits in a gradient container.

**Header lockup structure**:
```
[Brand Mark 38×38]  StaffiQ
                    Train. Assess. Grow.
```

- The "Q" in StaffiQ uses the lime accent colour (`#7bd389` or similar) when displayed on dark backgrounds
- The brand mark is used as the favicon (PNG format, root-absolute path)
- **Important**: The mark is currently raster-only (WebP/PNG). A vector (SVG) version is needed.

**What the agency should know**: The current mark is functional but was not designed by a professional brand designer. It serves its purpose on the live site, but a professionally crafted primary logo, icon-only mark, wordmark, horizontal and vertical lockup variations, monochrome versions, and a proper favicon suite are all needed.

### 4.4 Design Language

The live website employs a **"glossy, glassy, 3D"** design system (implemented July 2026).

**Card design:**
- Border-radius: `20px` (CSS custom property `--r`)
- Border: `1px solid rgba(10, 91, 68, 0.12)` (subtle green-tinted edge)
- Background: White-to-off-white gradient with translucent top highlight
- Shadows: Green/evergreen-tinted, layered depth (`0 22px 46px -20px rgba(6,42,32,0.5)`)
- Inner highlight: `0 1px 0 rgba(255,255,255,0.7) inset` (glass edge)
- Top overlay: Semi-transparent gradient, `mix-blend-mode: screen`
- Hover: Enhanced shadow depth, subtle lift (`translateY`), optional 3D tilt via JavaScript
- Respects `prefers-reduced-motion: reduce`

**Button design:**
- Shape: Fully rounded pill (`border-radius: 999px`)
- Primary: Green gradient with inner white highlight, green-tinted shadow
- Ghost: Semi-transparent white/glass with emerald border
- Lime: Used for featured/primary CTAs
- Hover: Lift effect + specular shine sweep (diagonal white gradient slides across)
- Sizes: Default (12px 20px), Large (15px 26px)

**Background atmosphere:**
- Soft, blurred radial gradient blobs in lime, emerald, and amber tones
- Positions: Top-left, top-right, and bottom-center
- Creates depth without distracting from content

**Interface mockups (CSS-only):**
- Dashboard visualizations built entirely in CSS (bars, KPI cards, status indicators)
- Used on the home page to show the product without screenshots

### 4.5 Icon Style

- All icons are **inline SVGs** (no icon font)
- `stroke="currentColor"` — inherits text colour
- Stroke width: `2` (sometimes `2.2` or `2.4`)
- Stroke linecap: `round`, stroke linejoin: `round`
- ViewBox: `24 24`
- Style: Line/outline — modern, clean, professional
- No filled icons in the current system

### 4.6 Interactive and Motion

- **Scroll-triggered reveal animations**: Elements fade and slide up as they enter the viewport (`.reveal`, `.d1`–`.d4` for staggered delays)
- **Card tilt**: Subtle 3D perspective tilt on hover (JavaScript-driven in `experience.js`)
- **Button shine**: Diagonal specular highlight sweeps across buttons on hover
- **Sticky header**: Blurs and gains shadow on scroll (`backdrop-filter: saturate(1.4) blur(10px)`)
- **Ambient music widget**: Bottom-left corner — generative ambience with animated equaliser bars. Does not autoplay (browser policy). Remembers preference across pages. Can be replaced with a custom track via `window.SQ_AMBIENCE_URL`.
- **Reduced motion**: All animations respect `prefers-reduced-motion: reduce`

---

## 5. Product Truth

### 5.1 What StaffiQ Does (Live, In Production)

**For Employees (Learners):**
- View assigned training content and assessments
- Take timed assessments with answer selection
- View personal results and score history
- Access help content with AI-assisted search
- Submit bug reports and feedback
- Earn contribution points for platform engagement
- Adjust display preferences (font size, dark mode)

**For Managers and Admins:**
- Role-aware dashboards with team overview
- User and role management (multi-tenant)
- Training content catalogue management
- Question bank management (create, edit, organize)
- Assessment creation, scheduling, and assignment
- Result records with session history
- Analytics and administrative reporting
- Report export (workbooks)
- Notifications management
- Audit records and event logging

**For Platform Owner (SuperAdmin):**
- Tenant management and provisioning
- Cross-tenant analytics
- API token governance (issue, rotate, revoke)
- Private feature inventory
- System configuration
- Billing dashboard and entitlements management (in progress)

**AI Capabilities (Growth plan and above):**
- Analytics intelligence: AI-generated insights from assessment data
- Help intelligence: AI-assisted answers from help content
- AI chat assistant: Natural language queries about platform data
- Powered by Perplexity Sonar API via secure Firebase Cloud Functions

### 5.2 What StaffiQ Does NOT Yet Do

*Be honest in all marketing — do not claim these:*

| Feature | Status |
|---------|--------|
| Self-serve free trial | ❌ Not available. Demo by consultation only. |
| Automated certification issuance | 🔜 On roadmap |
| Single Sign-On (Google/Microsoft) | 🔜 On roadmap |
| HRIS integration/sync | 🔜 On roadmap |
| Native mobile app | ❌ Web only (mobile-responsive) |
| Automated recurring billing | 🔜 Checkout route exists; full billing in progress |
| Live customer testimonials | ⚠️ Current site testimonials are labelled "illustrative" |
| AI features on Starter plan | ❌ Available from Growth upward only |

### 5.3 The Product Experience

- **Login**: Via `staffiq.ng/login` — redirects to the React SPA
- **Multi-tenant**: Each client organisation is a "tenant" with isolated data
- **Roles**: Employee, Manager, Admin, SuperAdmin — each sees a different dashboard
- **Mobile**: Fully responsive, designed for phones from 320px width
- **Offline resilience**: The app detects offline state and handles it gracefully
- **Accessibility**: Skip links, keyboard navigation, ARIA labels, focus indicators, font scaling, dark mode, reduced motion support

---

## 6. Pricing and Commercial Model

### 6.1 Current Pricing (Live, Authoritative as of 20 July 2026)

| | Starter | Growth (Recommended) | Command |
|---------|---------|----------------------|---------|
| **Monthly (per user)** | ₦10,000 | ₦12,500 | ₦15,000 |
| **Annual (per user/year)** | ₦100,000 | ₦125,000 | ₦150,000 |
| **Annual monthly equivalent** | ₦8,333 | ₦10,417 | ₦12,500 |
| **Annual saving** | ₦20,000 (2 months free) | ₦25,000 (2 months free) | ₦30,000 (2 months free) |
| **Minimum users** | 5 | 10 | 10 |

**Key pricing facts:**
- Currency: Nigerian Naira (₦)
- Annual plans: Pay for 10 months, get 12 months
- No long-term lock-in beyond the notice period in the proposal
- AI-powered features available from **Growth plan** upward
- All prices are per active user, per month
- The minimum user count determines the minimum monthly plan value
- Custom work (migration, bespoke content, integration) quoted separately

### 6.2 Plan Differentiation

| Capability | Starter | Growth | Command |
|------------|:-------:|:------:|:-------:|
| User and role administration | ✓ | ✓ | ✓ |
| Training and assessments | ✓ | ✓ | ✓ |
| Question and result records | ✓ | ✓ | ✓ |
| Core administrative reporting | ✓ | ✓ | ✓ |
| Full analytics and skill mastery heat maps | — | ✓ | ✓ |
| Organisation-specific training content | — | ✓ | ✓ |
| AI-powered insights and recommendations | — | ✓ | ✓ |
| Feedback and contribution workflows | — | ✓ | ✓ |
| Multi-branch configuration | — | — | ✓ |
| Advanced permissions and governance | — | — | ✓ |
| Implementation support | — | — | ✓ |
| Advanced cross-product planning | — | — | ✓ |

### 6.3 Sales Model

- No self-serve purchase flow (yet)
- Clients book a demo via the website or WhatsApp
- RevenStrat prepares a tailored proposal based on team size, needs, and configuration
- Plans can be adjusted or cancelled with agreed notice period
- Data belongs to the client; export process agreed during offboarding

---

## 7. Target Audience and Market Positioning

### 7.1 Primary Audience (Buyers / Decision-Makers)

| Segment | Pain Point | StaffiQ Solution |
|---------|------------|------------------|
| **SME business owners** (5–200 employees) | "I don't know if my people actually understand what they've been taught" | Evidence-based workforce visibility |
| **HR managers** | "I need to track training compliance and employee development systematically" | Structured training + assessment + reporting |
| **Operations managers** | "Our errors come from knowledge gaps, not laziness" | Root-cause diagnostics through assessment data |
| **Training/L&D teams** | "We run training but can't prove it worked" | Pre- and post-training assessment with analytics |
| **Business consultants** | "My clients need ongoing capability tracking after I leave" | White-label-friendly platform they can recommend |
| **Multi-branch organisations** | "Different branches have different capability levels and we can't see it" | Multi-branch configuration with roll-up reporting |

### 7.2 Secondary Audience (End Users)

- Frontline employees (varying tech literacy levels)
- Team supervisors and managers
- Compliance officers

### 7.3 Target Industries

Dedicated landing pages exist for these 12 industries:

1. Construction
2. Education
3. Financial Services
4. Food and Beverage
5. Healthcare
6. Hospitality
7. Logistics
8. Manufacturing
9. Professional Services
10. Real Estate
11. Retail
12. Technology

Dedicated role-based pages exist for: Business Owners, Consultants, HR Managers, Learning Teams, Multi-Branch Operators, and Operations Managers.

### 7.4 Market Positioning

| Dimension | Position |
|-----------|----------|
| **Geography** | Nigeria (primary), West Africa, broader Africa |
| **Economic reality** | Built for local networks, local budgets, local realities — not a Silicon Valley import |
| **Price tier** | Premium-accessible: more than generic quiz tools, far less than enterprise LMS platforms |
| **Key differentiator** | Consulting pedigree — decades of hands-on SME advisory work embedded in the product design |
| **Language** | UK English (public); Pidgin English microcopy proposed for in-app (roadmap) |
| **Brand archetype** | The Sage + The Advisor — wise, evidence-driven, trusted guide |

### 7.5 Core Messaging Pillars

1. **Simple for staff** — Anyone who can use a phone can use StaffiQ
2. **Built for everyday phones** — Works on the devices people actually own
3. **Designed for Nigerian SMEs** — Not adapted; designed from the ground up
4. **Evidence, not ego** — Every decision backed by data everyone can see
5. **Root cause, not symptoms** — Find and fix the real problem

---

## 8. Competitive Context

### 8.1 Direct Competitors

StaffiQ operates at the intersection of:
- **Learning Management Systems** (LMS) — generic platforms like Moodle, TalentLMS
- **Assessment platforms** — dedicated testing tools
- **HR analytics** — workforce reporting dashboards

Most competitors are either:
- Too expensive (enterprise LMS designed for Western markets)
- Too generic (not built for African SME realities)
- Too narrow (training only, or assessment only — not the full loop)

### 8.2 Indirect Competitors / Alternatives

- Paper-based assessments and manual training records
- Informal/adhoc training with no assessment
- WhatsApp-based training groups (common in Nigerian SMEs)
- Generic quiz makers (Google Forms, Typeform)

### 8.3 StaffiQ's Moat

1. **The consulting heritage**: RevenStrat's decades of SME advisory work is embedded in the product. Pure SaaS competitors cannot replicate this domain knowledge.
2. **The ecosystem play**: StaffiQ + TaskPulse together cover capability AND productivity — a unique combination.
3. **Local grounding**: Designed for Nigerian network conditions, mobile-first, plain-spoken.
4. **Honesty**: The brand refuses to fabricate social proof or overclaim features — a differentiator in a market full of exaggerated promises.

---

## 9. Brand Voice, Tone, and Messaging

### 9.1 Voice Characteristics

| Trait | Description | Example |
|-------|-------------|---------|
| **Professional but warm** | Credible, not corporate. Serious about outcomes, approachable in manner. | "Let us grow your people together" rather than "Enterprise workforce optimization solution" |
| **Plain-spoken** | No jargon. Any business owner should understand every sentence. | "Know who is ready" rather than "Competency verification matrix" |
| **Evidence-driven** | Claims are demonstrable. The brand philosophy is "evidence over ego." | Features page describes only capabilities that exist in the live product |
| **Root-cause focused** | Positions itself as solving the real problem, not the loud one. | "Your biggest problem is rarely the one you think" |
| **Confident but honest** | Does not fabricate testimonials or overclaim. Labels illustrative content clearly. | Testimonials marked as "illustrative until real client quotes exist" |
| **Consultative, not salesy** | Advises, diagnoses, recommends — reflects the consulting DNA. | "Book a demo" (conversation) rather than "Start free trial" (self-serve) |
| **Nigerian-grounded, not Nigerian-limited** | Proudly local in origin, professional enough for any market. | UK English spelling, global design quality, local pricing and context |

### 9.2 Messaging Rules

- **Terminology**: Use "assessment" not "test" or "exam." Use "staff" or "employees" or "people" not "users" or "learners" in public copy.
- **Competitor references**: Never name or disparage competitors. Let the product and positioning speak.
- **The TaskPulse relationship**: Describe as "sibling products" or "the RevenStrat workforce suite." StaffiQ = capability. TaskPulse = productivity. Together = "the full people story."
- **AI mentions**: Refer to AI as "AI-powered insights" or "smart recommendations" — keep it accessible, not technical.
- **Pricing discussions**: Always mention minimum users. Never imply prices are negotiable in public copy (they are discussed in proposals).
- **Honesty markers**: When a feature is on the roadmap, say so. When a testimonial is illustrative, say so. Trust is the brand's currency.

### 9.3 Words We Use

| Use | Avoid |
|-----|-------|
| Assessment | Test, exam, quiz |
| Staff / employees / people | Users, learners, resources |
| Organisation / business / company | Enterprise, corporation |
| Training | Course, class, lesson (except when technically accurate) |
| Understand / verify / check | Measure, evaluate, judge |
| Evidence / insight / visibility | Data, metrics, KPIs (except in analytics context) |
| Grow / develop / improve | Optimize, maximize, leverage |

### 9.4 Words We Never Use

- "Revolutionary" / "Game-changing" / "Disruptive" — hyperbolic, undermines the honest, grounded brand voice
- "World-class" / "Best-in-class" — unverifiable claims
- "Seamless" / "Frictionless" — overused tech jargon
- Competitor names

---

## 10. Existing Marketing Assets

### 10.1 The Live Website (www.staffiq.ng)

A 30-page static HTML + CSS + JS marketing website, deployed on Firebase Hosting.

**Core pages:**
| Page | File | Purpose |
|------|------|---------|
| Home | `index.html` | Hero, product mockups, features overview, CTA |
| Features | `features.html` | Five-pillar feature breakdown with anchor navigation |
| Pricing | `pricing.html` | Three-tier plans, monthly/annual toggle, comparison table, cost calculator |
| Training | `training.html` | SME learning areas, learning loop explanation |
| About | `about.html` | Origin story, mission, values, leadership profiles, suite explanation |
| Contact | `contact.html` | Demo booking form, WhatsApp CTAs |
| Solutions | `solutions.html` | Use-case-based positioning |
| Resources | `resources.html` | Content hub |

**Audience-specific pages (6):**
- `for-business-owners.html`
- `for-consultants.html`
- `for-hr-managers.html`
- `for-learning-teams.html`
- `for-multi-branch.html`
- `for-operations-managers.html`

**Industry-specific pages (12):**
- `industries-construction.html`
- `industries-education.html`
- `industries-financial-services.html`
- `industries-food-and-beverage.html`
- `industries-healthcare.html`
- `industries-hospitality.html`
- `industries-logistics.html`
- `industries-manufacturing.html`
- `industries-professional-services.html`
- `industries-real-estate.html`
- `industries-retail.html`
- `industries-technology.html`

**Legal/utility pages (4):**
- `privacy.html`
- `terms.html`
- `cookies.html`
- `404.html`

### 10.2 Website Technical Assets

| Asset | Path | Description |
|-------|------|-------------|
| Stylesheet | `assets/css/styles.css` | Main design system (~7,800 rules) |
| Experience CSS | `assets/css/experience.css` | Glossy/glassy overlay styles |
| Main JS | `assets/js/main.js` | Navigation, animations, calculator, form handling |
| Experience JS | `assets/js/experience.js` | Card tilt, music widget, ambient effects |
| Brand mark | `assets/img/staffiq-mark-v2.webp` | Primary brand mark (38×38) |
| Brand mark PNG | `assets/img/staffiq-mark-v2.png` | Favicon version |
| OG image | `assets/img/og-image.png` | Social sharing preview |
| Sitemap | `sitemap.xml` | SEO sitemap |
| Robots | `robots.txt` | Crawler instructions |

### 10.3 What Does NOT Exist Yet

The following brand assets need to be created — this is a core part of the agency's scope:

| Missing Asset | Priority |
|---------------|----------|
| Brand guidelines / brand book | **Critical** |
| Logo suite (primary, icon, wordmark, lockups, mono) | **Critical** |
| Vector (SVG) brand mark | **Critical** |
| Email templates (transactional + marketing) | High |
| Presentation/pitch deck template | High |
| Sales one-pager / capability statement (PDF) | High |
| Social media profile assets (all platforms) | High |
| Business card design | Medium |
| Letterhead / invoice template | Medium |
| Branded document templates (proposals, reports) | Medium |
| Signage / event booth design | Low (future) |
| Merchandise concepts | Low (future) |
| Video/animation intro/outro | Low (future) |

---

## 11. Technical Context for Brand Implementation

### 11.1 How the Brand Lives in Code

StaffiQ has **two separate codebases** that share the brand:

1. **Marketing website** (`staffiq-website/`)
   - Static HTML + CSS + JS
   - Custom Node.js build script
   - Deployed to Firebase Hosting site: `staffiq-ng`
   - Brand colours hardcoded in `styles.css` and `experience.css`
   - Brand fonts loaded via Google Fonts CDN

2. **Web application** (`src/`)
   - React 19 + TypeScript 6, built with Vite 8
   - Single `App.tsx` (~18,000 lines) + `App.css` (~7,800 lines)
   - Deployed to Firebase Hosting site: `training-assessment-1c8ef`
   - Brand colours hardcoded in `App.css` and `index.css`
   - Brand fonts loaded via Google Fonts CDN

### 11.2 The Design Token Problem

Currently, there is **no shared design token system** between the marketing site and the web app. Colours, spacing, border-radius, shadows, and typography are hardcoded independently in each codebase. A brand update requires changes in two separate places with two different technologies.

**Recommendation for the agency**: Produce brand guidelines that include a **design token specification** — a single source of truth for all visual values that can be translated into CSS custom properties, a Figma library, and (eventually) a shared token package.

### 11.3 Current Tech Stack (For Reference)

| Layer | Technology |
|-------|-----------|
| Frontend (app) | React 19, TypeScript 6, Vite 8 |
| Frontend (marketing) | Static HTML, CSS, vanilla JavaScript |
| Backend | Firebase Cloud Functions (Node.js 22) |
| Database | Firebase Firestore |
| Hosting | Firebase Hosting (2 sites, 1 project) |
| AI | Perplexity Sonar API |
| Analytics | Google Analytics 4 (placeholder — not yet configured) |
| Domain/DNS | staffiq.ng |

### 11.4 Implementation Notes for Agency Deliverables

- **Logo files needed**: SVG (primary), PNG (with transparency, multiple sizes), WebP, favicon.ico, Apple Touch Icon
- **Font licensing**: Space Grotesk (OFL, free), Inter (OFL, free) — no licensing issues
- **Website technology**: The marketing site is static HTML. New pages or design updates can be delivered as HTML/CSS. A full rebuild in a framework is possible but not required.
- **App technology**: The web app uses React + CSS. Brand changes in the app require developer implementation. Design tokens in CSS custom property format would be immediately usable.
- **Google Analytics**: The placeholder ID `G-XXXXXXXXXX` needs to be replaced with a real GA4 property. The agency can either provide the ID or manage analytics setup.

---

## 12. Known Issues and Gaps

*The agency should be aware of these — some are opportunities to add immediate value.*

### 12.1 Brand Consistency Issues

| Issue | Impact | Recommended Fix |
|-------|--------|-----------------|
| No official brand guidelines | Brand applied inconsistently; no reference for partners | Agency to create brand book |
| Logo is raster-only, not professionally designed | Cannot scale; looks amateur to design-sensitive buyers | Agency to design proper logo suite |
| Design tokens not shared between website and app | Brand drift between the two surfaces over time | Agency to define token system |
| "StaffiQ" vs "Staff iQ" confusion from recent rebrand experiment | Potential customer confusion if any cached pages remain | Agency to enforce definitive spelling in all guidelines |
| Home page and pricing page were serving different prices (fixed 17 July) | Pricing confusion if pages get out of sync again | Single source of truth for pricing; agency to ensure all materials match |

### 12.2 Digital Presence Gaps

| Issue | Impact | Recommended Fix |
|-------|--------|-----------------|
| Google Analytics not configured (`G-XXXXXXXXXX` placeholder) | Zero visitor data; all marketing decisions are blind | Set up GA4 property; agency can manage or advise |
| No social media presence established | Missing discoverability and credibility channel | Agency to design profile assets; strategy for platform selection |
| Checkout URL exposes raw Firebase domain (`training-assessment-1c8ef.web.app/checkout`) | Trust issue at the point of purchase | Either mask with custom domain or design a branded checkout experience |
| No email marketing setup | Cannot nurture leads or onboard clients automatically | Agency to design email templates; RevenStrat to choose ESP |
| No SEO content strategy beyond the site pages | Limited organic discovery | Agency to advise on content marketing strategy |

### 12.3 Collateral Gaps

| Issue | Impact | Recommended Fix |
|-------|--------|-----------------|
| No pitch deck or sales presentation | Demos and pitches are ad-hoc; no consistent first impression | Agency to design presentation template |
| No printed/digital leave-behind | Prospects have nothing to review after a meeting | Agency to design capability statement / one-pager |
| No branded proposal template | Proposals lack the polish of the website | Agency to design proposal template (InDesign, PowerPoint, or Google Slides) |
| No email signature design | Every client email is a missed branding opportunity | Agency to design email signature |

---

## 13. Brand Values and Philosophy

These are the three values published on the StaffiQ about page. They should inform every creative decision:

### 1. Find the Root Cause
> "We fix the real problem, not the loud one. Every dashboard is designed to point you at the cause, not just the symptom."

**Implication for brand expression**: Avoid superficial, decorative design. Every visual element should serve a purpose. The brand aesthetic should feel diagnostic, clear, and insightful — not flashy or trendy.

### 2. Evidence Over Ego
> "Promotions, training, and tough calls should rest on data everyone can see, so decisions are fair and easy to defend."

**Implication for brand expression**: The brand should convey clarity, transparency, and trustworthiness. Data visualization should be clean and honest. Marketing claims should be specific and verifiable. The design should feel objective and fair — not manipulative.

### 3. Built for Here
> "Mobile-aware, plain-spoken, and grounded in the realities of African SMEs."

**Implication for brand expression**: The brand should feel at home in Lagos, in Accra, in Nairobi — not like a foreign import. Use local context thoughtfully and respectfully. Design for mobile-first experiences. Use language that any business owner can understand. Don't try to look like a Silicon Valley startup.

---

## 14. The RevenStrat Ecosystem

### 14.1 The Two-Product Story

StaffiQ is not a standalone product — it is one half of the RevenStrat workforce suite:

| | StaffiQ | TaskPulse |
|---------|---------|-----------|
| **What it measures** | Capability (what people know) | Productivity (what people do) |
| **Core action** | Train → Assess → Understand | Assign → Track → Validate |
| **Answers the question** | "Are my people ready?" | "Is the work getting done?" |
| **Tagline** | Train. Assess. Grow. | Transform. Improve. Grow. |
| **Primary audience** | HR, L&D, compliance | Operations, project managers, team leads |
| **Domain** | staffiq.ng | taskpulse.ng |
| **Pricing** | ₦10K–₦15K/user/month | ₦7.5K–₦15K/user/month |

### 14.2 The Ecosystem Positioning

> "StaffiQ shows what people have learned and understood. TaskPulse shows what they get done day to day. Used together, you see whether skill is turning into output."

This is a unique market position. Most workforce tools cover either capability OR productivity — not both. The agency should understand this relationship because:

- Co-branding opportunities exist (the "RevenStrat workforce suite")
- Cross-sell messaging should be natural, not forced
- The two brands should feel like siblings — related but distinct
- Visual harmony between the two brands reinforces the ecosystem story

### 14.3 TaskPulse Visual Identity (For Reference)

- **Colour system**: Dark theme (charcoal/grey dominant) with teal/green and gold accents
- **Typography**: Same font stack (Space Grotesk + Inter) — intentional consistency
- **Design language**: Also received the glossy/glassy upgrade (dark-themed variant)
- **Brand voice**: Slightly more operational/action-oriented; warmer in the StaffiQ direction

---

## 15. Agency Deliverables Wishlist

*This is a suggested scope. Discuss and refine with the agency.*

### Phase 1: Brand Foundation (First)

1. **Brand guidelines document** (digital + print-ready PDF)
   - Logo usage rules (clear space, minimum size, what not to do)
   - Colour specifications (hex, RGB, CMYK, Pantone where applicable)
   - Typography system (hierarchy, sizes, line heights, usage rules)
   - Iconography style guide
   - Photography/illustration direction
   - Voice and tone guidelines
   - Layout/grid system

2. **Logo suite**
   - Primary logo (horizontal lockup: mark + wordmark + tagline)
   - Secondary logo (vertical/stacked lockup)
   - Icon-only mark (for favicon, app icon, social avatars)
   - Wordmark only
   - Monochrome versions (black, white, and evergreen)
   - All in SVG, PNG (multiple sizes), and EPS/AI source files

3. **Design token specification**
   - CSS custom properties ready for implementation
   - Figma library / design system file
   - Spacing scale, type scale, shadow scale, border-radius scale

### Phase 2: Marketing Collateral (Second)

4. **Presentation/pitch deck template** (PowerPoint + Google Slides)
5. **Sales one-pager / capability statement** (print-ready PDF)
6. **Email signature design**
7. **Email template suite** (welcome, proposal follow-up, invoice, newsletter)
8. **Social media profile kit** (LinkedIn, Twitter/X, Instagram, Facebook — profile + cover images)
9. **Business card design**
10. **Proposal template**

### Phase 3: Digital Experience (Third)

11. **Website visual refresh recommendations** (build on existing, don't rebuild unnecessarily)
12. **OG image / social sharing image** (professionally designed)
13. **Favicon suite** (all platforms and devices)
14. **Web app brand alignment recommendations** (ensure consistency between marketing site and app)

### Phase 4: Growth (Future)

15. **Brand video/animation storyboard** (explainer or brand story)
16. **Outdoor/signage concepts** (for client locations)
17. **Merchandise concepts**
18. **Event/exhibition booth design**

---

## 16. Appendix: Key Facts at a Glance

### Company
- **Company**: RevenStrat Integrated Services
- **Founded by**: Ayodeji Peter Falope
- **Location**: Lagos, Nigeria
- **Expertise**: Business management consultancy; SME growth, structure, and change
- **Years in practice**: 30+

### Product
- **Name**: StaffiQ
- **Type**: Workforce training and assessment platform (SaaS)
- **Launch**: May 2026 (product); July 2026 (marketing website)
- **Tech stack**: React, TypeScript, Firebase, Vite
- **Hosting**: Firebase (Google Cloud)
- **Multi-tenant**: Yes — each client organisation has isolated data

### Brand
- **Spelling**: StaffiQ (exact — one word, capital S, capital Q)
- **Tagline**: Train. Assess. Grow.
- **Positioning**: Know who is ready.
- **Domain**: www.staffiq.ng
- **Email**: hello@staffiq.ng
- **Fonts**: Space Grotesk (headings), Inter (body)
- **Primary colour**: Evergreen `#0a5b44`
- **Accent**: Lime `#7bd389`, Amber `#ffb020`

### Pricing (NGN)
- **Starter**: ₦10,000/user/month (min 5 users)
- **Growth**: ₦12,500/user/month (min 10 users) — Recommended
- **Command**: ₦15,000/user/month (min 10 users)
- **Annual**: 2 months free on all plans

### Sibling Product
- **TaskPulse**: Task management and productivity platform
- **Positioning**: StaffiQ = capability, TaskPulse = productivity
- **Ecosystem**: The RevenStrat workforce suite

### Current Status (20 July 2026)
- ✅ Product live and serving clients
- ✅ 30-page marketing website live at www.staffiq.ng
- ✅ Client login operational
- ✅ Pricing published and active
- ✅ AI features (Perplexity-powered) live on Growth and Command plans
- ✅ Multi-agent development protocol established
- 🔜 Full billing/subscription automation in progress
- 🔜 Professional brand identity system — **YOU ARE HERE**
- ⚠️ Google Analytics not yet configured
- ⚠️ No social media presence yet
- ⚠️ No brand guidelines document exists

---

> **Next step**: Share this document with the selected agency. Schedule a walkthrough call to add colour and answer questions. Provide access to the live website and, if helpful, a demo account on the web application.

> **Document owner**: Ayodeji Peter Falope, RevenStrat Integrated Services. For corrections or updates, contact the Platform Owner.

---

*End of StaffiQ Brand Creative Brief. 20 July 2026.*
