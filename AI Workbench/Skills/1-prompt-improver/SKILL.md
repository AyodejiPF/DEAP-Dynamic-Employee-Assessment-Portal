---
name: 1-prompt-improver
description: "Improve and expand a rough message, instruction, brief, or prompt using Ayodeji's single Prompt Improver workflow only, then implement the improved request unless the user clearly asks for prompt improvement only. Use when the user types /P1, P1, /1, asks to improve a prompt, improve a message before sending, run one prompt improver, make a prompt clearer, stronger, deeper, more detailed, more professional, more actionable, or 15x to 20x better without also requesting the feature improvement workflow."
---

# 1 Prompt Improver

## Purpose

Use this skill to turn a rough message or prompt into a clearer, more powerful, more complete instruction while preserving the user's original intent, then use the improved prompt to complete the requested work. This skill only performs the first improvement workflow. Do not run the feature improvement workflow unless the user explicitly asks for the second skill, both improvers, or the feature improver.

## Invocation

Use this skill when Ayodeji types `/P1`, `P1`, or `/1` before or after a message. Treat `/P1` as the preferred short command for the single Prompt Improver workflow.

## Core Workflow

1. Capture the original prompt exactly as the user provided it.
2. Identify the real objective, audience, intended recipient, expected output, tone, constraints, missing context, success criteria, and delivery format.
3. Improve the prompt first, then implement the improved request unless the user clearly says prompt only, improve only, rewrite only, do not implement, or asks for a send ready message only.
4. Preserve the original meaning, but add useful detail, structure, examples, edge cases, output expectations, quality standards, and practical constraints.
5. Expand deeply when the user asks for a powerful or detailed prompt. When Ayodeji asks for the standard prompt improver, aim for a result that is roughly fifteen to twenty times stronger in clarity, specificity, and execution value, not merely longer.
6. If the prompt involves current practice, professional standards, market trends, tools, public information, law, medicine, finance, software versions, platform capabilities, or anything time sensitive, conduct current research before finalising the improved prompt.
7. If the user only asks to improve a message before sending, produce the improved message directly in a polished, send ready form and do not add unrelated execution.
8. If the user asks to improve a prompt for AI execution only, produce an improved prompt that another AI agent can follow immediately.
9. If the user asks for an outcome or task to be completed, use the improved prompt as the execution instruction and deliver the finished result.

## Improvement Standard

The improved prompt must include the following qualities where relevant:

1. A clear role for the receiving AI or person.
2. A precise task statement.
3. Relevant background context.
4. The desired output format.
5. The expected level of detail.
6. Constraints, boundaries, exclusions, and non negotiables.
7. Quality criteria for judging a good answer.
8. Specific examples where they would reduce ambiguity.
9. Instructions for handling uncertainty.
10. Instructions for avoiding vague, generic, or inflated output.
11. Ethical and accuracy safeguards where relevant.
12. A practical end state that makes the output usable immediately.

## Output Format

When the user asks for prompt improvement only, use this format unless the user requests something different:

```text
Improved prompt

[Write the improved prompt here.]
```

When the user asks for implementation, keep the improved prompt internal unless showing it would help, then deliver the finished result directly. When useful, add a short note explaining that the prompt was improved before execution.

## Boundaries

Implement the task described inside the original prompt after improving it, unless the user clearly asks for prompt improvement only, rewrite only, wording only, or a send ready message.

Do not invent facts, credentials, dates, prices, laws, medical guidance, or market data. Research current information when the prompt depends on it.

Do not dilute a direct message with unnecessary corporate language. Make it sharper, clearer, and easier to act on.
