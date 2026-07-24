---
name: 2-prompt-feature-improver
description: "Run Ayodeji's combined prompt improvement workflow, then implement the improved request unless the user clearly asks for prompt improvement only: first improve the original prompt with the standard Prompt Improver, then combine the original and improved prompt and expand it through the Feature Prompt Improver. Use when the user types /P2, P2, /2, asks to use both improvers, use the feature improvement prompt, use two prompt improvers, improve a web app feature prompt, create a production ready implementation brief, or improve and then implement a product, web app, UI, UX, feature, funnel, presentation, or strategy request."
---

# 2 Prompt Feature Improver

## Purpose

Use this skill when Ayodeji wants the full two stage workflow. The result must be stronger than a normal prompt rewrite because it combines the user's original request, the improved prompt, and a feature focused expansion before execution. After the two stage improvement, implement the improved request unless Ayodeji clearly asks for prompt improvement only.

## Invocation

Use this skill when Ayodeji types `/P2`, `P2`, or `/2` before or after a message. Treat `/P2` as the preferred short command for the full Prompt Improver plus Feature Prompt Improver workflow.

## Required Workflow

1. Preserve the user's original prompt as source material.
2. Run the standard prompt improvement process from `1-prompt-improver`.
3. Combine the original prompt and the improved prompt into one enriched feature description.
4. Run the combined feature description through the feature improvement workflow.
5. Use all three layers when producing the final deliverable:
   1. The original prompt.
   2. The improved prompt.
   3. The feature improved implementation brief.
6. Implement from the final synthesised brief unless Ayodeji clearly says prompt only, improve only, brief only, do not implement, or asks only to inspect the prompt.
7. If Ayodeji asks to see the prompt work, present the three layers clearly before or alongside the deliverable.
8. If Ayodeji asks for only the final deliverable, keep the prompt work internal and deliver the finished artefact.

## Standard Prompt Improvement Stage

Create an improved version of the original request that is clearer, deeper, more structured, and more executable. Preserve intent while adding context, desired output format, quality criteria, constraints, success measures, audience assumptions, and handling of uncertainty.

## Feature Improvement Stage

Transform the combined original and improved prompt into a production ready execution brief. When the work concerns a web app, software feature, dashboard, product interface, user journey, or technical product improvement, include the following areas where relevant:

1. Strategic objective and business value.
2. Target users, customer segments, stakeholders, and buyer motivations.
3. Functional requirements.
4. User stories for desktop, tablet, and mobile contexts.
5. Interaction flows.
6. Empty states, error states, loading states, permission issues, and recovery paths.
7. Data requirements, validation rules, storage expectations, and API assumptions.
8. Responsive layout expectations.
9. Accessibility requirements.
10. Performance requirements.
11. Security and privacy considerations.
12. Browser, device, and network considerations.
13. Testing and acceptance criteria.
14. Implementation risks.
15. Prioritised recommendations.
16. Practical launch or deployment guidance where the user has asked for execution.

## Research Requirement

Use current research whenever the task depends on real world facts, market conditions, customer behaviour, regulations, pricing, technology standards, platform capabilities, tools, or implementation best practice.

For web and software features, research these areas when relevant:

1. Current developer implementation patterns.
2. User experience research and behavioural evidence.
3. Mobile, tablet, desktop, and low bandwidth usage realities.
4. Accessibility standards and assistive technology expectations.
5. Browser and platform compatibility.
6. Security standards and common risks.
7. Current libraries, frameworks, or services that could reduce development risk.

Use primary or authoritative sources when making technical claims. Use multiple sources for market or customer behaviour claims.

## Output Contract

When asked to provide the prompt artefacts, use this structure:

```text
Original prompt

[Paste or summarise the original prompt.]

Improved prompt

[Provide the standard improved prompt.]

Feature improved implementation brief

[Provide the expanded implementation brief.]
```

When implementation is requested or implied, do the prompt synthesis first, then produce or modify the requested deliverable. In the final response, briefly state that the two stage workflow was used and summarise the completed output.

## Execution Rules

Do not stop at analysis when the user asks for implementation or gives a task that can be executed.

Do not convert a direct execution request into a long theoretical plan unless the user explicitly asks for a plan only.

Do not create artificial rollout phases when Ayodeji asks for everything to be implemented in one go.

Do not ignore the original prompt after improving it. The final execution must honour both the original request and the improved version.

Do not add fluff. Every added detail must make the final output clearer, more useful, or easier to implement.

If Ayodeji wants only the improved prompt or the implementation brief, stop there. Otherwise, treat the improved brief as the instruction to execute.
