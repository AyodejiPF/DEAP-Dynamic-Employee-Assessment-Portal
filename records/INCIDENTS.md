# INCIDENTS (append only)

Schema: date | symptom | root cause | fix | prevention rule

---

2026-07-17 | www.taskpulse.ng serves an internal billing document as its homepage; subpages and /go-to-app blank | The custom domain is bound to the wrong hosting artifact; the correct marketing build is live only at taskpulse-icocc.web.app | OPEN: rebind domain to the correct site and redeploy | Keep one documented map of domain to site to artifact; never point a domain at a docs artifact

2026-07-17 | Live Staff iQ pages carried a dead login URL (Staff-iQ.ng), a dead email (hello@Staff-iQ.ng) and a dead social image URL | A rebrand find and replace rewrote the domain token, not only the display name, across 60 files (418 occurrences) | FIXED in source and dist (Staff-iQ.ng to staffiq.ng); awaiting redeploy | After any find and replace, run a link and email verifier over every href and mailto before deploy

2026-07-15 | Five marketing pages truncated mid file | A bulk script committed a stale, truncated read through the sandbox mount | Pages reconstructed and verified via the Read tool | Avoid bulk shell rewrites of whole HTML files through the mount; prefer targeted edits and re verify

2026-07-16 | Ten Cloud Functions returned errors until an invoker fix | Functions lacked a public invoker binding | Added invoker public to all ten, endpoints returned 200 | Include invoker settings in the deploy checklist
