# plgn-setup v1: implementation plan (thin)

Spec: `docs/superpowers/specs/2026-10-08-plgn-setup-design.md`, sections 1 to 6. Section 7 is out of scope, except its two notes for the build: `npm pack` stays clean and the README holds a release checklist.
Repo: `F:/G drive/Projects/hbs-projects/plgn-setup` (Git Bash: `"/f/G drive/Projects/hbs-projects/plgn-setup"`), branch `feat/v1`. Builders write the code and the tests from this plan.

## Goal

One command, `npx plgn-setup`, puts plgn's remote MCP server (`https://useplgn.com/api/mcp`, OAuth, no key) into the AI tools a person has: Claude Code, Codex CLI, Cursor, Gemini CLI, Windsurf, VS Code and Claude Desktop.
It backs up before it writes, merges and never replaces, changes nothing on a second run, and prints the one login step for each tool.
`npx plgn-setup doctor` checks every tool and plgn itself (green or red, exit 1 on red). English by default, Arabic with `--lang ar`.

## Rules for every task

- Commit with `git -c user.name=PLGN -c user.email=waslahapp993@gmail.com commit -m "<one line>"`. No Co-Authored-By line, no Claude-Session line. One commit per task. Never push, never `npm publish`.
- Never open or edit a sibling folder under `F:/G drive/Projects/hbs-projects` (plgn, plgn-desk, plgn-claude, the lane folders).
- Every test builds its own temporary home with `tempHome()` (Task 1). No test reads or writes the real home, runs a real tool binary or uses the network.
- Arabic text only with the Write/Edit tools, never through a shell. Western digits only. "points", never "credits". plgn is always lowercase.
- Host facts (config path, file format, entry keys, login step) come from the host's official docs, read on the build day with context7 (`resolve-library-id` then `query-docs`) or WebFetch on the docs page. Line 1 of every host file is `// Source: <url> (checked 2026-10-08)`; more source lines may follow. When the docs differ from this plan, follow the docs and say so in that comment and in the task report.
- While building, run one test file at a time (`node --test test/<file>.test.js`), then `npm test` once before the commit. Plain `node --test` also loads `test/helpers.js` and `test/host-cases.js` (everything under `test/` matches its default pattern); they hold no tests and show as empty passing files, which is expected.

## Decisions

