---
name: status
description: Produces a full chronological status report of every task Ayodeji has ever given, from the very first conversation onward, right in the chat response window. Use whenever Ayodeji types /status or asks "what's the status of everything" or "go through the entire chat and list every task." Colourful, emoji-rich, professional. Companion skill statusdocreport produces the same report as a Word document instead.
---

# /status — Full Chronological Status Report

## What this does

When invoked, this skill produces one report, in this exact structure, in the chat response window:

1. 🚦 **Top line summary in brackets** — one bolded sentence, my headline read on where things stand overall, right at the very top before anything else.
2. 📜 **Chronological task list** — every task Ayodeji has ever asked for, in the order he asked for it, oldest first, across every session, not just the current one.
3. ✅ **Status per task** — Done, 🟡 In progress, 🔴 Blocked, or ⚪ Not started, plus a one line reason why.
4. 💡 **My recommendation** — what I think should happen next, ranked, and clearly marked as my opinion.
5. 🙋 **What I need from you** — a specific, actionable list of anything only Ayodeji can provide: a decision, an approval, credentials, a click in a browser, an answer to a question. If nothing is needed, say so plainly.

## How to gather the full history

Do not rely only on the current conversation. Before writing the report:

1. Call `mcp__session_info__list_sessions` (load via ToolSearch first if deferred) to see every past session available.
2. Call `mcp__session_info__read_transcript` on each relevant past session to pull the tasks Ayodeji asked for and what was actually done.
3. Merge everything into one single chronological list, deduplicating anything repeated across sessions (Ayodeji often repeats a request across multiple messages or sessions, list it once, note it was repeated if relevant to why it stalled).
4. If session history tools are not available or return nothing, say so plainly and fall back to only the current conversation rather than guessing or inventing history.

## Colour and formatting rules

- Use tables wherever there is a list of tasks, this is Ayodeji's standing preference.
- Use emoji status markers consistently: ✅ Done, 🟡 In progress, 🔴 Blocked, ⚪ Not started.
- Use bold and colour coded language liberally, this report should be fun and energetic to read, not a dry log.
- Stay professional underneath the colour, this is still a real status report someone could act on, not just decoration.
- Never use pure black text framing, keep the tone warm.

## Rules

- Never invent a task Ayodeji did not actually ask for. If unsure whether something was a real request or an aside, say so rather than guessing.
- Every "Blocked" or "Not started" item must have a clear, specific reason, not a vague "pending."
- The "what I need from you" section must be genuinely actionable, a named decision, a specific credential, a specific click, never a vague "let me know."
- If a task type needs a permission, login, or authentication Ayodeji has not yet granted, list it explicitly here rather than silently skipping the task.
- Keep the whole report scannable in under two minutes, use the table and the five sections above, do not pad with narrative filler.
