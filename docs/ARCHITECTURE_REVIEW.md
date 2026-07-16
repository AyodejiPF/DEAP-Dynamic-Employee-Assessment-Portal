# DEAP / StaffiQ Architecture Review

## Executive summary

The current structure is understandable, but it is still too tightly coupled for a product that needs a clear separation between public marketing, tenant access, admin operations, and Platform Owner control.

The app has three layers that are partly visible today:

1. Public marketing experience
2. Tenant-facing web app experience
3. Privileged Platform Owner / Super Admin experience

The current implementation is strongest when it comes to speed and continuity, but weaker when it comes to ownership boundaries, route clarity, and future team scaling.

## What is good

- The marketing site and the app are already conceptually separated by purpose.
- The public website is already a focused static experience with clear messaging and routes.
- The app already carries a tenant-aware model through the UI and storage helpers.
- The codebase has a reasonable starting point for role-based thinking through the tenant and role concepts.
- The recent hardening around a SuperAdmin module scaffold and CODEOWNERS is a strong step in the right direction.

## What is not yet ideal

### 1. The app is still effectively a monolith

Most of the logic still lives in one large React surface. This makes it harder to protect sensitive areas, review changes safely, and give different teams ownership over different domains.

### 2. The public site and the app are not yet fully separated by host and route contract

Right now the marketing site is a static site and the app is a React SPA, but the user experience still feels like one product with two skins rather than two clearly distinct products.

### 3. The tenant model and the UI are still coupled to the same shell

The user experience, tenant switching, branding, auth handling, and admin operations all live in the same application surface. This creates friction when you want strong boundaries between employee, admin, and Platform Owner flows.

### 4. SuperAdmin-sensitive logic is still too close to the main app

Even with scaffolding, the most sensitive operations are still conceptually part of the main UI. That weakens the ability to say “this belongs to the Platform Owner only.”

### 5. The current deployment path is functional, but not yet the cleanest product structure

Firebase Hosting is doing the job, but the current configuration is better described as a practical deployment assembly than a polished product shell.

## Recommended structure

### Recommended product model

Use a three-layer model:

- Marketing shell: public experience, pricing, features, contact, demo, trust
- Client app shell: authenticated tenant experience for employees, admins, and tenants
- Platform Owner shell: sensitive operations such as branding, token control, tenant ownership, and broad system control

### Recommended implementation pattern

Keep the public marketing site as a lightweight static experience.

Keep the app shell as the main authenticated experience.

Move Platform Owner capabilities into a clearly isolated module or subapp that is only loaded when the Platform Owner is signed in and explicitly permitted.

## Recommended principles

1. Public pages should never contain privileged business logic.
2. The Platform Owner experience should be isolated from the general app experience.
3. Shared concerns such as auth, tenant context, and branding should be owned at the shell level.
4. The UI should feel familiar: same brand, same navigation language, same user comfort, but different permission boundaries.
5. The system should be simple enough that a new user can understand where they are without needing to decode the architecture.

## Good, better, ugly assessment

### Good

- The product already has a clear identity.
- The brand is strong and the UX already has a warm, human feel.
- The app has real business logic and a clear direction.
- The structural move toward separate SuperAdmin code is the right instinct.

### Better

- Split the UI into shells: public, tenant, and Platform Owner.
- Share only the design language, auth context, and tenant identity across these shells.
- Use a stronger route contract so people know exactly whether they are on the marketing site, an app route, or a sensitive admin surface.
- Make the Platform Owner experience visually distinct and clearly restricted.

### Ugly

- One large React screen doing too many jobs.
- Sensitive features appear too close to ordinary user functionality.
- Hard to know where ownership begins and ends.
- Harder than necessary to review and govern the product safely.

## 25 practical questions to ask before implementation

These are the concrete questions that should guide the next architecture decisions for this product.

1. Should the marketing website remain on the same domain and simply route into the app, or should it become a separate branded domain with its own host target?
2. Should the app shell always have a distinct app subdomain such as app.stafiq.ng or portal.stafiq.ng?
3. Should the marketing site remain static HTML, or should it eventually become a lightweight React or Next.js shell too?
4. Should the Platform Owner experience be fully separate from the main app route tree?
5. Should the same Firebase project host both surfaces, or should the marketing site and app shell eventually use separate hosting targets or projects for stronger separation?
6. Should the public site use the same authentication system as the app, or should it remain unauthenticated and only redirect to the app when needed?
7. How much of the current UI should be preserved exactly, versus redesigned into a cleaner shell model?
8. Should tenant branding be managed centrally and then injected into the app shell, or be stored per tenant and loaded dynamically?
9. How much SuperAdmin/operator control should be visible to admins versus kept strictly to the Platform Owner?
10. Should the Platform Owner experience be available only through a dedicated route and role gate, or also through a separate host?
11. Should the app use a design system with shared tokens, spacing rules, and component primitives?
12. Should the app expose a consistent top bar, left navigation, and content regions for employees, admins, and Platform Owner users?
13. Should every major domain have its own route group and folder structure?
14. Should feature flags be used to keep Platform Owner functionality out of the default app surface until it is ready?
15. Should the public site and the app share the same brand system but not the same code paths?
16. Should the tenant/session model be extracted into a dedicated domain module rather than remaining embedded in the main app?
17. Should the app use a central state layer for session, route, tenant context, and notifications?
18. Should the Platform Owner module be built so that it can be tested independently from the rest of the app?
19. Should the system support a future transition to micro frontends later, rather than forcing it all at once?
20. How much of the current code should be preserved during the migration to avoid a risky rewrite?
21. What user journey should feel the most familiar: a single login experience, or a cleaner public-to-app handoff?
22. Should the app eventually support a guest mode or public preview mode for prospects before login?
23. Should the current marketing copy and app copy be aligned more tightly so the experience feels like one family of products?
24. Should a shared component library be introduced before attempting a larger architectural split?
25. What is the minimum viable structure that gives you strong protection now without adding too much complexity too early?

## Recommended next steps

1. Keep the current product as is for now, but define the three shells clearly.
2. Move tenant/session/auth logic into a clearly named domain boundary.
3. Continue isolating Platform Owner capabilities into a dedicated module.
4. Introduce a shared design system before expanding the architecture further.
5. Separate public routes from protected app routes with a clear route contract.
6. Prepare a phased plan: first boundaries, then modules, then optional host separation.
