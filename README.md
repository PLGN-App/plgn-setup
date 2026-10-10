# plgn-setup

One command that connects your AI tool to plgn. It adds the plgn server (https://useplgn.com/api/mcp) to the tools you pick, and leaves everything else in them alone.

```
npx plgn-setup
```

It looks for the tools on your machine, shows the ones it found, and asks which to set up. After it writes, each tool needs one login step. plgn-setup never does the login for you and never sees your password.

## plgn's skills

After a tool is connected, plgn-setup also offers to install plgn's skills (its commands, roles and skills) into that tool's own skills folder. It asks first; `--yes` says yes, `--dry-run` only lists what it would copy, and `--no-skills` skips the step.

The skills are copied from the package itself. There is no network call and no `npx skills` run. Only folders named after plgn's own skills are ever replaced; every other folder in the skills folder is left alone, and a skill that is already identical is not rewritten.

| Tool | Skills folder |
| --- | --- |
| `codex` | `~/.codex/skills` or `$CODEX_HOME/skills` |
| `cursor` | `~/.cursor/skills` |
| `gemini` | `~/.gemini/skills` |
| `devin` | `~/.config/devin/skills` or `$XDG_CONFIG_HOME/devin/skills`; on Windows `%APPDATA%\devin\skills`, beside its config |
| `vscode` | `~/.copilot/skills` |

Claude Code gets the plgn plugin, which carries the skills. Claude Desktop has no skills folder.

If you already use the skills CLI, this works too:

```
npx skills add PLGN-App/plgn-setup
```

The skills CLI links each skill into the tool's folder and keeps it up to date itself. plgn-setup never replaces a linked plgn skill, so the two can live side by side.

## One tool at a time

| Command | Login step |
| --- | --- |
| `npx plgn-setup claude-code` | open Claude Code, type `/mcp`, pick plgn and log in |
| `npx plgn-setup codex` | run `codex mcp login plgn` |
| `npx plgn-setup cursor` | restart Cursor, open Settings, then MCP, and sign in to plgn when it asks |
| `npx plgn-setup gemini` | open gemini and type `/mcp auth plgn` |
| `npx plgn-setup devin` | restart Devin (formerly Windsurf), open the MCP servers list in Cascade, and sign in to plgn when it asks |
| `npx plgn-setup vscode` | in VS Code run `MCP: List Servers`, pick plgn, press Start and allow the sign-in |
| `npx plgn-setup claude-desktop` | open Customize, Connectors, click `+ Add`, then Add custom connector, name it plgn and paste the address |

Claude Code installs the plgn plugin (`claude plugin install plgn@plgn`). When the plugin is already there, it updates it (`claude plugin marketplace update plgn`, then `claude plugin update plgn@plgn`) and says from which version to which; restart Claude Code after an update. Claude Desktop has no file to edit, so plgn-setup prints the steps for you to do in the app.

A tool you name that is not found on this computer gets no file: plgn-setup asks first, and without a terminal it writes nothing and exits with 1. `--yes` writes the file anyway, ready for when you install the tool.

Devin is the new name of Windsurf. plgn-setup writes `~/.config/devin/mcp_config.json` (`%APPDATA%\devin\mcp_config.json` on Windows). If only the old Windsurf file `~/.codeium/windsurf/mcp_config.json` exists, it updates that one and says so. `npx plgn-setup windsurf` still works as an alias of `npx plgn-setup devin`.

## Check that it works

```
npx plgn-setup doctor
```

Doctor prints one table: ok, fail or skip for each check. It exits with 1 only when something fails. A tool with none of plgn's skills (you used `--no-skills` or said no) gets a skip row that says how to add them; only a partial set fails. Its only network call is one public GET to see that plgn answers.

Colours are on only in a real terminal; piped output and `NO_COLOR` turn them off.

## Options

- `--yes` sets up every tool it finds, without asking.
- `--dry-run` shows what it would do and changes nothing.
- `--no-skills` connects the tools but does not install plgn's skills.
- `--lang ar` prints everything in Arabic.

You can run it again at any time. If plgn is already set, it writes nothing; in Claude Code it updates the plgn plugin.

## Backups

Before it changes a file, it copies the file to `<file>.plgn-backup-YYYYMMDD-HHmmss`. A backup is never overwritten. To go back, copy the backup over the file.

## Removing plgn

plgn-setup has no remove command yet. To take plgn out of a tool by hand:

| Tool | What to remove |
| --- | --- |
| Claude Code | run `claude plugin uninstall plgn@plgn` |
| Codex CLI | the `[mcp_servers.plgn]` table in `~/.codex/config.toml`, and the `plgn-*` folders in `~/.codex/skills` |
| Cursor | the `plgn` entry under `mcpServers` in `~/.cursor/mcp.json`, and the `plgn-*` folders in `~/.cursor/skills` |
| Gemini CLI | the `plgn` entry under `mcpServers` in `~/.gemini/settings.json`, and the `plgn-*` folders in `~/.gemini/skills` |
| Devin | the `plgn` entry under `mcpServers` in its `mcp_config.json` (the file named above), and the `plgn-*` folders in its skills folder |
| VS Code | the `plgn` entry under `servers` in the user `mcp.json` (command `MCP: Open User Configuration`), and the `plgn-*` folders in `~/.copilot/skills` |
| Claude Desktop | the plgn connector in Customize, Connectors |

Only the folders whose names start with `plgn-` are plgn's; leave every other skill alone.

## Files it leaves alone

If it cannot change a file without risk, it does not touch it. It prints the snippet to paste yourself. This happens with:

- JSON that has comments.
- JSON whose numbers would be written differently, such as `1.0` or very large integers.
- TOML it cannot edit line by line.

## What it never does

- Ask for or store a key, token or password.
- Send anything anywhere itself. plgn-setup's own code makes one network call: doctor's public GET to see that plgn answers. The Claude Code setup is different by design: it runs Claude Code's own `claude plugin` commands, and those fetch the plgn plugin from GitHub (PLGN-App/PLGN-CLAUDE).
- Collect telemetry.
- Drop your other servers or settings. It merges, it does not replace.

## Release (owner)

0. After a plugin release, `gh workflow run generate.yml` refreshes `skills/`.
1. `npm test`
2. `npm pack --dry-run` lists only bin, src, skills, README, CHANGELOG, LICENSE and package.json.
3. The owner then publishes to npm and creates PLGN-App/plgn-setup, on his word.
