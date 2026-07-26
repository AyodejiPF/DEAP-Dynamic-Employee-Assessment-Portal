---
name: revenstrat-report-style
description: Formats Word document status, progress, audit, and diagnostic reports in Ayodeji Falope's established RevenStrat house style — dark header bands with white text, traffic light pastel status colour coding, charcoal body text, numbered sections, checkmark bullets, and a "Prepared for" byline block. Use whenever building a .docx status report, progress report, audit report, or diagnostic report for Ayodeji or RevenStrat/TaskPulse/StaffiQ.
---

# RevenStrat Report Colour Style

This style was reverse engineered directly from Ayodeji's own past reports (TaskPulse_Diagnostic_Security_Report.docx, TASKPULSE_ENTITLEMENT_FIX_STATUS_REPORT_2026_07_21.docx, TaskPulse_Confidential_Document_Status_Report.docx). All three use the same structural pattern with a coordinated palette per report, so treat the RULES below as fixed and the exact hex values as a safe default palette, not something to vary randomly.

## Structure (always include)

1. Title line — bold, larger size, in the header colour.
2. Subtitle line — one sentence describing what the report covers.
3. Byline block, three lines:
   - `Prepared for: Ayodeji Falope, RevenStrat Integrated Services`
   - `Date: [day Month year]`
   - `Project: [product name] ([domain]), Firebase project [project id]` (or equivalent system reference)
4. Numbered sections (`1.`, `2.`, `3.` …), each with a short bold heading.
5. Status lines inside sections start with a checkmark for resolved/done items: `✓ Fully resolved and confirmed working.`
6. Where a table is used for a status list, colour code every row by outcome (see palette below), never leave status rows plain white/black.

## Colour palette

Header band (title bands and table header rows) — pick one, keep it consistent through the whole document:
- Navy: fill `1F3864` or `2C3E90`, text `FFFFFF`
- Deep green: fill `0B3D2E`, text `FFFFFF`
- Charcoal: fill `212F3C`, text `FFFFFF`

Status colour coding (pastel fill + matching darker text, never plain black on a status cell):

| Status | Fill | Text |
|---|---|---|
| Resolved / Pass / Done | `E5F7EA` or `E2EFDA` (soft green) | `1E8449` or `2E7D32` (dark green) |
| Critical / Failed / Blocked | `FCE4E2` or `FBEAEA` (soft red/pink) | `C0392B` or `B3261E` (dark red) |
| Warning / In progress | `FFF3CD` (soft amber) | `B9770E` or `B7791F` (dark gold) |
| Informational / neutral | `EAF1F8` or `DCEAF7` (soft blue) | `1B4F72` or `1F6FA8` (dark blue) |

Body text: `212F3C`, `262626`, or `1E1E1E` (near black, never pure `#000000`).
Secondary/muted text: `5D6D7E`, `595959`, or `55645E`.
Optional gold/bronze accent for report titles or dividers: `D4AF37`.

## Rules

- Never use pure black (`000000`) or pure primary red/green/blue for text or fills. Always the muted/pastel values above.
- Every status table needs colour coding by row, not just the header row.
- Keep the header band colour consistent for the whole document, don't mix navy and green bands in one report.
- Use the docx skill for the actual file mechanics (tables, shading, fonts); this skill only governs the colour and structural choices layered on top.
- When in doubt on a specific hex, default to the navy header + green/red/amber status set above, it's the most frequently used combination across Ayodeji's existing reports.
