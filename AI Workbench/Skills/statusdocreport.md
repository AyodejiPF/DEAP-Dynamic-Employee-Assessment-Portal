---
name: statusdocreport
description: Produces the exact same full chronological status report as the status skill, but as a colourful Microsoft Word (.docx) file instead of a chat response. Use whenever Ayodeji types /statusdocreport or asks for the status report as a Word document. Always run the status skill's research and content first, then apply the revenstrat-report-style skill's colour palette, then build the file with the docx skill.
---

# /statusdocreport — Full Chronological Status Report as a Word Document

## Order of operations

1. Do everything the `status` skill does to gather and structure the content: pull full history via `mcp__session_info__list_sessions` and `mcp__session_info__read_transcript`, build the chronological task list, statuses, recommendation, and what's needed from Ayodeji.
2. Read the `revenstrat-report-style` skill (`AI Workbench/revenstrat-report-style-SKILL.md`) for the exact colour palette and structural conventions to apply.
3. Read the `docx` skill for the mechanics of building the actual Word file.
4. Build the .docx file using both together.
5. Save the file and present it to Ayodeji, do not just describe it.

## Document structure

1. Title band in the header colour (navy, deep green, or charcoal, pick one and stay consistent) with white text: "TaskPulse & StaffiQ Status Report."
2. Byline block: `Prepared for: Ayodeji Falope, RevenStrat Integrated Services`, `Date: [today]`, `Project: TaskPulse and StaffiQ`.
3. One bolded summary line at the top in the header colour, the same headline used in the chat version.
4. A full colour coded table of every task, columns: Task, Status, Why. Status column shaded per the traffic light rule (green/resolved, amber/in progress, red/blocked, blue/not started) with matching darker text, never plain black on a status cell.
5. A recommendations section, numbered, clearly marked as Ayodeji's assistant's opinion.
6. A "What I need from you" section, numbered, specific and actionable.
7. Use emoji sparingly in the Word document compared to the chat version, Word documents read more formally even when colourful, keep emoji to section markers rather than inline in every sentence.

## Rules

- This must be a real .docx file built and saved, never a description of what the file would contain.
- Follow every rule in revenstrat-report-style exactly: no pure black, no plain primary colours, consistent header band, every status row colour coded.
- Keep the content identical in substance to what the chat version of /status would say, only the presentation differs.
- Present the finished file to Ayodeji when done, don't just say it's ready.
