# StaffiQ website

Public website for StaffiQ, the workforce training and assessment product for African SMEs from RevenStrat Integrated Services.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Product overview and primary conversion page |
| `features.html` | Product capabilities and role access summary |
| `training.html` | Typical training catalogue and custom content workflow |
| `pricing.html` | Approved Starter, Growth and Command pricing with minimum user commitments |
| `about.html` | RevenStrat product story and TaskPulse relationship |
| `contact.html` | Demonstration request and direct email contact |
| `404.html` | Branded not found page |

## Commands

```bash
npm run check
npm run build
```

The production output is generated in `dist` and deployed through the dedicated Firebase Hosting target in `firebase.json`.

## Hosting

Temporary Firebase address: `https://staffiq-ng.web.app`

Planned custom domains: `staffiq.ng` and `www.staffiq.ng`

The custom domains should be attached in Firebase Hosting after the DNS records are available.

## Contact delivery

The current static contact form opens a prepared email to `hello@staffiq.ng`. It does not collect or store visitor data on the website.
