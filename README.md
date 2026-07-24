# StaffiQ / StaffiQ — StaffiQ

> A production-deployed training, assessment, and analytics platform for Nigerian SMEs.
> Built with React 19, TypeScript 6, Vite 8, and Firebase.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy safely (snapshot → build → deploy → verify)
npm run deploy:safe
```

---

## Project Structure

```
├── src/
│   ├── App.tsx              # Main application shell (SPA, view-state routing)
│   ├── App.css              # Application styles
│   ├── tenant.ts            # Tenant/session persistence and auth helpers
│   ├── chats-module.ts      # Chat/communication module
│   ├── recommendationCatalogue.ts  # Feature and analytics catalogue
│   ├── superadmin/          # Isolated Platform Owner module
│   │   ├── index.ts         # Public API — re-exports real implementation
│   │   ├── stub.ts          # No-op stubs for team development
│   │   ├── auth.ts          # Owner verification helpers
│   │   ├── tokens.ts        # API token CRUD operations
│   │   ├── branding.ts      # Logo upload/reset
│   │   ├── testerAccounts.ts # Tester account management
│   │   ├── types.ts         # Shared type definitions
│   │   └── components/      # SuperAdmin UI components
│   │       ├── SuperAdminPanel.tsx
│   │       ├── TokenStudio.tsx
│   │       ├── BrandingControl.tsx
│   │       └── TesterAccountControl.tsx
│   └── main.tsx             # React entry point
├── functions/               # Firebase Cloud Functions (Node.js 22)
├── scripts/                 # Build, deploy, and smoke-test scripts
├── staffiq-website/         # Public marketing website
├── docs/                    # Architecture, recommendations, and agent coordination
│   ├── agents/              # Multi-agent coordination protocol
│   ├── ARCHITECTURE_REVIEW.md
│   └── DEAP_CODEX_PROGRESS.md  # Cross-AI session tracker
├── .github/CODEOWNERS       # Ownership rules (SuperAdmin → Platform Owner only)
├── .env.example             # Environment variable template
├── vite.config.ts           # Vite configuration with SuperAdmin alias
└── firebase.json            # Firebase Hosting configuration
```

---

## Ownership & Security

### SuperAdmin / Platform Owner Isolation

The `src/superadmin/` module contains all Platform Owner functionality:
- **Token management** (create, revoke, rotate, archive)
- **Branding control** (logo upload/reset)
- **Tester account management** (enable, disable, passwords)

**How isolation works:**
1. The module has a **stub** (`src/superadmin/stub.ts`) that returns no-ops for team builds.
2. The **real implementation** (`src/superadmin/index.ts`) is only loaded when `VITE_SUPERADMIN_SOURCE=real`.
3. The **Vite alias** in `vite.config.ts` maps `superadmin` to the real module path.
4. **CODEOWNERS** (`/.github/CODEOWNERS`) requires Platform Owner approval for all SuperAdmin paths.

### Deployment Rules

- **Only Ayodeji Falope** deploys to production.
- Always use `npm run deploy:safe` (continuity guard takes pre/post snapshots).
- Never deploy with `VITE_SUPERADMIN_SOURCE=real` unless you are the Platform Owner.

---

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | ESLint across the project |
| `npm run preview` | Preview production build locally |
| `npm run deploy:safe` | Snapshot → build → deploy → verify |
| `npm run continuity:snapshot` | Take a continuity snapshot |
| `npm run continuity:verify` | Verify against last snapshot |
| `npm run smoke:local` | Run Playwright smoke tests locally |
| `npm run smoke:live` | Run Playwright smoke tests against live URL |
| `npm run tenant:verify` | Verify tenant architecture integrity |

---

## Architecture

```
Browser (React SPA — view-state routing in App.tsx)
    ↕ HTTP/JSON (REST API)
Firebase Cloud Functions (Node.js 22 — functions/index.js)
    ↕ Firestore SDK
Firestore Database (single-document pattern: deapApp/sharedState)
    ↕
Firebase Storage (images, course assets, exports)
```

**Key facts:**
- Single-page application with no router library — view switching via state variable
- All shared state stored as JSON in one Firestore document
- No direct Firestore access from browser — all data goes through Cloud Functions
- AI features use Perplexity API (key stored in Firebase Secrets)
- Deployment uses continuity guard (pre/post snapshot verification)

---

## Multi-Agent Coordination

This repository supports multiple AI agents (VS Code Copilot, Claude, Cursor, Codex) working together:
- See `docs/agents/AGENT_COORDINATION_PROTOCOL.md` for the shared protocol.
- See `docs/DEAP_CODEX_PROGRESS.md` for the cross-session progress tracker.
- See `AGENT-COMMS.md` for the active communication channel.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|--------|
| `VITE_APP_NAME` | Application display name | `Staffiq` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `iicocece-assessment` |
| `VITE_DEFAULT_PASS_MARK` | Default pass mark percentage | `50` |
| `VITE_SUPERADMIN_SOURCE` | SuperAdmin module: `stub` or `real` | `stub` |

---

## License

Proprietary — All rights reserved.
