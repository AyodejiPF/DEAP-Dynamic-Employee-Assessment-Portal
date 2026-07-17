# LEDGER (append only)

Schema: date | agent+model | prompt ref | asked | files touched | build | deploy | live check | commit | status

---

2026-07-17 | Claude Cowork (Fable) | AUDIT+REMEDIATE | Audit both products, then fix what is safe from a no-deploy sandbox | staffiq-website/* domain repair (60 files), .gitignore hardening, records/ protocol created in both repos, PRODUCT_AUDIT_REPORT updated | not run (static edits) | NOT DEPLOYED (no Firebase CLI in sandbox) | source verified: 0 broken domain tokens remain | uncommitted, left for owner review | PARTIAL(owner must commit, push, deploy, rotate keys, rebind taskpulse.ng)
