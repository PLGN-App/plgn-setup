# Changelog

## 0.2.0 - 2026-10-08

- Installs plgn's skills (commands, roles and skills from the plgn plugin) into Codex CLI, Cursor, Gemini CLI, Devin and VS Code (GitHub Copilot) from the package itself: no network, and it never touches other skills.
- `--no-skills` skips the step; `--dry-run` lists what would be copied.
- `doctor` counts the installed skills for each of those tools.
- `npx skills add PLGN-App/plgn-setup` also works.

## 0.1.0 - 2026-10-08

- Sets up plgn in seven tools: Claude Code, Codex CLI, Cursor, Gemini CLI, Devin (formerly Windsurf; `windsurf` still works as an alias), VS Code and Claude Desktop.
- `npx plgn-setup doctor` checks each tool and plgn itself.
- English and Arabic (`--lang ar`).
- Backs up every file before changing it, merges and never replaces, and does nothing on a second run.
