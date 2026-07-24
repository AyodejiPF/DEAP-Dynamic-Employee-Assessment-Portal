---
name: execution-prompt-engineering
description: Execution focused prompt engineering for improving rough user prompts into clear implementation briefs. Use when Ayodeji asks to improve a prompt, improve twice, use prompt improver, combine original prompt with improved prompt, create a Codex brief, or turn a vague request into a safe executable instruction.
---

# Execution Prompt Engineering

Use this skill to transform rough instructions into prompts that another Codex thread can execute safely.

## Workflow

1. Preserve the original intent.
2. State the real objective in one sentence.
3. Add context that affects execution, such as product, repo, files, user, audience, date, platform, and live risk.
4. Add constraints, including data safety, permissions, language, deployment, tools, and output format.
5. Define done criteria that can be verified.
6. Split planning from implementation when the request is too broad.
7. Remove emotional repetition while keeping urgency.
8. Add a fallback if a required tool, account, file, or permission is unavailable.

## Two Pass Improvement

Pass one should make the prompt clear, complete, and safe.

Pass two should make it operational: exact steps, verification, risks, deliverables, and stop conditions.

## Quality Checks

Check that the improved prompt answers:

What is being built or done?

Where should it happen?

What must not be touched?

How will success be verified?

What should the assistant report at the end?

## Output Format

Show the original prompt, improved prompt one, improved prompt two, and the final execution prompt.
