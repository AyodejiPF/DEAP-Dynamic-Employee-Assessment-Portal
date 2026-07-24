# Shared Skills and Global Settings reference

Paste the block below into the global settings, custom instructions, rules, or system
prompt field of any AI coding tool (Claude Code, Claude CLI, Cowork, Antigravity, Codex,
and others). It points the tool at one shared hub on this computer so skills and settings
are read and written in a single place.

---

SHARED HUB CONVENTION

This machine keeps one shared hub for reusable skills and global settings:

- Skills folder: C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\Skills
- Global Settings folder: C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\Global Settings

Rules for any AI tool that reads this:

1. When asked to use or find a skill, look in the Skills folder first. Each skill is a
   subfolder containing a SKILL.md file with name and description fields.
2. When asked to create a new skill, save it in the Skills folder as
   <skill-name>/SKILL.md, lowercase and hyphenated name.
3. Treat the Global Settings folder as the shared source of truth for preferences and
   configuration. Read global-settings.md at the start of a session and honour it.
4. When asked to change a global preference, write it into the Global Settings folder so
   every tool sees the same value.

---

## Honest note on how each tool actually consumes this

There is no single switch that makes every tool obey one arbitrary folder, because each
tool has its own config location. The block above makes the convention explicit so any AI
that reads your instructions will follow it. To make the link real rather than cosmetic on
Windows, point each tool at the hub using a directory junction (a transparent folder link):

- Claude Code and Claude CLI read skills from a .claude\skills folder. Link it with:
  cmd /c mklink /J "%USERPROFILE%\.claude\skills" "C:\Users\AyodejiPF\OneDrive\Desktop\AI Workbench\Skills"

- Codex and other tools that read a project or home rules file: add the block above to that
  file, or junction their skills directory to the hub the same way.

- Cowork manages skills in Settings, then Capabilities. Add a skill there by pointing it at
  the SKILL.md in the hub, or import it. Cowork cannot register a skill silently from chat.

- Antigravity and any tool with a custom instructions field: paste the block above.

Ask your AI assistant to create the junctions for the specific tools you use, and it can
wire them up in one step.
