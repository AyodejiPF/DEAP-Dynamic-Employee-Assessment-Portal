# Global Settings

This folder is the shared source of truth for preferences and configuration that you want
every AI coding tool to honour.

## Files

- global-settings.md  : shared preferences read at the start of a session.
- Add tool specific files here as needed, for example claude-code.md, codex.md.

## How tools use it

Any tool that has been pointed at this hub (see IDE_REFERENCE_MESSAGE.md in the parent
folder) reads global-settings.md and applies it. When a preference changes, update it here
once and every tool sees the same value.
