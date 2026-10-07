# plgn-setup v1, part 2: implementation plan (thin)

Spec: `docs/superpowers/specs/2026-10-08-plgn-setup-design.md`. Part 1 plan: `docs/superpowers/plans/2026-10-08-plgn-setup-v1.md` (its Tasks 1-5 are built and committed on `feat/v1`, 68 tests).
Repo: `F:/G drive/Projects/hbs-projects/plgn-setup` (Git Bash: `"/f/G drive/Projects/hbs-projects/plgn-setup"`), branch `feat/v1`. Builders write the code and the tests from this plan.
Task map: part 1 Task 6 = Task 4 here, 7 = 5, 8 = 6, 9 = 7 + 8, 10 = 9, 11 = 10, 12 = 11, 13 = 12. Tasks 1-3 close reviewer notes A-F; Task 10 closes G.

## Goal

Finish plgn-setup v1: the seven tool hosts, `npx plgn-setup doctor`, the `npx plgn-setup` command with its bin, and the README, on top of the core from part 1.
Close the seven reviewer notes A-G in `docs/notes/2026-10-08-plgn-setup-follow-ups.md` as tasks, ticking each box in the commit that closes it.
Same rules as part 1: back up first, merge never replace, a second run writes nothing, no network but doctor's one GET, no token, key or password ever, English and Arabic from one table.

## Rules for every task

- Commit with `git commit -m "<one line>"`: the repo's local git config already holds user.name PLGN and the PLGN email (checked). No Co-Authored-By line, no Claude-Session line. One commit per task. Never push, never `npm publish`.
- Never open or edit a sibling folder under `F:/G drive/Projects/hbs-projects` (plgn-claude included). The Claude Code facts come from the public GitHub repo with WebFetch.
- Every test builds its own home with `tempHome()`. No test reads or writes the real home, runs a real tool binary or uses the network.
- Arabic text only with the Write/Edit tools, never through a shell. Western digits only, "points" never "credits", plgn always lowercase. Commands, paths, URLs and `PLGN-App/...` reach a phrase only through `{vars}` (the lowercase-plgn test would fail on them).
- Host facts (config path, format, entry keys, login step) come from the host's official docs read on the build day with context7 (`resolve-library-id`, then `query-docs`) or WebFetch. Line 1 of every host file is `// Source: <url> (checked <YYYY-MM-DD>)`; more source lines may follow. Where the docs differ from this plan, follow the docs and say so in that comment and in the task report.
- While building, run one test file at a time (`node --test test/<file>.test.js`), then `npm test` once before the commit.

## Decisions

