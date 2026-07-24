---
name: automation-architecture
description: Automation architecture for designing recurring Codex jobs, monitors, reminders, data updates, social posting flows, n8n style workflows, ManyChat style interactions, and failure safe routines. Use when Ayodeji asks to automate, monitor, remind, continue later, update a file daily, check bug queues, post content, or reduce manual work.
---

# Automation Architecture

Use this skill to design automations that are useful, safe, and easy to maintain.

## Workflow

1. Define the trigger: time, event, user request, file change, queue state, or message.
2. Define the input source and whether it is trusted.
3. Define the output: file update, notification, report, message, task, or dashboard.
4. Define what should happen when there is nothing to do.
5. Define safety rules, especially for production data and customer communication.
6. Define memory, logs, and audit trail.
7. Define failure handling and escalation.
8. Prefer updating existing automations over creating duplicates.

## Design Checks

The automation must be specific enough to run without guessing.

It must not overwrite living records unless that is explicitly required.

It must have a stop condition when approval is missing.

## Output Format

Use a table with trigger, source, action, output, safety rule, frequency, owner, and failure path.
