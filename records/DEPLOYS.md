# DEPLOYS (append only)

Schema: date time | site | artifact | command | live check result | rollback point (previous commit or tag)

---

# Seed from prior records (reconstructed, verify):
2026-07-15 | staffiq-ng | staffiq-website/dist | firebase deploy --only hosting:staffiq-ng | staffiq.ng and www 200, apex redirects to www | prior deploy
2026-07-13 | taskpulse-icocc | Next.js build | firebase deploy | Deploy complete (softdelete, usermgmt logs) | prior commit

# NEXT REQUIRED DEPLOY (owner):
# staffiq-ng: rebuild + deploy to publish the domain link fixes and the current price/brand.
# taskpulse.ng: rebind the domain to the correct hosting site, then deploy. See PRODUCT_AUDIT_REPORT section 15.