1. Part 1's Decisions 1-18 and Interfaces stay in force; this plan adds to them and changes no signature. Reason: Tasks 1-5 and their 68 tests stand on them.
2. The reviewer notes are built first (Tasks 1-3). Reason: every host stands on file-host, merge and context, so the host tests then run on the fixed code.
3. Note A: a found plgn entry whose address equals ours but which differs in another key is a fail row with key `doctor.entryDiffers`. Setup still swaps the whole entry (part 1 Decision 5). Reason: the person sees why the row is red, and the backup keeps the old keys.
4. Note D: file-host `apply` wraps read, merge, backup and write in one try. A MergeError gives its code as now; any other error with a string `code` gives `{ status: "error", error: "IO", detail: e.message }`; an error without a code still throws. File-host `doctor` turns a read error other than ENOENT into a fail config row `doctor.unreadable`. The CLI also wraps each host's apply, and runDoctor each host's doctor. Reason: one locked or odd file never stops the other tools, while a programming bug stays loud in tests.
5. Note B: mergeToml sets a leading `\uFEFF` aside, works on the text after it and puts it back in front; the header regex's leading space class becomes `[ \t]*`; no src file holds a literal U+FEFF character (it is spelled `\uFEFF`). Reason: `[ \t]*` alone would make a BOM-first plgn table look missing, append a second plgn table and fail as UNSAFE.
6. Note C: mergeJson throws UNSAFE when any number in the file would be written differently (`String(Number(token)) !== token`, for example `1.0`, `1e5`, integers past 2^53); numbers inside strings are skipped; changed string escapes keep their values and are accepted. The README says so. Reason: refusing is safe (the CLI prints the snippet to paste), rewriting a big integer changes its value.
7. Notes E and F as the follow-ups file says (feminine verbs, the new `pick` wording; the execute bit outside Windows, `||` for APPDATA). The test helper's fake binaries are written with mode 0o755. Reason: otherwise the fake binaries stop counting on Linux and macOS.
8. Claude Code facts, read by the planner on 2026-10-08 (the builder reads them again on the build day): the public `.claude-plugin/marketplace.json` of PLGN-App/PLGN-CLAUDE names the marketplace "plgn" and the plugin "plgn", so the install is `claude plugin install plgn@plgn` (new constant PLUGIN_ID). `claude plugin list --json` prints an array of `{ id, enabled, ... }` with id `name@marketplace` (https://code.claude.com/docs/en/plugins/cli-reference). Reason: the owner named marketplace.json as the source; a documented list command beats reading Claude Code's internal files.
9. plgn counts as installed when a list entry's id starts with `plgn@` (any marketplace). Doctor: enabled gives ok, `enabled: false` gives fail `doctor.pluginOff`, no entry gives fail `doctor.pluginMissing`, a failed list or output that is not JSON gives skip `doctor.pluginUnknown`. Reason: a second install from another marketplace would only duplicate the tools; an old or broken claude must not turn doctor red (part 1 Decision 11).
10. Claude Code apply: a dry run may run the read-only `claude plugin list --json` but never add or install. Timeouts: 15000 ms for list, 120000 ms for add and install, 5000 ms for `--version`. Do not pass `-y` (older versions reject it, and plgn's marketplace entry runs no install command). Reason: a dry run then says "already set" truthfully; add clones a git repo.
11. runDoctor turns a host doctor that throws into one fail row with key `doctor.error` and vars `{ detail }`. Reason: part 1 named `doctor.unreadable`, which needs a file that command hosts do not have.
12. CLI lines for command and manual hosts: after a real run, `ran` for each command; on a dry run, `wouldRun` for each command; a manual result prints only its next step; an IO error prints `ioError`. Reason: every result gets exactly one kind of line, in both languages.
13. WELL_KNOWN_URL stays: the planner's one GET on 2026-10-08 got 200 with a protected-resource JSON (`resource` https://useplgn.com). Reason: part 1 left this open for the live check.
14. A task that closes a reviewer note ticks its box (`- [ ]` to `- [x]`) in the follow-ups file in the same commit. Reason: the list stays the truth.
15. Claude Code and Claude Desktop are two tasks (part 1 had one). Reason: each stays under about 40 plan lines and one review.

## Interfaces

- Unchanged from part 1 (same files, same signatures): MCP_URL, WELL_KNOWN_URL, SERVER_NAME, MARKETPLACE, PLUGIN, HOST_IDS; makeContext, which, runFile; LANGS, phrases, t; stamp, backupFile, writeConfig; MergeError, mergeJson, mergeToml, readEntry, sameValue; makeFileHost; tempHome, fakeExec; mergeCases, detectCases.
- `src/constants.js`: `export const PLUGIN_ID = "plgn@plgn"` (new, Task 7)
- Type `Result = { id, status: "added" | "updated" | "same" | "manual" | "error", dryRun: boolean, file?: string, backup?: string | null, commands?: string[], error?: "PARSE" | "SHAPE" | "UNSAFE" | "EXEC" | "IO", detail?: string }` ("IO" is new)
- Type `Row = { id: string, check: "reach" | "found" | "config" | "entry" | "version" | "plugin" | "manual", status: "ok" | "fail" | "skip", key: string, vars?: Record<string, string | number> }`
- Type `Host = { id, label, kind: "file" | "command" | "manual", bin: string | null, detect(ctx): boolean, configPath(ctx): string | null, merge?(text: string | null): { text, change }, snippet(): string, nextStep(lang, result?: Result): string, apply(ctx, { dryRun: boolean }): Promise<Result>, doctor(ctx): Promise<Row[]> }`
- `src/hosts/codex.js`, `src/hosts/cursor.js`, `src/hosts/windsurf.js`, `src/hosts/gemini.js`, `src/hosts/vscode.js`: `export default Host` (kind "file", from makeFileHost)
- `src/hosts/claude-code.js`: `export default Host` (kind "command", bin "claude", configPath returns null, no merge)
- `src/hosts/claude-desktop.js`: `export default Host` (kind "manual", bin null, configPath returns null, no merge)
- `src/hosts/index.js`: `export const hosts: Host[]` (HOST_IDS order)
- `src/hosts/index.js`: `export function getHost(id: string): Host | undefined`
- `src/doctor.js`: `export async function checkReach(fetchFn: typeof fetch): Promise<Row>`
- `src/doctor.js`: `export async function runDoctor(ctx: Ctx, { hosts, fetch }: { hosts: Host[], fetch: typeof fetch }): Promise<{ rows: Row[], ok: boolean }>`
- `src/doctor.js`: `export function renderTable(rows: Row[], { lang, color, labels }: { lang: "en" | "ar", color: boolean, labels: Record<string, string> }): string`
- `src/cli.js`: `export async function run(argv: string[], io?: { stdout: { write(s: string): void }, stderr: { write(s: string): void }, isTTY: boolean, color: boolean, prompt, fetch: typeof fetch, ctx: Ctx }): Promise<number>`
- `src/cli.js` io.prompt: `(options: { value: string, label: string, hint?: string }[], initialValues: string[], lang: "en" | "ar") => Promise<string[] | null>`
- `bin/plgn-setup.js`: no exports; `#!/usr/bin/env node`, then `process.exitCode = await run(process.argv.slice(2))`

## Review Focus

1. Host facts come from the official docs read on the build day, and line 1 of each host file is `// Source: <url> (checked <date>)`, not the expected values in this plan.
2. No test reaches the real home or runs a real binary: host and CLI tests use tempHome and fakeExec; the two bin tests spawn node with a hand-built env (no NODE_TEST_CONTEXT, an empty PATH, every home variable inside a temp folder).
3. Claude Code: a dry run and doctor never run add or install; the install argument is `plgn@plgn`; a failed or old `claude plugin list` never makes doctor red.
4. IO errors become results and never stop the other hosts; an error without a code still throws.
5. mergeToml keeps the BOM and every other byte; the JSON number check skips numbers inside strings.
6. Every new phrase key has an Arabic twin written with Write/Edit; no command, path or `PLGN-App` text sits inside a phrase.

### Task 1: Reviewer notes A and D: a changed entry and file errors in the file host

Files:
- Modify: `src/hosts/file-host.js`, `src/i18n.js`, `docs/notes/2026-10-08-plgn-setup-follow-ups.md`
- Test: `test/file-host.test.js`

What changes:
- Doctor names an entry that has our address but differs in another key (Decision 3).
- apply turns I/O errors into results; doctor turns a read error into a red config row (Decision 4). The version row still follows that red row.

Anchors:
- In `src/hosts/file-host.js`, replace

```js
      let merged;
      try {
        merged = merge(readText(file));
      } catch (e) {
        if (e instanceof MergeError) return { id, status: "error", dryRun, error: e.code, detail: e.message, file };
        throw e;
      }
      if (merged.change === "same") return { id, status: "same", dryRun, file };
      if (dryRun) return { id, status: merged.change, dryRun, file };
      // backupFile returns null when there is no file yet.
      const backup = backupFile(file, { now: ctx.now() });
      writeConfig(file, merged.text);
      return { id, status: merged.change, dryRun, file, backup };
```

with the same steps inside one try: the catch checks `instanceof MergeError` first (its code is a string too), then a string `e.code` gives `{ id, status: "error", dryRun, error: "IO", detail: e.message, file }`, else rethrows.
- In `src/hosts/file-host.js`, replace the line `const text = readText(file);` with a read in its own try: an error pushes `{ id, check: "config", status: "fail", key: "doctor.unreadable", vars: { file } }`, skips the entry row and goes on to the version row.
- In `src/hosts/file-host.js`, replace

```js
          } else {
            rows.push({ id, check: "entry", status: "fail", key: "doctor.entryWrong", vars: { url: oldUrl(found) } });
          }
```

with an `else if (oldUrl(found) === oldUrl(entry))` branch that pushes the fail row with key `doctor.entryDiffers` (no vars), followed by the same final `else` as now.
- In `src/i18n.js`, directly before the line `// en: end` add `"doctor.entryDiffers": "the plgn entry has the right address but other settings differ",`.
- In `src/i18n.js`, directly before the line `// ar: end` add its Arabic twin (Write/Edit tool only).
- In `docs/notes/2026-10-08-plgn-setup-follow-ups.md`, replace `- [ ] A.` with `- [x] A.` and replace `- [ ] D.` with `- [x] D.`.

Tests (`test/file-host.test.js`, inside the existing per-host loop so both demo hosts run; give each case a `differs` text: plgn with our url plus `disabled: true` in JSON, `disabled = true` in TOML):
- `<id>: doctor says entryDiffers when the address is right but another key differs` (entry row fail, key `doctor.entryDiffers`). Fails before: the key is `doctor.entryWrong`.
- `<id>: apply returns an IO error and does not throw when the config path is a folder` (put `<rel>/x`; status "error", error "IO", detail not empty, no other file appears). Fails before: apply rejects with EISDIR.
- `<id>: doctor gives a red unreadable config row when the config path is a folder` (config row fail, key `doctor.unreadable`, no entry row). Fails before: doctor rejects with EISDIR.
- The existing `<id>: every row key is a known phrase` also loops over `c.differs`.

Commit: `fix: doctor names a changed plgn entry, file errors become results`

### Task 2: Reviewer notes B and C: TOML keeps its BOM, JSON refuses to rewrite numbers

Files:
- Modify: `src/merge.js`, `docs/notes/2026-10-08-plgn-setup-follow-ups.md`
- Test: `test/merge.test.js`

What changes:
- BOM (Decision 5): when the TOML text is not blank and starts with `\uFEFF`, it is kept aside as `bom`; parse, line split, swap or append and the verify all run on the text after it; the result text is `bom + next`. The "same" path still returns the input text unchanged.
- Numbers (Decision 6): before mergeJson serialises, it scans the BOM-less body with one global regex that matches a JSON string or a number, `/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g`. For each number match, `String(Number(m)) !== m` throws `MergeError("UNSAFE", "A number in the file would be rewritten (<m>); nothing was written.")`.

Anchors:
- In `src/merge.js`, change the line `const BOM =` so its string is the escape `"\uFEFF"`, not the invisible literal character.
- In `src/merge.js`, change the line `const body = (text ?? "").replace(/^` (it appears twice, in parseJson and in mergeJson) so both regexes read `/^\uFEFF/`.
- In `src/merge.js`, replace the line `const original = blank(text) ? "" : text;` with the `bom` split above (`original` becomes the text after the BOM).
- In `src/merge.js`, replace

```js
  const headerRe = new RegExp(
    "^\\s*\\[\\s*" + [...path, name].map(escapeRe).join("\\s*\\.\\s*") + "\\s*\\]\\s*(#.*)?\\r?\\n?$"
  );
```

with the same three lines, the first string now starting `"^[ \\t]*\\[\\s*"`.
- In `src/merge.js`, replace the line `return { text: next, change: at >= 0 ? "updated" : "added" };` with the same return of `bom + next`.
- In `src/merge.js`, directly before the line `const existed = Object.hasOwn(container, name);` add the number check.
- In `docs/notes/2026-10-08-plgn-setup-follow-ups.md`, replace `- [ ] B.` with `- [x] B.` and replace `- [ ] C.` with `- [x] C.`.

Tests (`test/merge.test.js`):
- `mergeToml keeps a BOM when it swaps a plgn table on the first line` (input `"\uFEFF[mcp_servers.plgn]\nurl = \"https://old.example/mcp\"\n"`: change "updated", text starts with `\uFEFF[mcp_servers.plgn]`, holds the MCP URL once, a second merge is "same" with the same text). Fails before: the swap drops the BOM.
- `mergeToml keeps a BOM when it appends` (a guard; passes before).
- `mergeJson throws UNSAFE when a number would be rewritten` (`{"a": 1.0}`, `{"a": 1e5}` and `{"a": 12345678901234567890}` throw UNSAFE; `{"a": 1.5, "b": -3, "c": "1.0", "d": 0}` merges as "added"). Fails before: all four merge.
- `merge.js spells the BOM as an escape` (reads the source through `new URL("../src/merge.js", import.meta.url)`; no U+FEFF character in it). Fails before: three literal characters.

Commit: `fix: TOML keeps a BOM, JSON refuses to rewrite numbers`

### Task 3: Reviewer notes E and F: Arabic wording, which() and APPDATA

Files:
- Modify: `src/i18n.js`, `src/context.js`, `test/helpers.js`, `docs/notes/2026-10-08-plgn-setup-follow-ups.md`
- Test: `test/i18n.test.js`, `test/context.test.js`

What changes:
- Three Arabic phrases get the wording from note E (Write/Edit tool only).
- which(): on win32 as now; on every other platform a file counts only when `fs.accessSync(full, fs.constants.X_OK)` does not throw (a new `isExecutable(full, platform)` helper next to isFile).
- appData on win32 falls back when APPDATA is empty, like XDG_CONFIG_HOME already does.
- tempHome's addBin writes its fake binary with mode 0o755 (Decision 7).

Anchors:
- In `src/i18n.js`, replace the line `pick: "أي أدوات تريد أن تحصل على plgn؟",` with `pick: "أي أدوات تريد ربطها بـ plgn؟",`.
- In `src/i18n.js`, replace the line `wouldAdd: "{label}: سيتم إضافة plgn إلى {file}",` with the same line using ستتم in place of سيتم.
- In `src/i18n.js`, replace the line `dryRun: "تجربة فقط: لم يتم كتابة أي شيء.",` with the same line using لم تتم in place of لم يتم.
- In `src/context.js`, replace the line `if (isFile(full)) return full;` with the same return guarded by `isExecutable(full, platform)`.
- In `src/context.js`, replace the line `if (platform === "win32") appData = env.APPDATA ?? path.join(home, "AppData", "Roaming");` with the same line using `||` in place of `??`.
- In `test/helpers.js`, replace the line `fs.writeFileSync(file, platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n");` with the same write plus a third argument `{ mode: 0o755 }` (the anchor script reports this one as OK* in test/helpers.js, which is this file).
- In `docs/notes/2026-10-08-plgn-setup-follow-ups.md`, replace `- [ ] E.` with `- [x] E.` and replace `- [ ] F.` with `- [x] F.`.

Tests:
- `test/i18n.test.js`: `Arabic uses the feminine verb before feminine nouns` (no Arabic phrase matches `/(سيتم|يتم) (إضافة|كتابة)/`, and `phrases.ar.pick` holds ربطها). Fails before: wouldAdd and dryRun match. Write the Arabic with Write/Edit.
- `test/context.test.js`: `appData falls back when APPDATA is empty` (win32 with `{ APPDATA: "" }` gives `<home>/AppData/Roaming`). Fails before: `??` keeps the empty string.
- `test/context.test.js`: `which skips a file without the execute bit outside Windows`, with `{ skip: process.platform === "win32" }` (a mode 0o644 `codex` in binDir gives null for platform linux; after chmod 0o755 it is found). Fails before on Linux and macOS; it is skipped on the owner's Windows machine, which has no execute bit.

Commit: `fix: Arabic wording, which() needs the execute bit, empty APPDATA falls back`

### Task 4: Codex CLI host

Files:
- Create: `src/hosts/codex.js`
- Test: `test/hosts-codex.test.js`

What changes:
- Read the Codex docs (https://learn.chatgpt.com/docs/extend/mcp?surface=cli). Planner expectation: `config.toml` in `$CODEX_HOME`, or `~/.codex` when CODEX_HOME is unset or empty; a `[mcp_servers.plgn]` table with `url`; login `codex mcp login plgn`; OAuth with dynamic client registration by default, so no feature flag and no `[mcp_servers.plgn.oauth]` sub-table. If the docs now ask for a top-level flag, do not write it in v1: put it in nextStep as a line to add by hand and report it.
- `src/hosts/codex.js`: the Source line, then makeFileHost with id "codex", label "Codex CLI", bin "codex", format "toml", configPath `<codexHome>/config.toml` where codexHome is `ctx.env.CODEX_HOME || <home>/.codex`, detectPaths `[codexHome]`, path `["mcp_servers"]`, entry `{ url: MCP_URL }`, nextStep `t(lang, "next.runCommand", { label: "Codex CLI", cmd: "codex mcp login plgn" })`.

Tests (`test/hosts-codex.test.js`; all fail before because the module does not exist):
- mergeCases(codex, ...): others = a comment line, a top-level `model = "x"` and a `[mcp_servers.docs]` table with `command = "npx"`; old = a `[mcp_servers.plgn]` table with `url = "https://old.example/mcp"`; broken = `[mcp_servers`
- detectCases(codex, { dirs: [".codex"], bin: "codex" })
- `codex configPath follows CODEX_HOME` (set, unset and empty)
- `codex merge keeps the comment line byte for byte`
- `codex nextStep names the login command in English and Arabic`

Commit: `feat: Codex CLI host`

### Task 5: Cursor and Windsurf hosts

Files:
- Create: `src/hosts/cursor.js`, `src/hosts/windsurf.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-cursor-windsurf.test.js`

What changes:
- Read the docs (Cursor, for example https://cursor.com/docs/context/mcp; Windsurf, for example https://docs.windsurf.com/windsurf/cascade/mcp): the global file on Windows, macOS and Linux (expected `~/.cursor/mcp.json` and `~/.codeium/windsurf/mcp_config.json`), the key for a remote server (expected `url` for Cursor, `serverUrl` for Windsurf) and the clicks to log in. Source line first in each file.
- cursor: id "cursor", label "Cursor", bin "cursor", format "json", path `["mcpServers"]`, entry `{ url: MCP_URL }`, detectPaths `[<home>/.cursor]`, nextStep `next.cursor`.
- windsurf: id "windsurf", label "Windsurf", bin "windsurf", format "json", path `["mcpServers"]`, entry `{ serverUrl: MCP_URL }`, detectPaths `[<home>/.codeium/windsurf]`, nextStep `next.windsurf`.

Anchors:
- In `src/i18n.js`, directly before the line `// en: end` add `next.cursor` (the clicks from the docs, for example "Cursor: open Settings, then MCP, and press Log in next to plgn") and `next.windsurf` (the same for Windsurf).
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/hosts-cursor-windsurf.test.js`; all fail before because the modules do not exist):
- mergeCases for both: others = another server plus a top-level key that is not MCP; old = plgn with `https://old.example/mcp`; broken = `{ "mcpServers": `
- detectCases(cursor, { dirs: [".cursor"], bin: "cursor" }) and detectCases(windsurf, { dirs: [".codeium/windsurf"], bin: "windsurf" })
- `cursor and windsurf configPath sit under the home on every platform`
- `cursor and windsurf nextStep have English and Arabic text`

Commit: `feat: Cursor and Windsurf hosts`

### Task 6: Gemini CLI and VS Code hosts

Files:
- Create: `src/hosts/gemini.js`, `src/hosts/vscode.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-gemini-vscode.test.js`

What changes:
- Read the docs (Gemini CLI, for example https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md; VS Code, for example https://code.visualstudio.com/docs/copilot/customization/mcp-servers). Expected: Gemini's user file `~/.gemini/settings.json` (if the docs name an env var that moves the folder, follow it from `ctx.env` as codex does), entry `{ httpUrl: MCP_URL, oauth: { enabled: true } }`, login `/mcp auth plgn` typed inside gemini; VS Code's user-profile file `<ctx.appData>/Code/User/mcp.json`, entry `servers.plgn = { type: "http", url: MCP_URL }`, and how a person starts the server and signs in. Source line first in each file.
- gemini: id "gemini", label "Gemini CLI", bin "gemini", format "json", path `["mcpServers"]`, the entry above, detectPaths `[<home>/.gemini]`, nextStep `t(lang, "next.typeInside", { label: "Gemini CLI", cmd: "/mcp auth plgn" })`.
- vscode: id "vscode", label "VS Code", bin "code", format "json", path `["servers"]`, entry `{ type: "http", url: MCP_URL }`, configPath as above, detectPaths `[<ctx.appData>/Code/User]`; stable VS Code only (no Insiders, no profiles); nextStep `next.vscode`.
- Both files may hold comments; such a file stays untouched and is reported (part 1 Decision 7).

Anchors:
- In `src/i18n.js`, directly before the line `// en: end` add `next.vscode` (the steps from the docs, for example "VS Code: open the Command Palette, run MCP: List Servers, pick plgn, press Start and allow the sign-in").
- In `src/i18n.js`, directly before the line `// ar: end` add its Arabic twin (Write/Edit tool only).

Tests (`test/hosts-gemini-vscode.test.js`; all fail before because the modules do not exist):
- mergeCases for both: gemini others = `{ "theme": "Default", "mcpServers": { "docs": { "command": "npx" } } }`; vscode others = `{ "servers": { "docs": { "type": "stdio", "command": "npx" } }, "inputs": [] }`; old and broken as in Task 5
- detectCases(gemini, { dirs: [".gemini"], bin: "gemini" }) and detectCases(vscode, { dirs: ["AppData/Roaming/Code/User"], bin: "code", platform: "win32" })
- `vscode configPath follows the platform` (win32 APPDATA, darwin Library/Application Support, linux XDG_CONFIG_HOME or .config)
- `gemini settings with comments are left alone` (apply gives error PARSE; the file is byte for byte the same)
- `gemini doctor says entryDiffers for a url-only plgn entry` (our address under `url` without oauth)
- `gemini and vscode nextStep have English and Arabic text`

Commit: `feat: Gemini CLI and VS Code hosts`

### Task 7: Claude Code host

Files:
- Create: `src/hosts/claude-code.js`
- Modify: `src/constants.js`, `src/i18n.js`
- Test: `test/hosts-claude-code.test.js`

What changes:
- Read https://code.claude.com/docs/en/plugins/cli-reference (marketplace add, install, `list --json`), the MCP page for how a plugin's server logs in (expected: type `/mcp` inside claude, pick plgn), and with WebFetch https://raw.githubusercontent.com/PLGN-App/PLGN-CLAUDE/main/.claude-plugin/marketplace.json (planner saw marketplace "plgn", plugin "plgn"). Source lines for all three.
- Host: id "claude-code", label "Claude Code", kind "command", bin "claude", configPath returns null; detect = `<home>/.claude` exists or `ctx.which("claude")`.
- Inner `pluginState(ctx)`: `ctx.exec("claude", ["plugin", "list", "--json"], { timeout: 15000 })`; parse stdout from its first `[`; code not 0 or no JSON gives "unknown"; an entry whose id starts with `plgn@` gives "off" when `enabled === false`, else "on"; otherwise "missing" (Decision 9).
- commands = `claude plugin marketplace add ${MARKETPLACE}` and `claude plugin install ${PLUGIN_ID}`.
- apply: no claude on PATH gives status "manual" with commands; state "on" or "off" gives "same"; a dry run gives "added", dryRun true, commands, nothing more run; otherwise run add (failure ignored), then install (timeouts per Decision 10); install code not 0 gives "error", error "EXEC", detail = first non-empty stderr line, else stdout line, else `exit <code>`; else "added" with commands.
- snippet: the two commands, one per line. nextStep(lang, result): "manual" gives `next.claudeCodeManual` then each command on its own line, indented two spaces; otherwise `next.claudeCode`.
- doctor: not detected gives skip `doctor.notFound` (check "found"); no claude gives skip `doctor.noBinary` (vars bin); else a version row like file-host's, then check "plugin": on ok `doctor.pluginOk`, off fail `doctor.pluginOff` (vars cmd `claude plugin enable plgn@plgn`), missing fail `doctor.pluginMissing`, unknown skip `doctor.pluginUnknown`.

Anchors:
- In `src/constants.js`, directly after the line `export const PLUGIN = "plgn";` add `export const PLUGIN_ID = "plgn@plgn";` (the `<plugin>@<marketplace name>` the docs and marketplace.json give on the day).
- In `src/i18n.js`, directly before the line `// en: end` add `next.claudeCode` (the login step from the docs, for example "Claude Code: open it, type /mcp, pick plgn and log in"), `next.claudeCodeManual` "Claude Code is not on PATH here. Run these two lines:", `doctor.pluginOk` "plgn plugin installed", `doctor.pluginMissing` "plgn plugin not installed", `doctor.pluginOff` "plgn plugin is turned off: run {cmd}", `doctor.pluginUnknown` "could not list the plugins".
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/hosts-claude-code.test.js`; all fail before because the module does not exist; tempHome with `addBin("claude")` where claude is on PATH, fakeExec answers keyed like `"claude plugin list --json"`):
- `claude-code runs marketplace add then install plgn@plgn when claude is on PATH` (calls in order: list, add, install; status "added")
- `claude-code is same and runs only the list when plgn is already installed`
- `claude-code dry run never adds or installs and lists both commands`
- `claude-code without claude on PATH is manual and nextStep holds both lines`
- `claude-code reports EXEC with the first stderr line when the install fails`
- `claude-code ignores a failed marketplace add when the install works`
- detectCases(claudeCode, { dirs: [".claude"], bin: "claude" })
- `claude-code doctor plugin row: ok when on, red when missing or off, skip when the list fails`
- `claude-code doctor never runs add or install`

Commit: `feat: Claude Code host`

### Task 8: Claude Desktop host

Files:
- Create: `src/hosts/claude-desktop.js`
- Modify: `src/i18n.js`
- Test: `test/hosts-claude-desktop.test.js`

What changes:
- Read the Claude custom connectors help article (for example https://support.claude.com/en/articles/11175166) for the clicks, and where Claude Desktop keeps its folder on Windows and macOS. Source line first.
- Host: id "claude-desktop", label "Claude Desktop", kind "manual", bin null, configPath returns null. detect: on win32 and darwin, `<ctx.appData>/Claude` exists (plus the Microsoft Store folder under `ctx.env.LOCALAPPDATA` if the docs name it, with its own Source line); never on linux.
- apply returns `{ id, status: "manual", dryRun }` and touches nothing. snippet returns MCP_URL. nextStep returns `next.claudeDesktop` with `{ url: MCP_URL }`. doctor: not detected gives skip `doctor.notFound`; else one skip row, check "manual", key `doctor.checkByHand`. It never gives a fail row.

Anchors:
- In `src/i18n.js`, directly before the line `// en: end` add `next.claudeDesktop` "Claude Desktop: open Settings, Connectors, Add custom connector, name it plgn and paste {url}" and `doctor.checkByHand` "check Settings, Connectors by hand".
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/hosts-claude-desktop.test.js`; all fail before because the module does not exist):
- `claude-desktop apply is manual and writes no file` (files() of the temp home is unchanged, dry run or not)
- detectCases(claudeDesktop, { dirs: ["AppData/Roaming/Claude"], bin: null, platform: "win32" })
- `claude-desktop detect follows the platform and is never true on linux`
- `claude-desktop doctor never gives a red row`
- `claude-desktop nextStep holds the MCP URL in English and Arabic`

Commit: `feat: Claude Desktop host`

### Task 9: Doctor

Files:
- Create: `src/doctor.js`
- Modify: `src/i18n.js`
- Test: `test/doctor.test.js`

What changes:
- checkReach(fetchFn): one GET of WELL_KNOWN_URL with `signal: AbortSignal.timeout(10000)`. `res.ok` gives an ok row (id "plgn", check "reach", key `doctor.reachOk`, vars url); else fail `doctor.reachFail` with the status code or the error message as detail.
- runDoctor(): checkReach first, then each host's doctor(ctx) in order; a host doctor that throws becomes one fail row (check "config", key `doctor.error`, vars detail) (Decision 11). ok is true when no row is fail. This is the only src file that calls fetch.
- renderTable(): one line per row: the label (`labels[id]`, "plgn" for the reach row), the check name (`check.<check>`), a mark (ok ✔ green, fail ✘ red, skip – dim, from `picocolors.createColors(color)`) and `t(lang, key, vars)`. Columns padded by visible width (escape codes not counted). Last line: `doctor.summaryOk`, or `doctor.summaryFail` with {count} = the number of fail rows, through String().

Anchors:
- In `src/i18n.js`, directly before the line `// en: end` add `doctor.title` "plgn doctor" · `doctor.reachOk` "{url} answers" · `doctor.reachFail` "could not reach {url}: {detail}" · `doctor.error` "check stopped: {detail}" · `doctor.summaryOk` "All good." · `doctor.summaryFail` "{count} problem(s). Run npx plgn-setup to fix them." · `check.reach` "reachable" · `check.found` "tool" · `check.config` "config file" · `check.entry` "plgn entry" · `check.version` "version" · `check.plugin` "plugin" · `check.manual` "connector".
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).

Tests (`test/doctor.test.js`; all fail before because the module does not exist):
- `checkReach calls the well-known URL once and is ok on 200`
- `checkReach is red on 500 and on a network error`
- `runDoctor is ok when plgn answers and every detected host is set` (temp home, the real cursor host after its apply)
- `runDoctor is not ok when a detected host has no plgn entry`
- `hosts that are not found give skip rows and keep ok true` (all seven host modules)
- `a host doctor that throws becomes one fail row and the others still run`
- `renderTable with color off has no escape codes and one line per row plus the summary`
- `renderTable in Arabic shows the fail count in Western digits`

Commit: `feat: doctor with one public check and a red or green table`

### Task 10: CLI, host list and bin (closes note G)

Files:
- Create: `src/hosts/index.js`, `src/cli.js`, `bin/plgn-setup.js`
- Modify: `src/i18n.js`, `docs/notes/2026-10-08-plgn-setup-follow-ups.md`
- Test: `test/cli.test.js`

What changes:
- index: imports the seven hosts; `hosts` in HOST_IDS order; getHost by id. bin: the shebang, then run as in Interfaces; after `git add`, run `git update-index --chmod=+x bin/plgn-setup.js`.
- run(argv, io): io defaults are the process streams, isTTY = `process.stdin.isTTY && process.stdout.isTTY`, color `picocolors.isColorSupported`, prompt = @clack/prompts multiselect (message `pick`, hint `detected` on detected hosts, initialValues, required false; `isCancel` gives null), fetch `globalThis.fetch`, ctx `makeContext()`. Parse with `node:util` parseArgs, strict: yes/-y, dry-run, lang, help/-h, version/-v, at most one positional. A bad flag or a second positional prints `badArgs` (detail = the parse message) to stderr and exits 2; a lang other than en/ar prints `unknownLang`, exit 2; --help prints `help`, exit 0; --version prints the version read from the package.json next to src, exit 0.
- `doctor`: runDoctor with io.fetch, print `doctor.title` and renderTable (labels from hosts); exit 0 when ok, else 1.
- Setup (part 1 Decision 12): a named host is used even when not detected; an unknown name prints `unknownHost`, exit 2. No name: detected = hosts whose detect(ctx) is true; `--yes` takes them; no `--yes` and no TTY prints `needYes`, exit 2; else the prompt (null or empty prints `nothingChanged`, exit 0). Nothing chosen prints `noneFound`, exit 0. Print `intro` first.
- Each chosen host's apply runs inside try/catch: a throw becomes `{ id, status: "error", error: "IO", detail: e.message }` (Decision 4). Lines: `added`, `updated`, `same`; on a dry run `wouldAdd` or `wouldUpdate` then the snippet; `backup` when a backup was made; `notReadable` (PARSE, SHAPE) or `notSafe` (UNSAFE) then the snippet; `failed` for EXEC (cmd = the last command); `ioError` for IO; `ran` or `wouldRun` per command (Decision 12). Then `nextTitle` and nextStep(lang, result) for every host without an error, and `dryRun` last on a dry run. Exit 1 when any result is "error", else 0. Setup never calls io.fetch.

Anchors:
- In `src/i18n.js`, directly before the line `// en: end` add `ioError` "{label}: stopped with an error: {detail}" and `wouldRun` "{label}: would run {cmd}", plus any other message the CLI turns out to need.
- In `src/i18n.js`, directly before the line `// ar: end` add their Arabic twins (Write/Edit tool only).
- In `docs/notes/2026-10-08-plgn-setup-follow-ups.md`, replace `- [ ] G.` with `- [x] G.`.

Tests (`test/cli.test.js`; all fail before because the modules do not exist; in-process tests use a tempHome ctx, color false, a fetch that records calls, fakeExec):
- `--dry-run --yes prints the plan and leaves every file untouched` (same bytes, no backup, no add or install call, fetch not called)
- `--yes sets up detected hosts, and a second run says already set and writes nothing`
- `a named host is set up even when it is not detected`
- `unknown host, unknown flag and --lang xx exit 2`
- `no TTY without --yes exits 2 and writes nothing`
- `the prompt gets detected hosts pre-checked and only picked hosts are written`
- `a cancelled prompt says nothing changed and exits 0`
- `an unreadable config exits 1, stays byte for byte, and the snippet is printed`
- `a config path that is a folder prints an error line, exits 1, and the other hosts are still set up`
- `doctor exits 0 when green and 1 when red`
- `--lang ar prints Arabic letters and no Arabic-Indic digits`
- `hosts follow HOST_IDS order`
- `bin --version prints 0.1.0` and `bin --dry-run --yes on a temp home changes nothing and makes no backup` (note G): spawnSync `process.execPath` on `bin/plgn-setup.js` with an env holding only HOME, USERPROFILE, APPDATA, XDG_CONFIG_HOME and CODEX_HOME inside a temp home, PATH = an empty temp folder, plus SystemRoot on Windows. The env holds no NODE_TEST_CONTEXT, so the child takes the temp home as its real home. The second test puts `.cursor` and `.codex` config files in the temp home first, then asserts exit 0, a "would add" line, every file byte for byte the same and no `.plgn-backup` file.

Commit: `feat: the plgn-setup command`

### Task 11: README, CHANGELOG and rule checks

Files:
- Create: `README.md`, `CHANGELOG.md`
- Test: `test/rules.test.js`

What changes:
- README (plain English, lowercase plgn): one line on what it does; `npx plgn-setup`; one line per tool (`npx plgn-setup claude-code` through `npx plgn-setup claude-desktop`) with its login step; `npx plgn-setup doctor`; `--yes`, `--dry-run`, `--lang ar`; the backup rule (`<file>.plgn-backup-YYYYMMDD-HHmmss`, never overwritten, how to restore); files left alone with the snippet printed (JSON with comments; JSON whose numbers would be rewritten, such as 1.0 or very large integers; TOML it cannot edit line by line); what it never does (ask for or store a key, token or password; send anything except doctor's one public GET; telemetry; drop other servers or settings). A short "Release (owner)" checklist: `npm test`; `npm pack --dry-run` lists only bin, src, README, CHANGELOG, LICENSE and package.json; then the owner publishes to npm and creates PLGN-App/plgn-setup on his word.
- CHANGELOG: a `0.1.0 - <build date>` section: the seven tools, doctor, Arabic.

Tests (`test/rules.test.js`):
- `only src/doctor.js calls fetch` (no other src file holds a `fetch(` call)
- `the MCP URL is spelled only in src/constants.js`
- `no src file holds Authorization, Bearer, apiKey, api_key or password` (src/i18n.js included)
- `no src file uses toLocaleString` (Western digits)
- `every host file starts with a Source line` (every file in src/hosts except file-host.js and index.js: line 1 matches `^// Source: https://\S+ \(checked \d{4}-\d{2}-\d{2}\)`)
- `README names every host id, doctor, --lang ar and the backup rule`
- `package files list is exactly bin, src, README.md, CHANGELOG.md, LICENSE`
The README test fails before because there is no README; the others are guards that pass when the earlier tasks kept the rules. A red guard means an earlier task broke a rule: fix that code, not the test.

Commit: `docs: README, CHANGELOG and rule checks`

### Task 12: Live check on the owner's machine (needs the owner's go)

Files:
- none (a fix, if one is needed, gets its own test and commit)

What changes, each step only after his go:
1. `npm test` is all green; `npm pack --dry-run` lists only the `files` entries plus package.json.
2. `node bin/plgn-setup.js doctor`: the plgn row is green (the one live GET; it answered 200 when planned on 2026-10-08).
3. `node bin/plgn-setup.js --dry-run --yes` on his real home: the tools it finds and the lines it would add; nothing is written.
4. One real tool he names (for example `node bin/plgn-setup.js codex`, or `claude-code`): the backup line or the ran lines are printed, the login step works in that tool, a plgn tool call answers, and doctor shows that tool green. A second run says already set.
5. `node bin/plgn-setup.js --lang ar --dry-run --yes` and `node bin/plgn-setup.js doctor --lang ar` read well to him in Arabic.

Commit: none (proof only).
