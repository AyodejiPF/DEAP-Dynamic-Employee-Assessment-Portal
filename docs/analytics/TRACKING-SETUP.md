# StaffiQ — External Tracking & Analytics Setup

> Written by Claude (Cowork), 2026-07-21. Source of truth for every external tracking ID tied to StaffiQ. Update this file (don't duplicate it) whenever a tag changes.

## Domains covered
- Marketing site: `https://www.staffiq.ng` (also resolves at `staffiq.ng`)
- Web app: `https://training-assessment-1c8ef.web.app` (Firebase Hosting site `training-assessment-1c8ef`; also reachable via `staffiq.ng/login`)

---

## 1. Google Analytics 4

| Field | Value |
|---|---|
| Property name | StaffiQ |
| Property ID | `15287134091` |
| Measurement ID (marketing site stream) | `G-70WMCDHYC0` |
| Stream name | StaffiQ Marketing Site |
| Stream URL | `https://www.staffiq.ng` |
| Timezone / Currency | Nigeria (GMT+01:00) / Nigerian Naira (₦) |
| Industry category | Jobs & Education |
| Business objectives | Generate leads, Drive sales |
| Google account | ayodeji@revenstrat.com ("Deji Falope" GA account) |

**Code installed 2026-07-21** — real ID swapped into all 30 `staffiq-website/*.html` pages, build-verified. **⚠️ Not yet deployed** — needs `cd staffiq-website && npm run build && firebase deploy --only hosting` (target: `staffiq-ng`), pending Ayodeji's go-ahead.

**Web app GA stream (added 2026-07-21):**

| Field | Value |
|---|---|
| Stream name | StaffiQ Web App |
| Stream ID | `15293490672` |
| Measurement ID | `G-PYTVN2Y33X` |
| Stream URL | `https://training-assessment-1c8ef.web.app` |

**Code installed 2026-07-21** — added to the Vite app shell (`index.html`, repo root — not `src/App.tsx`, which is Codex-owned), build-verified. **⚠️ Not yet deployed** — needs `npm run build && firebase deploy --only hosting` from repo root (target: `training-assessment-1c8ef`), pending Ayodeji's go-ahead.

## 2. Google Search Console

| Field | Value |
|---|---|
| Property | `https://www.staffiq.ng/` (URL-prefix type) |
| Verification method | Domain name provider (auto-verified via existing DNS-CNAME from the Firebase custom-domain setup) |
| Sitemap submitted | `sitemap.xml` → Status: Success, 29 pages discovered (submitted 2026-07-21) |
| Google account | ayodeji@revenstrat.com |

## 3. Ubersuggest (SEO/keyword tracking)

| Field | Value |
|---|---|
| Project domain | `staffiq.ng` |
| Business type (auto-detected) | Employee Training & Assessment Platform |
| Location / Language | Nigeria / English |
| Tracked competitors | TalentLMS, Cornerstone OnDemand, Moodle, Docebo, Thinkific, LearnWorlds, and others (10 total, auto-selected) |
| Starter tracked keywords | 15 keywords incl. "workplace skills plan", "learning manager system", "skill gap assessment" |

## 4. Google Workspace (domain + Gmail)

| Field | Value |
|---|---|
| Domain | `staffiq.ng` — Secondary Domain on the RevenStrat Workspace account |
| Verification status | Verified |
| Gmail activation | **Done (2026-07-21).** Root cause was a wrong MX record (`0 staffiq.ng.`, a null MX pointing at itself). Fixed at the DNS host (Go54): `@` MX record now correctly reads `1 SMTP.GOOGLE.COM.`, matching `taskpulse.ng`. A stray extra MX record (`gmail` → `1 SMTP.GOOGLE.COM`, wrong name) was also removed. Gmail activation confirmed live in admin.google.com/ac/domains/manage. |

## 5. Microsoft Clarity (session recording / heatmaps)

| Field | Value |
|---|---|
| Project name | StaffiQ |
| Project ID | `xps118m9lt` |
| Website URL | `www.staffiq.ng` |
| Industry | Careers & Education |
| Account | ayodeji@revenstrat.com (signed in via Google) |

**Code installed 2026-07-21** — snippet added to all 30 marketing pages, build-verified. **⚠️ Not yet deployed** (see section 1). Snippet for reference:

```html
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "xps118m9lt");
</script>
```

---

## Outstanding items (as of 2026-07-22)

**Nothing outstanding.** Everything is deployed and verified live.

~~Add a GA4 web data stream for the web app~~ — done 2026-07-21 (`training-assessment-1c8ef.web.app`, see section 1).
~~Set up Microsoft Clarity~~ — done 2026-07-21, code installed and build-verified (see section 5).
~~Fix staffiq.ng MX record and activate Gmail~~ — done 2026-07-21 (see section 4).
~~Swap placeholder GA ID + install web-app GA stream~~ — done 2026-07-21, code installed and build-verified (see section 1).
~~Deploy both sites~~ — done 2026-07-22. `staffiq-website` → `staffiq-ng`, deploy complete. Repo root → `training-assessment-1c8ef`, deploy complete. Verified live: `www.staffiq.ng` fires both `gtag` (G-70WMCDHYC0) and Clarity (`xps118m9lt`); `training-assessment-1c8ef.web.app` and `staffiq.ng/login` both fire `gtag` (G-PYTVN2Y33X). Zero console errors on any of them.
**Bonus fixes, found during deploy prep**:
1. Root `firebase.json`'s `hosting.site` was `"staffiq-ng"` (wrong — that's the marketing site). The documented `deploy:safe` script would have silently overwritten the marketing site with the app build. Fixed to `"training-assessment-1c8ef"`, confirmed correct via `firebase hosting:sites:list` and by observing the actual deploy log target it.
2. Both `firebase.json` (repo root) and `staffiq-website/firebase.json` had CSPs that didn't allow Google Analytics/Clarity script domains — the tags just installed would have been silently blocked by the browser. Both fixed before deploying.
~~Deploy AI-crawler `robots.txt`~~ — done 2026-07-23. Prior deploy had missed it. Redeployed `staffiq-website` (`npm run build` + `firebase deploy --only hosting --project iicocece-assessment`). Verified live at `https://staffiq-ng.web.app/robots.txt`; custom domain `www.staffiq.ng` still serving old cached version pending CDN propagation.
~~GA4 `generate_lead` key event~~ — done 2026-07-23. Added `gtag('event', 'generate_lead', {lead_type:'demo_request', team_size})` to `assets/js/main.js`'s `form[data-demo-form]` submit handler on `contact.html`. Deployed and verified firing via a live JS-simulated submit test. Not yet marked as a GA4 Key Event in Admin — needs a real submission to land in the Events list first.
~~GA4 Account display name~~ — done 2026-07-23. GA4 account `73769647` (shared by both StaffiQ and TaskPulse properties) was named "Deji Falope" — renamed to "Ayodeji Falope" via Admin > Account details. Confirmed persisted after reload.
~~Bing Webmaster Tools~~ — done 2026-07-23. Imported via "Import from Google Search Console" (view-only OAuth grant, user-approved). `staffiq.ng`, `taskpulse.ng`, and `revenstrat.com` all added; sitemaps auto-imported.
~~IndexNow~~ — done 2026-07-23. Generated Bing IndexNow API key `740b16c2978d44049d88e149a712ef29` (account-wide, not per-site). Hosted `740b16c2978d44049d88e149a712ef29.txt` at the site root; added to the `publicFiles` whitelist in `scripts/build.mjs`. Deployed and verified live at `https://staffiq-ng.web.app/740b16c2978d44049d88e149a712ef29.txt`.
~~IndexNow bulk URL submission~~ — done 2026-07-24. POSTed all 29 sitemap URLs to `https://api.indexnow.org/indexnow`, got `202 Accepted`. Auto-ping-on-publish is still a separate, not-yet-built feature.
~~Email aliases~~ — done 2026-07-24. All 8 on `ayodeji@revenstrat.com` and all 4 on `digitaltransformation@revenstrat.com` verified live (see TaskPulse repo's copy of this doc for the full list — same Workspace account, both brands).
Bing↔GA4 conversion linking — checked, no native product-link exists between Bing Webmaster Tools and GA4. Not needed anyway: GA4's default channel grouping already attributes Bing organic traffic automatically.
