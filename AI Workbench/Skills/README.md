# Skills

This folder holds reusable skills that any AI coding tool can read and write.

## Layout

Each skill is its own subfolder containing a SKILL.md file:

```
Skills/
  app-ui-decomposition/
    SKILL.md
  <next-skill>/
    SKILL.md
```

## SKILL.md format

A SKILL.md begins with a small front matter block, then instructions:

```
---
name: skill-name-lowercase-hyphenated
description: One clear paragraph saying what the skill does and when to trigger it.
---

# Title

Instructions the assistant follows when the skill is used.
```

## Adding a skill

Drop a new `<name>/SKILL.md` here. To make a tool actually use it, see
IDE_REFERENCE_MESSAGE.md in the parent folder.
