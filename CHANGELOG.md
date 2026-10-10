# Changelog

## 0.2.1 - 2026-10-10

- Claude Code: running setup again updates the plgn plugin (`claude plugin marketplace update plgn`, then `claude plugin update plgn@plgn`) and says from which version to which, then asks for a restart. An admin's managed install is left alone.
- Devin's skills go to `%APPDATA%\devin\skills` on Windows, beside its config, the folder Devin reads there (it was `~/.config/devin/skills`, which Devin on Windows does not read).
- A tool named on the command line but not found on this computer gets no file unless you say yes or pass `--yes`, and the line after says the tool is not installed. Without a terminal, nothing is written and setup exits with 1.
- `doctor` shows a skip row, not a failure, for a tool with none of plgn's skills (after `--no-skills` or a no), so it no longer exits with 1 for that alone. A partial set still fails.
- A plgn skill that the skills CLI linked into a tool's folder is never replaced by the bundled copy.
- The README says how to take plgn out of each tool by hand.

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
