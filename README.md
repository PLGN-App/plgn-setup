# plgn-setup

One command that connects your AI tool to plgn. It adds the plgn server (https://useplgn.com/api/mcp) to the tools you pick, and leaves everything else in them alone.

```
npx plgn-setup
```

It looks for the tools on your machine, shows the ones it found, and asks which to set up. After it writes, each tool needs one login step. plgn-setup never does the login for you and never sees your password.

## One tool at a time

| Command | Login step |
| --- | --- |
| `npx plgn-setup claude-code` | open Claude Code, type `/mcp`, pick plgn and log in |
| `npx plgn-setup codex` | run `codex mcp login plgn` |
| `npx plgn-setup cursor` | restart Cursor, open Settings, then MCP, and sign in to plgn when it asks |
| `npx plgn-setup gemini` | open gemini and type `/mcp auth plgn` |
| `npx plgn-setup windsurf` | restart Windsurf, open the MCP servers list in Cascade, and sign in to plgn when it asks |
| `npx plgn-setup vscode` | in VS Code run `MCP: List Servers`, pick plgn, press Start and allow the sign-in |
| `npx plgn-setup claude-desktop` | open Customize, Connectors, Add custom connector, name it plgn and paste the address |

Claude Code installs the plgn plugin (`claude plugin install plgn@plgn`). Claude Desktop has no file to edit, so plgn-setup prints the steps for you to do in the app.

## Check that it works

```
npx plgn-setup doctor
```

Doctor prints one table: ok, fail or skip for each check. It exits with 1 only when something fails. Its only network call is one public GET to see that plgn answers.

## Options

- `--yes` sets up every tool it finds, without asking.
- `--dry-run` shows what it would do and changes nothing.
- `--lang ar` prints everything in Arabic.

You can run it again at any time. If plgn is already set, it writes nothing.

## Backups

Before it changes a file, it copies the file to `<file>.plgn-backup-YYYYMMDD-HHmmss`. A backup is never overwritten. To go back, copy the backup over the file.

## Files it leaves alone

If it cannot change a file without risk, it does not touch it. It prints the snippet to paste yourself. This happens with:

- JSON that has comments.
- JSON whose numbers would be written differently, such as `1.0` or very large integers.
- TOML it cannot edit line by line.

## What it never does

- Ask for or store a key, token or password.
- Send anything anywhere, except doctor's one public GET.
- Collect telemetry.
- Drop your other servers or settings. It merges, it does not replace.

## Release (owner)

1. `npm test`
2. `npm pack --dry-run` lists only bin, src, README, CHANGELOG, LICENSE and package.json.
3. The owner then publishes to npm and creates PLGN-App/plgn-setup, on his word.
