# plgn-setup: one command that connects any AI tool to plgn, 2026-10-08

Owner, 2026-10-08 ~01:00: the plugin must work "in any other AI app or CLI" with an install "like npx skills add",
everything configured, professional. Order: CLIs first, ChatGPT after. This is the installer half of round 1.
The skills half (commands as portable skills) waits for plugin 1.17.0 and is a separate spec.

## 1. What it is

A tiny npm CLI, `npx plgn-setup`, that puts plgn's MCP server into the config of the AI tools a person has, tells
them the one step to log in, and can check the result later. plgn's MCP server is remote,
`https://useplgn.com/api/mcp`, with OAuth (PKCE, dynamic client registration). There is no key, so the installer
never asks for one and never stores one; the host tool holds its own login.

## 2. Commands

- `npx plgn-setup` : detects installed hosts, asks which to set up (detected ones pre-checked), backs up each
  config file it will touch, merges the plgn entry in (other servers untouched, running twice changes nothing),
  prints per host the exact next step to log in. `--yes` takes the detected set with no questions. `--dry-run`
  prints what would change and writes nothing. `--lang ar` switches the words to Arabic (Western digits).
- `npx plgn-setup <host>` : one host only. Host names: `claude-code`, `codex`, `cursor`, `gemini`, `windsurf`,
  `vscode`, `claude-desktop`.
- `npx plgn-setup doctor` : for each host: config found, plgn entry present with the right URL, host version if the
  binary answers; plus plgn reachable (GET `https://useplgn.com/.well-known/oauth-protected-resource`, public, no
  login). A table, green or red per line, exit code 1 when any line is red.

## 3. Hosts in v1

| Host | What the installer does |
|---|---|
| Claude Code | runs `claude plugin marketplace add PLGN-App/PLGN-CLAUDE` and `claude plugin install plgn` when `claude` is on PATH; else prints both lines. The plugin already carries the MCP server. |
| Codex CLI | `~/.codex/config.toml`: `[mcp_servers.plgn] url = "https://useplgn.com/api/mcp"`; next step `codex mcp login plgn` (or the current equivalent). |
| Cursor | `~/.cursor/mcp.json`: `mcpServers.plgn.url`; next step: open Cursor settings, MCP, press the plgn login. |
| Gemini CLI | `~/.gemini/settings.json`: `mcpServers.plgn.httpUrl` with OAuth enabled; next step `/mcp auth plgn`. |
| Windsurf | `~/.codeium/windsurf/mcp_config.json`: `mcpServers.plgn.serverUrl`. |
| VS Code (Copilot) | the user-level `mcp.json`: `servers.plgn` of type `http`. |
| Claude Desktop | no file: prints the connector steps (Settings, Connectors, Add custom connector, the URL). |

Each host lives in `src/hosts/<host>.js` with: `detect()`, `configPath()`, `merge(existingText) -> newText`,
`nextStep(lang)`, `doctor()`. The exact file format and login command of every host MUST be verified by the
builder against the host's current official documentation (context7 or the docs site) on the build day and the
source URL written in a comment at the top of that host file. Hosts drift; this is the one place we accept it.

## 4. Rules

- Back up before writing: `<file>.plgn-backup-<YYYYMMDD-HHmmss>`; say where the backup is.
- Merge, never replace: TOML and JSON files are parsed and re-serialised with the other entries kept; an existing
  plgn entry is updated in place. A file that does not parse is left alone and reported red with the path.
- Idempotent: a second run reports "already set" and writes nothing.
- No network except `doctor`'s one public GET. No telemetry. No token, key or password anywhere, ever.
- Words: English default, Arabic with `--lang ar` from one phrase table (`src/i18n.js`), Western digits only,
  "points" never "credits", lowercase "plgn".
- Node 20+, ESM JavaScript, dependencies: `@clack/prompts`, `picocolors`, `smol-toml` (or the smallest maintained
  TOML parser that round-trips). No build step. `package.json` has `bin: { "plgn-setup": "bin/plgn-setup.js" }`.

## 5. Repo

`plgn-setup` (GitHub `PLGN-App/plgn-setup` when the owner says so; npm name `plgn-setup`, free as of 2026-10-08).
Layout: `bin/plgn-setup.js`, `src/cli.js`, `src/hosts/*.js`, `src/doctor.js`, `src/i18n.js`, `src/backup.js`,
`test/*.test.js` (node:test), `README.md` (one install line per host, the doctor, the backup rule, what it never
does), `CHANGELOG.md`, `LICENSE` (MIT), `.gitignore`. Version 0.1.0.

## 6. Tests (node:test, `npm test`)

- Each host's `merge`: empty file, file with other servers, file with an old plgn entry, unparsable file.
  The result keeps the others, has exactly one plgn entry with the right URL, and is stable on a second merge.
- `backup` writes a copy with the stamp and never overwrites an earlier backup.
- `detect` with a fake home and PATH.
- `doctor` with a fake fetch: green table, red table, exit codes.
- CLI smoke: `--dry-run --yes` on a fake home prints the plan and leaves the files untouched; `--lang ar` prints
  Arabic with Western digits.

## 7. Out of scope (later specs)

Installing the skills (`npx plgn-setup skills` running `npx skills add PLGN-App/plgn`) after plugin 1.17.0; the
ChatGPT plugin folder; publishing to npm (the owner's npm account; the build leaves `npm pack` clean and a release
checklist in the README); creating the GitHub repo (the owner's word).

**Rules for every builder**: commits with `git -c user.name=PLGN -c user.email=waslahapp993@gmail.com`, one line,
no Co-Authored-By and no Claude-Session line; Arabic text only with the Edit/Write tools; never print a token.
