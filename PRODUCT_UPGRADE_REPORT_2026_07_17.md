# PRODUCT UPGRADE REPORT — 2026-07-17 (glossy look, music, security, domains)

> Auditor and engineer: Claude (Cowork). Read only became build. No deletion or deploy possible from here (mount is modify only, and the npm registry and Firebase CLI are network blocked). Every change is in source, verified, and ready for one deploy. Runbook at the end.

## 1. What you asked for, and what is done

| # | Request | Status |
|---|---|---|
| 1 | Change all domains back from Staff-iQ to staffiq | DONE. 0 Staff-iQ tokens left anywhere deployable. Brand text unified to StaffiQ, domain to staffiq.ng |
| 2 | Remove the folder tag that follows pages and tabs | DONE. It was a WebP favicon on a relative path that browsers could not render, so tabs fell back to a generic document icon. Switched to the universally supported PNG on a root absolute path across all 30 pages |
| 3 | Glossy, glassy, 3D look, keep it across all pages | DONE on StaffiQ (all 30 pages) and extended to TaskPulse (all 6 marketing pages) |
| 4 | Retain all text and pricing from the old design | VERIFIED. StaffiQ 10,000 / 12,500 / 15,000 and TaskPulse 7,500 / 12,500 / 15,000 all intact. The layer is additive, no content changed |
| 5 | Extend the glossy look to TaskPulse too, not only StaffiQ | DONE. A TaskPulse tuned dark and gold glossy layer plus the music now load on every TaskPulse marketing page |
| 6 | Placeholders zoom on hover | DONE. Icons and media zoom about 8 to 14 percent, cards lift and zoom about 4 percent with a 3D tilt, images inside cards zoom about 7 percent |
| 7 | Every clickable button glossy, none missed | DONE. A broad selector covers buttons, pill links, nav CTAs, toggles, submit buttons and role buttons on both sites, each with a specular shine sweep and hover lift |
| 8 | Music bar reacts faster, music more upbeat | DONE. Volume now reacts almost instantly, added animated equaliser bars, faster attack, and a brighter arpeggio over the pad with a quicker chord change. Ready to swap for your uploaded track by setting window.SQ_AMBIENCE_URL |
| 9 | Implement all necessary security measures | DONE. Full security header set on every hosting config (HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) plus a protective Content Security Policy on both marketing sites. Internal document leak protection from the earlier session is intact |
| 10 | Handle any html that should not be public, and naming | DONE. Confirmed there are no internal HTML pages in any deploy path. The preview file lives at a non deployed location. Added preview and draft html deploy guards. Reverted a risky folder exclusion that would have broken app images |
| 11 | Deploy online and verify | BLOCKED here. The sandbox cannot reach npm or Firebase, so I cannot install the CLI or push. Everything is staged for one deploy. Runbook below |

## 2. Verification (all green)

- Domains: 0 Staff-iQ tokens in any deployable StaffiQ file.
- Favicon: 0 WebP favicon links left; PNG favicon on 30 of 30 pages, source and dist.
- Pricing and text: intact on both sites.
- Assets: StaffiQ experience.css and experience.js present in source and dist, loaded through the global main.js. TaskPulse experience-tp.css and experience.js present in the artifact and public, injected into all 6 pages.
- JavaScript: passes node syntax check. All four hosting configs are valid JSON.
- Security headers: 6 on each marketing config (including CSP), 5 or more on each app config.
- Internal leak scanner: passes on both deploy artifacts.
- Safety net: reverted an ignore rule that would have hidden ui2 and ui-previews assets the app actually uses.

## 3. Files changed this session

StaffiQ (DEAP): staffiq-website assets css experience.css (rewritten v2), assets js experience.js (v2, theme aware), all 30 pages favicon and Staff-iQ to StaffiQ (source and dist), staffiq-website firebase.json (security headers), firebase.json (security headers).
TaskPulse: public experience-tp.css (new), public experience.js (new), .firebase taskpulse hosting experience-tp.css and experience.js and 6 injected pages, firebase.json and firebase.taskpulse-hosting.json (security headers, preview guards).

## 4. Deploy runbook (from your authenticated machine)

```
# StaffiQ marketing (publishes glossy look, music, favicon fix, domain revert, headers)
cd "DEAP Dynamic Employee Assessment Portal/staffiq-website"
node ../scripts/guard-no-internal-leaks.mjs dist
firebase deploy --only hosting:staffiq-ng --project iicocece-assessment
# verify: open https://www.staffiq.ng, check the tab icon is the StaffiQ mark (not a folder),
# the login button goes to staffiq.ng/login, cards zoom and tilt on hover, the music control
# is bottom left and plays an upbeat ambience, and every button has a glossy sheen on hover.

# TaskPulse marketing (publishes the glossy look, music, and fixes the internal-document homepage)
cd "iicocece Task Pulse"
node scripts/guard-no-internal-leaks.mjs .firebase/taskpulse/hosting
firebase deploy --only hosting:taskpulse-16553 --project taskpulse-icocc
# In the Firebase console, confirm www.taskpulse.ng is attached to the site that shows the
# marketing homepage (the one live at taskpulse-icocc.web.app), not the internal document.
```

## 5. Still yours to do (needs your machine or a decision)

- Deploy both sites with the runbook above (I could not, network blocked here).
- Commit and push both repos (your changes are clean in the working tree; nothing was committed).
- Rebind the taskpulse.ng custom domain to the correct hosting site.
- Rotate the leaked API keys, purge history, make the DEAP repo private (security runbook in PRODUCT_AUDIT_REPORT section R6).
- Create the real GA4 property and replace G-XXXXXXXXXX.
- Upload your own music track and set window.SQ_AMBIENCE_URL to use it instead of the generated ambience.
- Decide the brand spelling once (StaffiQ now, Staff-iQ later when you register the hyphenated domain).

## 6. Honest notes

- I could not deploy or verify live because this environment cannot reach npm or Firebase. I tried; it timed out. I will not claim a deploy I did not do.
- The glossy layer is additive and reversible. On StaffiQ it targets your real class names precisely. On TaskPulse, which is a compiled Tailwind build, it targets utility patterns conservatively, so the truly bespoke pass belongs in the TaskPulse source components, using the StaffiQ experience files as the template.
- The background music never autoplays before a click, because every browser blocks that and it is better for visitors. It remembers the choice across pages so it feels continuous.

*End of upgrade report.*
