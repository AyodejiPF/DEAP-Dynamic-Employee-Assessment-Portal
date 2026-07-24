---
name: browser-testing-playbook
description: Actually exercises a web app in a real browser — clicking through flows, checking console errors, verifying responsive behaviour — instead of reasoning about whether the code should work. Use before calling a UI or frontend change complete, when asked to test a web app, or when debugging something that only manifests in the browser.
---

# Browser Testing Playbook

Reading code is not testing it. This skill exists to force the actual browser step.

## What to check
1. **The golden path** — the primary flow the change was meant to support, clicked through end-to-end.
2. **Console errors** — check the browser console for errors/warnings a code review wouldn't surface.
3. **Network failures** — what happens if a request the page depends on fails or is slow?
4. **Empty/error states** — do they render correctly, not just the happy path?
5. **Responsive behaviour** — does it hold up at a narrow viewport, not just the developer's default window size?

## Process
1. Use an available browser tool (Claude in Chrome, Playwright MCP, or the Browser pane) to actually load the page — don't substitute reasoning about the code for this step.
2. Exercise the golden path first, then deliberately try to break it (bad input, slow network, a missing resource).
3. Report exactly what was observed (screenshots, console output) — not what should theoretically happen.
4. If no browser tool is available, say so explicitly rather than presenting untested code as verified.

## What NOT to do
- Don't claim something "works" based on reading the code alone when a browser tool was available and unused.
- Don't test only the happy path — the golden-path check is necessary but not sufficient.