1. Every host function takes a `ctx` (home, platform, env, appData, exec, which, now) and never reads `os.homedir()`, `process.env` or the clock itself. Reason: every path can run on a temporary home and a fake PATH, and one machine can test the Windows, macOS and Linux paths.
2. Safety catch: `makeContext()` without a home, and the real `runFile`, both throw when `process.env.NODE_TEST_CONTEXT` is set (node --test sets it in each test process). Reason: a forgotten argument in a test fails loudly instead of editing the owner's real configs or running his real `claude`.
3. The five file hosts (codex, cursor, gemini, windsurf, vscode) are built by one factory, `makeFileHost`; each host file holds only its checked facts. Reason: one merge, apply and doctor path to review; when a host drifts, one small file changes.
4. `merge` returns `{ text, change }`. When the plgn entry already equals ours it returns the input text unchanged with change "same", and apply then neither backs up nor writes. Reason: running twice is provably a no-op, and no extra backup piles up.
5. An old plgn entry is swapped whole for ours, at the same key position. Reason: "exactly one plgn entry with the right URL" without guessing which old keys still matter; the backup keeps the old entry.
6. TOML is edited as text (append the plgn table, or swap the old plgn table's lines), then re-parsed to prove that only plgn changed; otherwise MergeError "UNSAFE" and nothing is written. Reason: smol-toml's stringify drops comments, and a person's config.toml must keep every other byte.
7. JSON is parsed strictly. A file with comments (VS Code and Gemini allow them) is not touched: it is reported red with the snippet to paste by hand. Reason: re-serialising would delete the comments, and no JSONC library is on the allowed dependency list.
8. A merged JSON file keeps its indent, line ending, BOM and one final newline. Reason: the change looks like a hand edit.
9. Values are compared with `sameValue` (key-sorted JSON). Reason: parsers can return null-prototype objects, and key order must not make "same" fail.
10. Claude Code: the two plugin commands run only when `claude` is on PATH and it is not a dry run; otherwise they are printed. Claude Desktop writes nothing and prints the connector steps, and its doctor row is never red. Reason: spec section 3; the network those two commands use is the claude binary's own, not plgn-setup's; Desktop connectors live in the person's account, not in a local file.
11. Doctor rows have three states: ok, fail, skip. A tool that is not installed, or a binary that does not answer `--version`, is skip. Exit 1 only when a row is fail. Reason: a person who has only Cursor must get a green doctor.
12. Choosing tools: a named tool is set up even when it is not detected; no name in a terminal shows a multiselect with the detected tools pre-checked; `--yes` takes the detected tools; no terminal and no `--yes` exits 2 and writes nothing. Reason: never write without a yes.
13. Backups are `<file>.plgn-backup-YYYYMMDD-HHmmss` in local time, then `-2`, `-3` when taken, copied with `COPYFILE_EXCL`. Writes go to a temp file, then a rename. Reason: spec section 4, and a crash never leaves half a config.
14. Phrases: each task adds its own keys, in both languages, above the `// en: end` and `// ar: end` markers in `src/i18n.js`. Tests enforce twins, Western digits, no "credits" and lowercase plgn. Numbers go through `String()`, never `toLocaleString`. Reason: one table, no English left without Arabic.
15. Windows: `which` honours PATHEXT; a `.cmd`/`.bat` target runs with `shell: true`, its path in double quotes and fixed arguments only. Reason: Node 20 refuses to spawn `.cmd` without a shell, and npm installs `claude`, `codex` and `gemini` as `.cmd` shims.
16. Exit codes: 0 fine, 1 any red line (an error result or a doctor fail), 2 usage error.
17. Colours come from `picocolors.createColors(io.color)`; tests pass `color: false`. Reason: plain text to assert on; NO_COLOR is respected by default.
18. `package.json` gets a `files` list and the README a short owner release checklist. Reason: spec section 7 asks the build to leave `npm pack` clean; publishing itself stays out of scope.

## Interfaces

- `src/constants.js`: `export const MCP_URL = "https://useplgn.com/api/mcp"`
- `src/constants.js`: `export const WELL_KNOWN_URL = "https://useplgn.com/.well-known/oauth-protected-resource"`
- `src/constants.js`: `export const SERVER_NAME = "plgn"`
- `src/constants.js`: `export const MARKETPLACE = "PLGN-App/PLGN-CLAUDE"`
- `src/constants.js`: `export const PLUGIN = "plgn"`
- `src/constants.js`: `export const HOST_IDS = ["claude-code", "codex", "cursor", "gemini", "windsurf", "vscode", "claude-desktop"]`
- `src/context.js`: `export function makeContext({ home, platform, env, exec, now } = {}): Ctx`, where `Ctx = { home, platform, env, appData, exec(name, args, { timeout }?): Promise<{ code, stdout, stderr }>, which(name): string | null, now(): Date }`
- `src/context.js`: `export function which(name: string, { platform, env }): string | null`
- `src/context.js`: `export function runFile(file: string, args: string[], { timeout = 5000 } = {}): Promise<{ code: number, stdout: string, stderr: string }>`
- `src/i18n.js`: `export const LANGS = ["en", "ar"]`
- `src/i18n.js`: `export const phrases = { en: Record<string, string>, ar: Record<string, string> }`
- `src/i18n.js`: `export function t(lang: "en" | "ar", key: string, vars?: Record<string, string | number>): string`
- `src/backup.js`: `export function stamp(date: Date): string` (returns `YYYYMMDD-HHmmss`)
- `src/backup.js`: `export function backupFile(file: string, { now }: { now: Date }): string | null`
- `src/backup.js`: `export function writeConfig(file: string, text: string): void`
- `src/merge.js`: `export class MergeError extends Error` with `constructor(code: "PARSE" | "SHAPE" | "UNSAFE", message: string)` and a `code` field
- `src/merge.js`: `export function mergeJson(text: string | null, { path: string[], name: string, entry: object }): { text: string, change: "added" | "updated" | "same" }`
- `src/merge.js`: `export function mergeToml(text: string | null, { path: string[], name: string, entry: object }): { text: string, change: "added" | "updated" | "same" }`
- `src/merge.js`: `export function readEntry(text: string | null, { format: "json" | "toml", path: string[], name: string }): object | undefined`
- `src/merge.js`: `export function sameValue(a: unknown, b: unknown): boolean`
- `src/hosts/file-host.js`: `export function makeFileHost(spec: { id, label, bin, format: "json" | "toml", configPath(ctx): string, detectPaths(ctx): string[], path: string[], entry: object, nextStep(lang, result?): string }): Host`
- `src/hosts/claude-code.js`, `codex.js`, `cursor.js`, `gemini.js`, `windsurf.js`, `vscode.js`, `claude-desktop.js`: `export default Host`
- Type `Host = { id, label, kind: "file" | "command" | "manual", bin: string | null, detect(ctx): boolean, configPath(ctx): string | null, merge?(text: string | null): { text, change }, snippet(): string, nextStep(lang, result?: Result): string, apply(ctx, { dryRun: boolean }): Promise<Result>, doctor(ctx): Promise<Row[]> }` (merge only on file hosts; it throws MergeError)
- Type `Result = { id, status: "added" | "updated" | "same" | "manual" | "error", dryRun: boolean, file?: string, backup?: string | null, commands?: string[], error?: "PARSE" | "SHAPE" | "UNSAFE" | "EXEC", detail?: string }`
- Type `Row = { id: string, check: "reach" | "found" | "config" | "entry" | "version" | "plugin" | "manual", status: "ok" | "fail" | "skip", key: string, vars?: Record<string, string | number> }`
- `src/hosts/index.js`: `export const hosts: Host[]` (HOST_IDS order)
- `src/hosts/index.js`: `export function getHost(id: string): Host | undefined`
- `src/doctor.js`: `export async function checkReach(fetchFn: typeof fetch): Promise<Row>`
- `src/doctor.js`: `export async function runDoctor(ctx: Ctx, { hosts, fetch }): Promise<{ rows: Row[], ok: boolean }>`
- `src/doctor.js`: `export function renderTable(rows: Row[], { lang, color, labels }: { lang, color: boolean, labels: Record<string, string> }): string`
- `src/cli.js`: `export async function run(argv: string[], io?: { stdout, stderr, isTTY, color, prompt, fetch, ctx }): Promise<number>`, where `prompt(options: { value, label, hint? }[], initialValues: string[], lang): Promise<string[] | null>`
- `bin/plgn-setup.js`: no exports; `#!/usr/bin/env node`, then `process.exitCode = await run(process.argv.slice(2))`
- `test/helpers.js`: `export function tempHome({ platform } = {}): { home, binDir, ctx, put(rel, text), get(rel), exists(rel), addBin(name), files(): string[], cleanup() }`
- `test/helpers.js`: `export function fakeExec(answers = {}): ((name, args, opts) => Promise<{ code, stdout, stderr }>) & { calls: { name, args }[] }` (answers keyed by `"<name> <args joined by space>"`, default `{ code: 0, stdout: "", stderr: "" }`)
- `test/host-cases.js`: `export function mergeCases(host: Host, { others: string, old: string, broken: string }): void` (registers node:test cases)
- `test/host-cases.js`: `export function detectCases(host: Host, { dirs: string[], bin: string | null, platform?: string }): void` (dirs are relative to the home)

## Review Focus

1. No test can reach the real home or run a real binary: `ctx` everywhere, the NODE_TEST_CONTEXT catch in `makeContext` and `runFile`, and the bin test spawns with a hand-built env.
2. "same" returns the exact input text, with no backup and no write; the TOML edit keeps every other byte; PARSE, SHAPE and UNSAFE leave the file untouched, print the snippet and exit 1.
3. A backup is made before every write and never on "same" or a dry run, and an earlier backup is never overwritten.
4. Host facts come from the official docs on the build day, with a `// Source:` line first in each host file, not from the expected values in this plan.
5. Only `src/doctor.js` touches the network (one GET); setup, dry runs and tests never run an install command for real.
6. Every phrase key has an Arabic twin written with Write/Edit, Western digits, "points" never "credits", lowercase plgn.

### Task 1: Package, constants, context and test home

Files:
- Modify: `package.json`
- Create: `package-lock.json` (written by npm), `src/constants.js`, `src/context.js`, `LICENSE`, `test/helpers.js`
- Test: `test/context.test.js`

What changes:
- In `package.json`, directly after the line `"engines": { "node": ">=20" },` add `"files": ["bin", "src", "README.md", "CHANGELOG.md", "LICENSE"],`. Make this edit before installing, because npm rewrites the file's layout.
- Then run once: `npm install @clack/prompts picocolors smol-toml` (latest versions, caret ranges under "dependencies"). Check each package's current API with context7 before a later task uses it.
- `src/constants.js`: the six constants from Interfaces and nothing else. No other src file spells the MCP URL.
- `src/context.js`: makeContext defaults are home `os.homedir()`, platform `process.platform`, env `process.env`, exec built from `which` plus `runFile`, now `() => new Date()`. appData: win32 `env.APPDATA`, else `<home>/AppData/Roaming`; darwin `<home>/Library/Application Support`; other platforms `env.XDG_CONFIG_HOME`, else `<home>/.config`. Safety catch from Decision 2.
- which(): split `env.PATH ?? env.Path` on the real `path.delimiter`; on platform win32 try each `env.PATHEXT` extension (default `.COM;.EXE;.BAT;.CMD`), on other platforms the bare name; return the first existing file or null.
- ctx.exec(name, args, opts) resolves the name with which(); not found gives `{ code: 127, stdout: "", stderr: "not found" }`. runFile never rejects (a spawn error or timeout gives code -1 and the message in stderr), uses `windowsHide: true`, and runs `.cmd`/`.bat` as in Decision 15.
- `LICENSE`: MIT, "Copyright (c) 2026 PLGN".
- `test/helpers.js`: tempHome() makes a folder with `fs.mkdtempSync` under `os.tmpdir()` (prefix `plgn-setup-`) holding a `bin` folder. Its ctx is `makeContext({ home, platform, env: { PATH: binDir, PATHEXT: ".CMD;.EXE", APPDATA: <home>/AppData/Roaming }, exec: fakeExec(), now: () => new Date(2026, 9, 8, 1, 2, 3) })`. addBin writes `<name>.cmd` on win32 and `<name>` elsewhere; files() lists every file under the home; cleanup removes the folder.

Tests (`test/context.test.js`; all fail before because the module does not exist):
- `makeContext keeps the given home, platform and env`
- `makeContext without a home throws under node --test`
- `appData follows the platform` (win32 with and without APPDATA, darwin, linux with and without XDG_CONFIG_HOME)
- `which returns a fake binary on PATH and null when it is missing` (win32 `.cmd`, linux bare name)
- `ctx.exec of a missing binary gives code 127`
- `runFile refuses to run under node --test`

Commit: `chore: package files, dependencies, constants and context`

### Task 2: Phrase table

Files:
- Create: `src/i18n.js`
- Test: `test/i18n.test.js`

What changes:
- `src/i18n.js` exports LANGS, phrases and t. t fills `{name}` placeholders with `String(value)` and throws on an unknown language or key. The table keeps this shape, so that later tasks add their keys above the two end markers:

```js
export const phrases = {
  en: {
    // en: end
  },
  ar: {
    // ar: end
  },
};
```

- Add these keys now. The English text follows each key. Write every Arabic twin with the Write tool, in short plain Arabic; plgn, commands, paths and URLs stay in Latin letters, mostly as {vars}.
`intro` plgn setup: connect your AI tools to plgn. · `help` usage lines for `npx plgn-setup [tool] [--yes] [--dry-run] [--lang en|ar]` and `npx plgn-setup doctor`, then "Tools: {hosts}" · `pick` Which tools should get plgn? · `detected` found on this computer · `noneFound` No AI tools found here. Name one: npx plgn-setup <tool>. Tools: {hosts} · `needYes` This is not an interactive terminal. Add --yes to set up: {hosts} · `nothingChanged` Nothing changed. · `unknownHost` Unknown tool: {name}. Tools: {hosts} · `unknownLang` Unknown language: {lang}. Use en or ar. · `badArgs` {detail}. See npx plgn-setup --help · `added` {label}: plgn added to {file} · `updated` {label}: plgn entry updated in {file} · `same` {label}: already set, nothing changed · `wouldAdd` {label}: would add plgn to {file} · `wouldUpdate` {label}: would update the plgn entry in {file} · `backup` Backup of the old file: {file} · `notReadable` {label}: could not read {file}, so it was left alone. Add this by hand: · `notSafe` {label}: could not add plgn to {file} without touching other lines, so it was left alone. Add this by hand: · `dryRun` Dry run: nothing was written. · `nextTitle` Next, log in once in each tool: · `next.runCommand` {label}: run {cmd} · `next.typeInside` {label}: open it and type {cmd} · `ran` {label}: ran {cmd} · `failed` {label}: {cmd} failed: {detail}

Tests (`test/i18n.test.js`; all fail before because the module does not exist):
- `t fills placeholders and keeps Western digits in Arabic` (t("ar", "failed", { label: "x", cmd: "y", detail: 42 }) holds "42")
- `t throws on an unknown key and an unknown language`
- `every English key has an Arabic twin and the other way round`
- `no phrase holds Arabic-Indic digits` (U+0660 to U+0669, U+06F0 to U+06F9)
- `no phrase says credits` (English /credit/i; Arabic رصيد or كريدت)
- `plgn is always lowercase` (every /plgn/gi match is "plgn")
- `every Arabic phrase holds Arabic letters` when its English twin has words outside the placeholders

Commit: `feat: one phrase table for English and Arabic`

### Task 3: Backups and safe writes

Files:
- Create: `src/backup.js`
- Test: `test/backup.test.js`

What changes:
- stamp(): local time, zero-padded, `YYYYMMDD-HHmmss`.
- backupFile(): returns null when the file is missing. Target `<file>.plgn-backup-<stamp>`, then `-2`, `-3` and so on when taken; copy with `fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL)` and move to the next suffix on EEXIST. Returns the backup path.
- writeConfig(): creates the parent folder (recursive), writes UTF-8 text to `<file>.plgn-tmp-<pid>` beside it, then renames it over the file.

Tests (`test/backup.test.js`; all fail before because the module does not exist):
- `stamp formats local time as YYYYMMDD-HHmmss` (new Date(2026, 9, 8, 1, 2, 3) gives "20261008-010203")
- `backupFile copies the file next to it with the stamp`
- `backupFile never overwrites an earlier backup` (two calls with the same now: the second ends in `-2`, the first is unchanged)
- `backupFile returns null for a missing file`
- `writeConfig creates missing folders and leaves no temp file behind`

Commit: `feat: backups that never overwrite and safe writes`

### Task 4: Merge for JSON and TOML

Files:
- Create: `src/merge.js`
- Test: `test/merge.test.js`

What changes:
- sameValue(): compares `JSON.stringify` of deep key-sorted copies (Decision 9).
- mergeJson(): null or blank text counts as `{}`. Strip a leading BOM before parsing and put it back on output. A JSON.parse failure (this includes files with comments) throws MergeError PARSE. A root, or any object on `path`, that is not a plain object throws SHAPE; missing containers are created. When `container[name]` is sameValue to entry, return the input text unchanged with change "same". Otherwise set `container[name] = entry` (an existing key keeps its position, a new key goes last) and serialise with the file's indent (the leading whitespace of the first indented line, default two spaces), its line ending (CRLF if the input has one) and one final newline. Change "updated" when the key existed, else "added".
- mergeToml(): null or blank counts as "". Parse with smol-toml; a failure throws PARSE; a non-table on `path` throws SHAPE; sameValue gives the input unchanged with "same". The new block is only the `[mcp_servers.plgn]` header and its keys (built from path and name with smol-toml's stringify; drop any empty parent header it emits).
- When a header line for that table exists (spaces inside the brackets allowed, a trailing comment allowed), swap that header and its key lines, up to the next line that starts with `[` or the end, for the new block, keeping the blank lines before the next header. Otherwise append a blank line and the block at the end, adding a final newline first when it is missing. Use CRLF in the block when the file uses CRLF.
- Then verify: re-parse the new text; plgn must be sameValue to entry, and everything else must be sameValue to the original data without plgn. A failed re-parse or a difference throws UNSAFE (an inline `mcp_servers = { … }` table, dotted keys and plgn sub-tables end up here).
- readEntry(): the same parse and SHAPE rules; returns the value at path plus name, or undefined.

Tests (`test/merge.test.js`; all fail before because the module does not exist):
- `mergeJson adds plgn to a missing, empty or blank file`
- `mergeJson keeps other servers and other settings`
- `mergeJson updates an old plgn entry and keeps its key position`
- `mergeJson second merge is same and returns the text unchanged`
- `mergeJson keeps a 4-space indent, CRLF and a BOM`
- `mergeJson throws PARSE on bad JSON and on JSON with comments`
- `mergeJson throws SHAPE when the container is an array or a string`
- `mergeToml appends a table and keeps every other byte, comments included`
- `mergeToml swaps an old plgn table in place`
- `mergeToml second merge is same and returns the text unchanged`
- `mergeToml throws PARSE on bad TOML and UNSAFE on an inline mcp_servers table`
- `readEntry returns the entry or undefined for both formats`
- `sameValue ignores key order and prototypes`

Commit: `feat: JSON and TOML merge that keeps everything else`

### Task 5: File host factory and shared host test cases

Files:
- Create: `src/hosts/file-host.js`, `test/host-cases.js`
- Modify: `src/i18n.js`
- Test: `test/file-host.test.js`

What changes:
- `src/hosts/file-host.js`: makeFileHost(spec) returns a Host with kind "file". detect: any detectPaths entry exists, or bin is set and `ctx.which(bin)` finds it. merge(text): mergeJson or mergeToml with `{ path: spec.path, name: SERVER_NAME, entry: spec.entry }`. snippet(): what a person would paste (JSON: the path objects around `{ plgn: entry }`, two-space indent; TOML: the table block). nextStep: from spec.
- apply(ctx, { dryRun }): read the file (null when missing) and merge. A MergeError gives `{ status: "error", error: code, file }` and nothing is written. "same" gives status "same". A dry run gives status = change, dryRun true, nothing written. Otherwise backupFile (only when the file exists) with `ctx.now()`, then writeConfig; return status, file and backup.
- doctor(ctx): not detected gives one skip row, check "found", key `doctor.notFound`. Otherwise check "config" is ok `doctor.fileFound` or fail `doctor.fileMissing` (vars file). When the file exists, check "entry" is ok `doctor.entryOk` (vars url) when sameValue, fail `doctor.entryMissing`, fail `doctor.entryWrong` (vars url: the old entry's url, httpUrl or serverUrl), or fail `doctor.unreadable` on a MergeError. Check "version" is ok `doctor.version` with the first stdout line of `<bin> --version` (timeout 5000), or skip `doctor.noBinary` when the binary is missing or the call fails.
- In `src/i18n.js`, directly before the line `// en: end` add: `doctor.notFound` not found on this computer · `doctor.fileFound` {file} · `doctor.fileMissing` no config file at {file} · `doctor.entryOk` plgn is set to {url} · `doctor.entryMissing` no plgn entry · `doctor.entryWrong` the plgn entry has an old address: {url} · `doctor.unreadable` could not read {file} · `doctor.version` {version} · `doctor.noBinary` {bin} is not on PATH.
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).
- `test/host-cases.js`: mergeCases registers `<id> merge: empty file`, `<id> merge: keeps other servers`, `<id> merge: updates an old plgn entry` and `<id> merge: unparsable file throws MergeError`. Each result holds the MCP URL exactly once, its readEntry is sameValue to the host's entry, other servers are sameValue to the originals, and a second merge is "same" with identical text. detectCases registers `<id> detect: empty home is false`, `<id> detect: config folder is true` (for each dir) and, when bin is set, `<id> detect: binary on PATH is true`.

Tests (`test/file-host.test.js`; all fail before because the module does not exist), with a demo JSON host (`~/.demo/mcp.json`, path ["mcpServers"], entry { url: MCP_URL }) and a demo TOML host (`~/.demo/config.toml`, path ["mcp_servers"]):
- mergeCases and detectCases for both demo hosts
- `apply adds the entry, backs up the old file and returns the backup path`
- `apply a second time is same, writes nothing and makes no new backup`
- `apply with dryRun writes nothing`
- `apply creates a missing file and its folder with no backup`
- `apply leaves an unreadable file byte for byte alone and reports PARSE`
- `doctor gives one skip row when the host is not found`
- `doctor is red for a missing file, a missing entry and an old URL, green for the right entry`
- `doctor version row is ok with the first line and skip without the binary`
- `every row key is a known phrase`

Commit: `feat: shared file host with apply, doctor and test cases`

### Task 6: Codex CLI host

Files:
- Create: `src/hosts/codex.js`
- Test: `test/hosts-codex.test.js`

What changes:
- Check on the Codex docs (https://learn.chatgpt.com/docs/extend/mcp?surface=cli; the old developers.openai.com/codex/mcp link redirects there): the config file (expected `config.toml` in `$CODEX_HOME`, or `~/.codex` when CODEX_HOME is unset); the table and key for a streamable HTTP server (expected `[mcp_servers.plgn]` with `url`); the login command (expected `codex mcp login plgn`). The planner's look on 2026-10-08 found no feature flag needed and OAuth as the default; plgn uses dynamic client registration, so no `[mcp_servers.plgn.oauth]` sub-table is written (an existing one makes the merge UNSAFE, Decision 6). If the docs now ask for a top-level flag, do not write it in v1: name it in nextStep as a line to add by hand and report it.
- `src/hosts/codex.js`: makeFileHost with id "codex", label "Codex CLI", bin "codex", format "toml", the config path above, detectPaths [the Codex home], path ["mcp_servers"], entry `{ url: MCP_URL }`, nextStep `t(lang, "next.runCommand", { label, cmd })`.

Tests (`test/hosts-codex.test.js`; all fail before because the module does not exist):
- mergeCases(codex, …): others = a comment line, a top-level `model = "x"` and a `[mcp_servers.docs]` table with `command = "npx"`; old = a `[mcp_servers.plgn]` table with `url = "https://old.example/mcp"`; broken = `[mcp_servers`
- detectCases(codex, { dirs: [".codex"], bin: "codex" })
- `codex configPath follows CODEX_HOME`
- `codex merge keeps the comment line byte for byte`
- `codex nextStep names the login command in English and Arabic`

Commit: `feat: Codex CLI host`

### Task 7: Cursor and Windsurf hosts

Files:
- Create: `src/hosts/cursor.js`, `src/hosts/windsurf.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-cursor-windsurf.test.js`

What changes:
- Check on the docs (Cursor MCP docs, for example https://cursor.com/docs/context/mcp; Windsurf MCP docs, for example https://docs.windsurf.com/windsurf/cascade/mcp): the global file on Windows, macOS and Linux (expected `~/.cursor/mcp.json` and `~/.codeium/windsurf/mcp_config.json`), the key for a remote server (expected `mcpServers.plgn.url` for Cursor and `mcpServers.plgn.serverUrl` for Windsurf), and the exact clicks to log in.
- cursor: id "cursor", label "Cursor", bin "cursor", format "json", path ["mcpServers"], entry `{ url: MCP_URL }`, detectPaths [`<home>/.cursor`], nextStep `next.cursor`.
- windsurf: id "windsurf", label "Windsurf", bin "windsurf", format "json", path ["mcpServers"], entry `{ serverUrl: MCP_URL }`, detectPaths [`<home>/.codeium/windsurf`], nextStep `next.windsurf`.
- In `src/i18n.js`, directly before the line `// en: end` add `next.cursor` (the clicks from the docs, for example "Cursor: open Settings, then MCP, and press Log in next to plgn") and `next.windsurf` (the same for Windsurf).
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/hosts-cursor-windsurf.test.js`; all fail before because the modules do not exist):
- mergeCases for both: others = another server plus a non-MCP top-level key; old = plgn with `https://old.example/mcp`; broken = `{ "mcpServers": `
- detectCases(cursor, { dirs: [".cursor"], bin: "cursor" }) and detectCases(windsurf, { dirs: [".codeium/windsurf"], bin: "windsurf" })
- `cursor and windsurf configPath sit under the home on every platform`
- `cursor and windsurf nextStep have English and Arabic text`

Commit: `feat: Cursor and Windsurf hosts`

### Task 8: Gemini CLI and VS Code hosts

Files:
- Create: `src/hosts/gemini.js`, `src/hosts/vscode.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-gemini-vscode.test.js`

What changes:
- Check on the docs (Gemini CLI MCP docs, for example https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md; VS Code MCP docs, for example https://code.visualstudio.com/docs/copilot/customization/mcp-servers): Gemini's user settings file (expected `~/.gemini/settings.json`, and whether an env var moves it), the remote server keys with OAuth on (expected `{ httpUrl, oauth: { enabled: true } }`), the login (expected `/mcp auth plgn` inside gemini); VS Code's user-level `mcp.json` per platform (expected `<appData>/Code/User/mcp.json`), the entry (expected `servers.plgn = { type: "http", url }`), and how a person starts it and signs in.
- gemini: id "gemini", label "Gemini CLI", bin "gemini", format "json", path ["mcpServers"], entry `{ httpUrl: MCP_URL, oauth: { enabled: true } }` (as the docs say on the day), detectPaths [`<home>/.gemini`], nextStep `next.typeInside` with cmd `/mcp auth plgn`.
- vscode: id "vscode", label "VS Code", bin "code", format "json", path ["servers"], entry `{ type: "http", url: MCP_URL }`, configPath `<ctx.appData>/Code/User/mcp.json`, detectPaths [`<ctx.appData>/Code/User`]; stable VS Code only in v1 (no Insiders, no profiles); nextStep `next.vscode`.
- Both files may hold comments; such files stay untouched and are reported (Decision 7).
- In `src/i18n.js`, directly before the line `// en: end` add `next.vscode` (the steps from the docs, for example "VS Code: open the Command Palette, run MCP: List Servers, pick plgn, press Start and allow the sign-in").
- In `src/i18n.js`, directly before the line `// ar: end` add its Arabic twin (Write/Edit tool only).

Tests (`test/hosts-gemini-vscode.test.js`; all fail before because the modules do not exist):
- mergeCases for both: gemini others = `{ "theme": "Default", "mcpServers": { "docs": { "command": "npx" } } }`; vscode others = `{ "servers": { "docs": { "type": "stdio", "command": "npx" } }, "inputs": [] }`; old and broken as in Task 7
- detectCases(gemini, { dirs: [".gemini"], bin: "gemini" }) and detectCases(vscode, { dirs: ["AppData/Roaming/Code/User"], bin: "code", platform: "win32" })
- `vscode configPath follows the platform` (win32 APPDATA, darwin Library/Application Support, linux XDG_CONFIG_HOME or .config)
- `gemini settings with comments are left alone` (apply gives error PARSE, the file is byte-identical)
- `gemini and vscode nextStep have English and Arabic text`

Commit: `feat: Gemini CLI and VS Code hosts`

### Task 9: Claude Code and Claude Desktop hosts

Files:
- Create: `src/hosts/claude-code.js`, `src/hosts/claude-desktop.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-claude.test.js`

What changes:
- Check on the docs (Claude Code plugins, plugin marketplaces and CLI reference pages, for example https://code.claude.com/docs/en/plugins; the Claude custom connectors help article, for example https://support.claude.com/en/articles/11175166): the two commands (expected `claude plugin marketplace add PLGN-App/PLGN-CLAUDE` and `claude plugin install plgn`; the install may need `plgn@<marketplace name>`, so read that name from the public repo's `.claude-plugin/marketplace.json` with WebFetch, never from the local plgn-claude folder); how to tell that plgn is already installed (a documented listing command if there is one, else `~/.claude/plugins/installed_plugins.json` holding a key that starts with `plgn@`); how to log in after the install; the connector clicks in Claude Desktop.
- claude-code: kind "command", bin "claude", detect = `<home>/.claude` exists or claude is on PATH, configPath null (or the installed-plugins file when that is the check). apply: no claude on PATH gives status "manual" with commands [both lines]; already installed gives "same" and runs nothing; a dry run gives "added", dryRun true, the commands listed and nothing run; otherwise run the marketplace add (its failure is ignored when the install then works), then the install; a failed install gives status "error", error "EXEC", detail = the first stderr line. snippet(): both lines. nextStep(lang, result): manual gives `next.claudeCodeManual` followed by the two lines, else `next.claudeCode`. doctor: not detected gives skip `doctor.notFound`; no claude gives skip `doctor.noBinary`; else a version row and check "plugin", ok `doctor.pluginOk` or fail `doctor.pluginMissing`.
- claude-desktop: kind "manual", bin null, configPath null; detect = `<appData>/Claude` exists on win32 and darwin, never on linux (if the docs name another Windows folder, for example the Microsoft Store build's, add it to detect and its Source line). apply gives status "manual" and touches nothing. snippet(): MCP_URL. nextStep: `next.claudeDesktop` with {url}. doctor: skip `doctor.notFound`, or one skip row with check "manual" and key `doctor.checkByHand` (never red).
- In `src/i18n.js`, directly before the line `// en: end` add `next.claudeCode` (the login step from the docs), `next.claudeCodeManual` Claude Code is not on PATH here. Run these two lines: · `next.claudeDesktop` Claude Desktop: open Settings, Connectors, Add custom connector, name it plgn and paste {url} · `doctor.pluginOk` plgn plugin installed · `doctor.pluginMissing` plgn plugin not installed · `doctor.checkByHand` check Settings, Connectors by hand.
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/hosts-claude.test.js`; all fail before because the modules do not exist; every test uses fakeExec):
- `claude-code runs marketplace add then install when claude is on PATH`
- `claude-code is same and runs nothing when plgn is already installed`
- `claude-code dry run runs nothing and lists both commands`
- `claude-code without claude on PATH is manual with both lines in nextStep`
- `claude-code reports EXEC when the install fails`
- detectCases(claudeCode, { dirs: [".claude"], bin: "claude" })
- `claude-code doctor plugin row is red when missing and green when installed`
- `claude-desktop apply is manual and writes no file` (files() of the temp home is unchanged)
- `claude-desktop detect follows the platform and is never true on linux`
- `claude-desktop doctor never gives a red row`

Commit: `feat: Claude Code and Claude Desktop hosts`

### Task 10: Doctor

Files:
- Create: `src/doctor.js`
- Modify: `src/i18n.js`
- Test: `test/doctor.test.js`

What changes:
- checkReach(fetchFn): one GET of WELL_KNOWN_URL with `signal: AbortSignal.timeout(10000)`. An ok row (id "plgn", check "reach", key `doctor.reachOk`, vars url) when `res.ok`; else fail `doctor.reachFail` with the status code or the error message as detail.
- runDoctor(): checkReach first, then each host's doctor(ctx) in order; a host doctor that throws becomes one fail row `doctor.unreadable`. ok is true when no row is fail. This file is the only place in src that calls fetch.
- renderTable(): one line per row: the tool label (labels[id], "plgn" for the reach row), the check name (`check.<check>`), a mark (ok ✔ green, fail ✘ red, skip – dim, through `picocolors.createColors(color)`) and the detail `t(lang, key, vars)`. Pad the columns by visible width. Last, one summary line: `doctor.summaryOk`, or `doctor.summaryFail` with {count} = the number of fail rows.
- In `src/i18n.js`, directly before the line `// en: end` add: `doctor.title` plgn doctor · `doctor.reachOk` {url} answers · `doctor.reachFail` could not reach {url}: {detail} · `doctor.summaryOk` All good. · `doctor.summaryFail` {count} problem(s). Run npx plgn-setup to fix them. · `check.reach` reachable · `check.found` tool · `check.config` config file · `check.entry` plgn entry · `check.version` version · `check.plugin` plugin · `check.manual` connector.
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/doctor.test.js`; all fail before because the module does not exist):
- `checkReach calls the well-known URL once and is ok on 200`
- `checkReach is red on 500 and on a network error`
- `runDoctor is ok when plgn answers and every detected host is set` (temp home, the real cursor host after its apply)
- `runDoctor is not ok when a detected host has no plgn entry`
- `hosts that are not found give skip rows and keep ok true`
- `renderTable with color off has no escape codes and one line per row plus the summary`
- `renderTable in Arabic shows the fail count in Western digits`

Commit: `feat: doctor with one public check and a red or green table`

### Task 11: CLI, host list and bin

Files:
- Create: `src/hosts/index.js`, `src/cli.js`, `bin/plgn-setup.js`
- Test: `test/cli.test.js`

What changes:
- `src/hosts/index.js`: imports the seven hosts; `hosts` in HOST_IDS order; getHost by id.
- `bin/plgn-setup.js`: the shebang, then run as in Interfaces. After `git add`, mark it executable in git with `git update-index --chmod=+x bin/plgn-setup.js` (Windows has no file mode bit).
- run(argv, io): io defaults are the process streams, isTTY `process.stdin.isTTY && process.stdout.isTTY`, color `picocolors.isColorSupported`, prompt = @clack/prompts multiselect (message `pick`, each option's hint `detected` when detected, initialValues, required false; a cancel gives null), fetch `globalThis.fetch`, ctx `makeContext()`. Parse with `node:util` parseArgs in strict mode: yes/-y, dry-run, lang, help/-h, version/-v, at most one positional. A bad flag or an extra positional prints `badArgs` and exits 2; a lang other than en/ar prints `unknownLang` and exits 2; --help prints `help` and exits 0; --version prints the version from `../package.json` and exits 0.
- `doctor`: runDoctor with io.fetch, print `doctor.title` and renderTable; exit 0 or 1.
- Setup: a named host is used even when not detected; an unknown name prints `unknownHost` and exits 2. With no name: detected = hosts whose detect(ctx) is true; `--yes` takes them; no `--yes` and no TTY prints `needYes` and exits 2; else the prompt (null or empty prints `nothingChanged`, exit 0). Nothing to do prints `noneFound`, exit 0.
- For each chosen host, apply(ctx, { dryRun }). Print `added`, `updated` or `same` (`wouldAdd` or `wouldUpdate` on a dry run, followed by the snippet); `backup` when a backup was made; `notReadable` (PARSE, SHAPE) or `notSafe` (UNSAFE) followed by the snippet; `failed` for EXEC. Then `nextTitle` and nextStep(lang, result) for every host without an error, and the `dryRun` line last on a dry run. Exit 1 when any result is "error", else 0. Setup never calls io.fetch.
- If a message is missing: in `src/i18n.js`, directly before the line `// en: end` add it.
- In `src/i18n.js`, directly before the line `// ar: end` add its Arabic twin (Write/Edit tool only).

Tests (`test/cli.test.js`; all fail before because the module does not exist), each with a tempHome ctx, color false, a fetch that records its calls, and fakeExec:
- `--dry-run --yes prints the plan and leaves every file untouched` (same bytes, no backup files, no install command run, fetch not called)
- `--yes sets up detected hosts, and a second run says already set and writes nothing`
- `a named host is set up even when it is not detected`
- `unknown host, unknown flag and --lang xx exit 2`
- `no TTY without --yes exits 2 and writes nothing`
- `the prompt gets detected hosts pre-checked and only picked hosts are written`
- `a cancelled prompt says nothing changed and exits 0`
- `an unreadable config exits 1, stays byte for byte, and the snippet is printed`
- `doctor exits 0 when green and 1 when red`
- `--lang ar prints Arabic letters and no Arabic-Indic digits`
- `hosts follow HOST_IDS order`
- `bin --version prints 0.1.0` (spawn `process.execPath` with an env holding only HOME, USERPROFILE, APPDATA, XDG_CONFIG_HOME and CODEX_HOME set inside a temp home, PATH = an empty temp folder, plus SystemRoot on Windows)

Commit: `feat: the plgn-setup command`

### Task 12: README, CHANGELOG and rule checks

Files:
- Create: `README.md`, `CHANGELOG.md`
- Test: `test/rules.test.js`

What changes:
- README (plain English, lowercase plgn): one line on what it does; `npx plgn-setup`, then one line per tool (`npx plgn-setup claude-code` through `npx plgn-setup claude-desktop`) with its login step; `npx plgn-setup doctor`; `--yes`, `--dry-run`, `--lang ar`; the backup rule (`<file>.plgn-backup-YYYYMMDD-HHmmss`, never overwritten, how to restore); what it never does (ask for or store a key, token or password; send anything except doctor's one public GET; telemetry; drop other servers or settings). A short "Release (owner)" checklist: `npm test`; `npm pack --dry-run` lists only bin, src, README, CHANGELOG, LICENSE and package.json; then the owner publishes to npm and creates the GitHub repo PLGN-App/plgn-setup on his word.
- CHANGELOG: a `0.1.0 - 2026-10-08` section with the seven tools, doctor and Arabic.

Tests (`test/rules.test.js`):
- `only src/doctor.js calls fetch` (no other src file holds a `fetch…(` call)
- `the MCP URL is spelled only in src/constants.js`
- `no src file holds Authorization, Bearer, apiKey, api_key or password` (src/i18n.js included, so no phrase may say them; the README may)
- `every host file starts with a // Source: https line` (every file in src/hosts except file-host.js and index.js)
- `README names every host id, doctor and --lang ar` (fails before: there is no README)
- `package files list is exactly bin, src, README.md, CHANGELOG.md, LICENSE`
The README test fails before because there is no README; the other five are guards that pass when the earlier tasks kept the rules, and a red one means an earlier task broke a rule (fix that code, not the test).

Commit: `docs: README, CHANGELOG and rule checks`

### Task 13: Live check on the owner's machine (needs the owner's go)

Files:
- none (a fix, if one is needed, gets its own test and commit)

What changes, each step only after his go:
1. `npm test` is all green; `npm pack --dry-run` lists only the `files` entries plus package.json.
2. `node bin/plgn-setup.js doctor`: the plgn row is green. This is the one live GET. If the well-known URL at the site root does not answer 200 (the server may serve it only under `/.well-known/oauth-protected-resource/api/mcp`), report it; the URL choice goes back to him.
3. `node bin/plgn-setup.js --dry-run --yes` on his real home: the tools it finds and the lines it would add; nothing is written.
4. One real tool he names (for example `node bin/plgn-setup.js codex`): the backup line is printed, the login step works in that tool, a plgn tool call answers, and doctor shows that tool green. A second run says already set.
5. `node bin/plgn-setup.js --lang ar --dry-run --yes` reads well to him in Arabic.

Commit: none (proof only).
