# StaffiQ WhatsApp AI Assistant — Adapted from the TaskPulse Mr Ayo Plan

Owner: Claude (Cowork). Date opened: 2026-07-22. Status: analysis complete, build pending
Ayodeji's go ahead.

> Companion document: `MR_AYO_WHATSAPP_AGENTIC_ASSISTANT_PLAN.md` in the TaskPulse repo. Same
> underlying idea — DeepSeek connected to WhatsApp so the in app AI assistant can be reached
> there too — applied here to StaffiQ, a training and assessment platform, not a task tracker.
> Read that document first for the DeepSeek V4 flash capability notes; they are not repeated
> in full here.

## 1. Why the shape of the feature changes here

TaskPulse's Mr Ayo idea centres on "complete a task." StaffiQ has no equivalent single action —
its value is training content, assessments, scores, and certificates. A WhatsApp assistant here
should be reframed around:

- checking assigned assessments and their due dates
- checking a score or certificate status after finishing an assessment
- a training reminder nudge ("You have 2 modules due this week")
- answering how to questions, reusing `AIHelpAssistant.tsx`'s existing quick prompt bank
  ("How do I take a test?", "Understanding my results", "What is a question bank?")

Taking a full multiple choice assessment inside a WhatsApp thread is a poor fit for anything
beyond a handful of questions, so that is out of scope for a first version. WhatsApp here is a
companion channel for status, reminders, and help, not a replacement exam interface.

## 2. A real gap this surfaces: StaffiQ has no manager or hierarchy tier yet

`database/schema.sql` defines exactly three roles: `super_admin`, `admin`, `employee`. There is
no supervisor, manager, or department head concept, and no reporting chain field anywhere in the
schema. Yet `AIHelpAssistant.tsx` already ships a quick prompt, "What features are available for
supervisors and managers?", which implies the product intends a tier that the data model does
not yet support.

This matters for two things at once: the WhatsApp assistant requested here, and the hierarchy
aware AI access control Ayodeji asked for earlier this session (juniors cannot see manager or
executive information, managers see their own information plus everyone junior to them). Both
features need the same missing piece: a manager or reporting field on the employee record.
Building the WhatsApp assistant without this in place means, honestly, that a WhatsApp query
about "my team's progress" cannot be scoped correctly yet, because there is no data saying who
is on whose team. This is not a reason to delay the read only, self service parts of the
assistant (an employee checking their own assessments needs no hierarchy at all), but any
manager facing WhatsApp query should wait until the reporting field exists.

## 3. What needs to be built, in order

1. **Number linking**, same pattern as TaskPulse: a verified `whatsapp_number` column on the
   employee record, confirmed via a one time code, never inferred.
2. **Read only, self service tools first**, no hierarchy dependency:
   - `my_assigned_assessments`
   - `my_last_result`
   - `my_certificates`
   - `ask_help(question)` — routes into the same AI help pipeline `AIHelpAssistant.tsx` already
     uses, so the answer stays consistent between web and WhatsApp.
3. **Reminders**, outbound only at first: a scheduled job that messages employees with
   assessments due soon, reusing whatever notification/email trigger already exists for due
   dates rather than building a second reminder system.
4. **Manager tier and reporting field** (prerequisite for anything team scoped): add a
   `manager_id` style column, a UI to assign it, and extend `AiGate`/`ai-access.ts` with the
   same reporting chain logic proposed for TaskPulse's `user-visibility.ts`, so the two products
   share one mental model even though the code is not shared.
5. **Manager facing tools**, only after step 4: `team_progress_summary`, `overdue_report`,
   scoped strictly to direct and indirect reports, admin and super_admin unrestricted as today.

## 4. Plan and quota interaction

StaffiQ already gates AI features by tenant plan (`ai-access.ts`, `PLAN_AI_FEATURES`). A WhatsApp
channel should sit behind the same gate, most naturally as a new `AIFeatureName` value (for
example `whatsapp_assistant`) added to that plan feature map, so an organisation on a plan
without AI features does not get a WhatsApp assistant either. Reuse `logAIUsage()` unchanged for
tracking.

## 5. DeepSeek V4 flash notes

Not repeated in full — see the TaskPulse companion document, section 3. Short version: function
calling support and multimodal (voice note) support were not verified live this session because
web search hit its session limit (resets 3:30pm Lagos). Treat DeepSeek V4 flash as text only
until confirmed, and plan for a transcription pre processing step if voice notes matter here.

## 6. Open questions for Ayodeji

- Confirm whether "supervisors and managers" in the existing help copy reflects a real, planned
  data model change, or is aspirational copy that should be toned down until the schema catches
  up.
- Confirm the reminder cadence wanted for assessment due dates over WhatsApp.
- Confirm whether this ships on the same phone number/channel as any existing StaffiQ WhatsApp
  presence, or a new one.
