# Portable skills, plgn-setup side (0.2.0): implementation plan (thin)

Spec: `F:/G drive/Projects/hbs-projects/plgn-lane-plugin/docs/superpowers/specs/2026-10-08-portable-skills-design.md`, Decisions 7-8, the plgn-setup interface and the plgn-setup tests. The plugin side is done (branch feat/portable-skills in plgn-lane-plugin).
Repo: `F:/G drive/Projects/hbs-projects/plgn-lane-setup` (Git Bash: `"/f/G drive/Projects/hbs-projects/plgn-lane-setup"`), branch `feat/skills-step`, 200 tests pass at the start. Builders write the code and the tests from this plan.

## Goal

`npx plgn-setup` copies plgn's bundled skills (every plgn command, role and skill, generated from the plugin) into each tool's global skills folder after it connects that tool, with no network and no `npx skills`.
`npx plgn-setup doctor` shows one skills row per tool that has a skills folder; `--no-skills` skips the step; `--dry-run` lists it.
The package ships `skills/` (first generation committed here) and the `generate.yml` workflow that keeps it fresh; version 0.2.0.

## Rules for every task

- Commit with `git commit -m "<one line>"`. The repo's git config already holds user.name PLGN and the PLGN email. No Co-Authored-By line, no Claude-Session line. One commit per task. Never push, never `npm publish`, never tag.
- Never edit anything in `plgn-lane-plugin` or the real `plgn-setup` folder. Task 1 only runs the plugin's generator, which reads the plugin and writes into this repo.
- Every test builds its own home with `tempHome()` or `makeContext({ home, env, ... })`. No test and no manual check reads or writes the real home folder.
- Arabic text only with the Edit or Write tool, never a shell, `node -e` or Python. Western digits, "points" never "credits", plgn always lowercase. Commands and paths reach a phrase only through `{vars}`.
- Never type the number of skills anywhere (code, tests, README, CHANGELOG, commit messages): it always comes from the bundled `skills/` folder.
- While building, run one test file at a time (`node --test test/<file>.test.js`), then `npm test` once before the commit.

## Decisions

1. The generated tree is committed first (Task 1), alone, generated files only. Reason: every later test reads the real bundled `skills/`; the owner asked for one commit of generated files.
2. No count is typed. Messages take N from `bundledSkills().skills.length`, tests compare with that same value, the only fixed number is the floor test (at least 40). Reason: the plugin decides the count, and the spec already miscounted once.
3. Skills folders come from the `skills` CLI 1.7.1 agent table (npm package `skills` 1.7.1, `dist/cli.mjs`, read by the planner 2026-10-08 from `%LOCALAPPDATA%/npm-cache/_npx/5606f1555d02ef53`): codex `<CODEX_HOME or ~/.codex>/skills`; cursor `~/.cursor/skills`; gemini `~/.gemini/skills`; devin `<XDG_CONFIG_HOME or ~/.config>/devin/skills` on EVERY platform (Windows too: the table uses xdg-basedir, which ignores the platform; it is not `%APPDATA%\devin` and not `~/.devin/skills`, which is the table's project-level folder); vscode `~/.copilot/skills` (the table's `github-copilot` global folder); claude-code and claude-desktop null. Reason: the brief names that table as the source.
4. codex reuses `codexHome` from `src/hosts/codex.js` (exported now). Reason: the MCP file and the skills then always share one CODEX_HOME.
5. `installSkills` touches only folders whose name is in the bundle. A bundled name that is absent is copied (`copied`); one that is present but differs in any file or byte is removed whole and copied again (`replaced`); one that is identical is left alone (`same`). A `plgn-*` folder that is not in the bundle, and every other folder, are never touched. Reason: "never touches any other folder", and v1's rule that a second run writes nothing. Removing stale `plgn-*` folders is a follow-up.
6. A bundled skill is a real directory (not a symlink) in `skills/` whose name starts with `plgn-` and which holds a `SKILL.md` file. `skills/README.md` and `skills/VERSION` are never copied. A missing `skills/` folder gives `{ version: null, skills: [] }`, and then the CLI skips the step and doctor shows no row. Reason: a dev checkout without a tree must not crash.
7. Copy with a small own recursive copy (`readdirSync` with file types, `mkdirSync`, `copyFileSync`); no `fs.cpSync`, no child process, no fetch. All of `src/skills.js` is synchronous. Reason: engines say Node >= 20.12, where `cpSync` was still experimental; the owner ruled no network and no `npx skills` spawn.
8. CLI, per host, in this order: apply, report, then the skills step. The skills step prints nothing when `--no-skills` is given, the result is `error` or `manual`, `skillsDirFor` is null, or the bundle is empty. Otherwise it first plans with `installSkills(..., { dryRun: true })`: nothing to copy or replace prints `skills.same` and asks nothing; `--dry-run` prints `skills.would` plus one indented line of the folder names it would write, comma-joined, and asks nothing; `--yes` means yes; a TTY asks `skills.ask` through `io.confirm`; no TTY without `--yes` prints `skills.skipped`. A no (false or null) prints `skills.skipped`. Yes installs and prints `skills.done`. Reason: the brief, and a non-interactive run must never hang.
9. Exit codes keep their meaning: 0 done, 1 something failed, 2 bad usage. A skills copy that throws a real file-system error (a string `code` and a string `syscall`, the file-host rule) prints a red `skills.error` line and makes the run exit 1; any other error still throws. A no, a skip or `--no-skills` never change the code. Reason: same rule as a host write that fails.
10. The skills lines print inside the host loop, so the "Next, log in once in each tool" block still follows with every login line. Reason: the brief keeps the login step as the last thing a person reads.
11. Doctor adds one row per host that has a skills folder, is detected (`host.detect(ctx)`), and has a non-empty bundle; check `skills`. Complete: ok `doctor.skillsOk`. Some: fail `doctor.skillsPartial`. None: fail `doctor.skillsNone`. `{cmd}` is `npx plgn-setup <host id>`. "Installed" means `<dir>/<name>/SKILL.md` exists for a bundled name (no byte compare, no version compare: spec Decision 9 leaves that for later). An error while counting gives a fail row `doctor.error` with check `skills`. Reason: the brief's three states; an undetected host already shows "not found".
12. The test helper `cli()` gets a `confirm` option that defaults to answering no. Reason: otherwise an interactive test would reach the real clack prompt and hang.
13. Version 0.2.0; `files` gains `skills`; `.github/workflows/generate.yml` is a byte copy of the plugin's `_dev/portable-repo/generate.yml`; `skills/README.md` comes from the generator only. Reason: spec Decision 7-8 and the brief.

## Interfaces

- `src/skills.js`: `export const SKILLS_DIRS: Record<HostId, ((ctx: Ctx) => string) | null>` (keys exactly HOST_IDS)
- `src/skills.js`: `export function skillsDirFor(hostId: string, ctx: Ctx): string | null` (null for claude-code, claude-desktop and any unknown id)
- `src/skills.js`: `export function bundledSkills(): { root: string, version: string | null, skills: { name: string, dir: string }[] }` (root = the package's own `skills/`, found from `import.meta.url`; skills sorted by name; version = trimmed VERSION or null)
- `src/skills.js`: `export function installSkills(ctx: Ctx, hostId: string, { dryRun = false } = {}): { dir: string, copied: string[], replaced: string[], same: string[] } | null` (null when the host has no skills folder; dryRun writes nothing, not even the folder)
- `src/skills.js`: `export function skillsStatus(ctx: Ctx, hostId: string): { installed: number, total: number, version: string | null } | null` (version = the bundled VERSION)
- `src/hosts/codex.js`: `export const codexHome = (ctx: Ctx) => string` (was private)
- `src/cli.js`: `run(argv, io)` io gains `confirm: (message: string, lang: "en" | "ar") => Promise<boolean | null>`, default a clack `confirm` (cancel gives null); new boolean option `no-skills`
- Type `Row.check` gains `"skills"`
- `src/i18n.js` new keys, en and ar: `skills.ask`, `skills.same`, `skills.would`, `skills.done`, `skills.skipped`, `skills.error`, `doctor.skillsOk`, `doctor.skillsPartial`, `doctor.skillsNone`, `check.skills`; `help` gains `[--no-skills]`

## Review Focus

1. Only bundled names are ever written or removed in a host's skills folder; a foreign folder and an unbundled `plgn-*` folder survive; an identical folder is not rewritten (its SKILL.md mtime stays).
2. The folders are the table's, not the brief's guesses: devin is `<XDG_CONFIG_HOME or ~/.config>/devin/skills` on Windows too, vscode is `~/.copilot/skills`, codex follows CODEX_HOME.
3. No skills count is typed anywhere; every N comes from `bundledSkills()`.
4. `--dry-run` never asks and creates no folder; no TTY without `--yes` never asks; `--no-skills` prints no skills line; the login block still prints after the skills lines.
5. Doctor's skills row appears only for a detected skills host; the existing "every detected host is set" doctor test now installs the skills first.
6. The Arabic lines are exactly the ones in Task 3, put in with the Edit tool.

Reviewer check (owner): make a temp folder `T` with an empty `T/.codex`, then run from the repo, in Git Bash, `HOME=$T USERPROFILE=$T APPDATA=$T/AppData/Roaming XDG_CONFIG_HOME=$T/.config CODEX_HOME=$T/.codex node bin/plgn-setup.js codex --yes`, then `... node bin/plgn-setup.js doctor` with the same variables (CODEX_HOME and APPDATA too, or a real CODEX_HOME or the real Windows profile would be read). Then read `skills/plgn-month/SKILL.md` and `skills/plgn-role-copywriter/SKILL.md` once for broken references.

### Task 1: First generation of the bundled skills tree

Files:
- Create: `skills/` (every file the generator writes: one folder per skill with its SKILL.md, plus README.md and VERSION)

What changes:
- Run, from any folder, `node "F:/G drive/Projects/hbs-projects/plgn-lane-plugin/_dev/scripts/portable.mjs" --out "F:/G drive/Projects/hbs-projects/plgn-lane-setup/skills"`. It prints `<n> skills, <m> rewrites` and exits 0.
- Check: `skills/VERSION` holds `1.17.1`; the number of `plgn-*` folders equals the printed n; `skills/README.md` exists; `git status --short` shows nothing outside `skills/`. If VERSION is not 1.17.1 or the generator exits non-zero, stop and report; do not edit the plugin.
- Add nothing by hand (no extra README, no .gitkeep).

Anchors: none (new files only).

Tests: none in this task (the floor test is in Task 2). Run `npm test` once: still 200 passing.

Commit: `git add skills && git commit -m "skills: first generation from plugin 1.17.1"`

### Task 2: src/skills.js: host folders, the bundle, install and status

Files:
- Create: `src/skills.js`
- Modify: `src/hosts/codex.js`
- Test: `test/skills.test.js`

What changes:
- `src/skills.js` per Interfaces and Decisions 3-7. Line 1: `// Source: https://www.npmjs.com/package/skills/v/1.7.1 (checked 2026-10-08)`, line 2 a comment saying the folders are the agent table's `globalSkillsDir` values in that package's `dist/cli.mjs` (codex, cursor, gemini-cli, devin, github-copilot) and that devin uses xdg-basedir on every platform.
- `SKILLS_DIRS` holds one entry per HOST_ID; `skillsDirFor` returns `SKILLS_DIRS[id]?.(ctx) ?? null` for an own key, null otherwise.
- Same-folder test for Decision 5: the sorted list of relative file paths matches and every file's bytes are equal (`Buffer.equals`).

Anchors:
- In `src/hosts/codex.js`, replace
```js
const codexHome = (ctx) => ctx.env.CODEX_HOME || path.join(ctx.home, ".codex");
```
with the same line starting with `export `.

Tests (`test/skills.test.js`; all fail before because the module does not exist):
- "SKILLS_DIRS has one entry for every host id": sorted keys equal sorted HOST_IDS.
- "skillsDirFor gives the skills CLI 1.7.1 folders": on a win32 and a linux ctx, codex `<home>/.codex/skills` (and `<X>/skills` with env CODEX_HOME X), cursor `.cursor/skills`, gemini `.gemini/skills`, devin `<home>/.config/devin/skills` on both platforms (and `<Y>/devin/skills` with XDG_CONFIG_HOME Y), vscode `.copilot/skills`; claude-code, claude-desktop and "nope" give null.
- "the bundled skills folder has at least 40 plgn-* folders and a VERSION": read the repo's `skills/` with fs directly; count of `plgn-*` dirs >= 40; trimmed VERSION matches `/^\d+\.\d+\.\d+$/`.
- "bundledSkills lists the plgn-* folders that hold SKILL.md, sorted, with the VERSION": names equal the fs listing, sorted, include `plgn-conventions`, exclude README.md; version equals the trimmed VERSION.
- "installSkills copies every bundled folder into a fake home": codex; `copied` equals every bundled name, `replaced` and `same` empty, `dir` equals skillsDirFor; each SKILL.md is byte-equal to the bundle.
- "installSkills replaces an old plgn folder and keeps every other folder": pre-put the first bundled name with SKILL.md "old" and an `extra.txt`, plus `my-own-skill/SKILL.md` and `plgn-not-bundled/SKILL.md`; after: that name is in `replaced`, `extra.txt` is gone, the other two folders are byte-identical.
- "a second install writes nothing": all names in `same`; one SKILL.md keeps its `mtimeMs`.
- "installSkills with dryRun writes nothing": returns all names in `copied`; `h.files()` unchanged; the skills folder does not exist.
- "hosts without a skills folder give null": installSkills and skillsStatus for claude-code and claude-desktop.
- "skillsStatus counts installed folders": installed 0 before, total after install, total - 1 after removing one folder; version equals the bundle's.
- "src/skills.js runs no program and makes no network call": its source holds neither `child_process`, `fetch(` nor `npx`.

Commit: `git commit -m "skills: host folders, bundled skills, install and status"`

### Task 3: Skills phrases in English and Arabic

Files:
- Modify: `src/i18n.js`
- Test: `test/i18n.test.js`

What changes:
- Ten new keys in each language, and `[--no-skills]` in both usage lines. Put the Arabic in with the Edit tool only, exactly as below.

Anchors:
- In `src/i18n.js`, the usage line below sits twice (en and ar); use the Edit tool's replace_all and replace
```js
      "  {cmd} [tool] [--yes] [--dry-run] [--lang en|ar]\n" +
```
with the same line with ` [--no-skills]` after `[--dry-run]`.
- In `src/i18n.js`, directly before the line `    // en: end`, add:
```js
    "skills.ask": "Install plgn's {count} skills (commands and roles) for {label}?",
    "skills.same": "{label}: plgn's {count} skills are already installed in {dir}",
    "skills.would": "{label}: would install {count} plgn skills in {dir}:",
    "skills.done": "{label}: plgn skills installed in {dir} ({copied} new, {replaced} updated)",
    "skills.skipped": "{label}: skills not installed. To install them later, run {cmd}",
    "skills.error": "{label}: could not install the skills: {detail}",
    "doctor.skillsOk": "{count} of {total} plgn skills",
    "doctor.skillsPartial": "{count} of {total} · run {cmd}",
    "doctor.skillsNone": "none · run {cmd}",
    "check.skills": "skills",
```
- In `src/i18n.js`, directly before the line `    // ar: end`, add:
```js
    "skills.ask": "هل تريد تثبيت مهارات plgn (الأوامر والأدوار، وعددها {count}) في {label}؟",
    "skills.same": "{label}: مهارات plgn مثبتة من قبل في {dir} (وعددها {count})",
    "skills.would": "{label}: سيتم تثبيت مهارات plgn في {dir} (وعددها {count}):",
    "skills.done": "{label}: تم تثبيت مهارات plgn في {dir} (الجديدة: {copied}، المحدّثة: {replaced})",
    "skills.skipped": "{label}: لم يتم تثبيت المهارات. لتثبيتها لاحقًا، شغّل {cmd}",
    "skills.error": "{label}: تعذّر تثبيت المهارات: {detail}",
    "doctor.skillsOk": "{count} من {total} من مهارات plgn",
    "doctor.skillsPartial": "{count} من {total} · شغّل {cmd}",
    "doctor.skillsNone": "لا توجد مهارات · شغّل {cmd}",
    "check.skills": "المهارات",
```

Tests (add at the end of `test/i18n.test.js`; fail before because the keys are missing and `t` throws):
- "the skills phrases exist in both languages": every key above is in `phrases.en` and `phrases.ar`; `t("en", "skills.ask", { count: 7, label: "Codex CLI" })` equals `Install plgn's 7 skills (commands and roles) for Codex CLI?`; the Arabic one holds `7` and `Codex CLI`.
- "help names --no-skills in both languages": both `help` texts include `--no-skills`.
- The existing twin, placeholder, digit, lowercase and no-npx tests must still pass unchanged.

Commit: `git commit -m "i18n: skills phrases in English and Arabic"`

### Task 4: Doctor: one skills row per skills host

Files:
- Modify: `src/doctor.js`
- Test: `test/doctor.test.js`

What changes:
- runDoctor adds the rows of Decision 11 after each host's own rows, through a private `skillsRows(ctx, host)` that returns `[]` or one row. vars: `{ count, total, cmd }` (ok row: count and total only).

Anchors:
- In `src/doctor.js`, directly after the line `import { t } from "./i18n.js";`, add the import of `skillsDirFor` and `skillsStatus` from `./skills.js`.
- In `src/doctor.js`, replace
```js
        vars: { detail: String(e?.message ?? e) },
      });
    }
  }
```
with the same lines plus `rows.push(...skillsRows(ctx, host));` as the last statement inside the `for` loop.
- In `src/doctor.js`, directly after the line `const FIX_CMD = "npx plgn-setup";`, add `function skillsRows(ctx, host)` (cmd `${FIX_CMD} ${host.id}`; its own try/catch gives the `doctor.error` row with check `skills`).
- In `test/doctor.test.js`, directly after the line `import { tempHome } from "./helpers.js";`, add the import of `bundledSkills` and `installSkills` from `../src/skills.js`.
- In `test/doctor.test.js`, replace
```js
    const res = await cursor.apply(h.ctx, { dryRun: false });
    assert.equal(res.status, "added");
    const out = await runDoctor(h.ctx, { hosts: [cursor], fetch: answer(200) });
```
with the same lines plus `installSkills(h.ctx, "cursor", { dryRun: false });` before runDoctor, and an assert that a cursor row with check `skills` is ok, key `doctor.skillsOk`, count equal to `bundledSkills().skills.length`.

Tests (`test/doctor.test.js`; the new ones fail before because no skills row exists):
- The updated "runDoctor is ok when plgn answers and every detected host is set" (above).
- "the skills row is red and partial when a skill folder is missing": install, remove one folder; row fail, key `doctor.skillsPartial`, count total - 1, cmd `npx plgn-setup cursor`; `ok` false.
- "the skills row is red none when no plgn skill is installed": cursor.apply only; row fail, key `doctor.skillsNone`, cmd `npx plgn-setup cursor`.
- "no skills row for a host that is not found or has no skills folder": every host on an empty home gives no row with check `skills`; the existing "hosts that are not found give skip rows" test stays green.
- "renderTable labels the skills check": one ok skills row renders a line holding `skills` and `3 of 3 plgn skills`.

Commit: `git commit -m "doctor: skills row per skills host"`

### Task 5: CLI: the skills step, --no-skills and the confirm prompt

Files:
- Modify: `src/cli.js`
- Test: `test/cli.test.js`

What changes:
- The skills step of Decisions 8-10, in a private `async function offerSkills(host, result)` inside `run`, next to `report`. `{cmd}` for `skills.skipped` is `${CMD} ${host.id}`. `skills.error` is painted red.

Anchors:
- In `src/cli.js`, directly after the line `  "dry-run": { type: "boolean" },`, add `"no-skills": { type: "boolean" },`.
- In `src/cli.js`, directly after the line `import { getHost, hosts } from "./hosts/index.js";`, add the import of `bundledSkills`, `installSkills`, `skillsDirFor` from `./skills.js`.
- In `src/cli.js`, directly before the line `export async function run(argv, io = {}) {`, add `async function clackConfirm(message)` (clack `confirm({ message })`; cancel gives null).
- In `src/cli.js`, directly after the line `  const prompt = io.prompt ?? clackPrompt;`, add `const confirm = io.confirm ?? clackConfirm;`.
- In `src/cli.js`, directly after the line `  const results = [];`, add `let skillsFailed = false;`.
- In `src/cli.js`, replace
```js
    results.push({ host, result });
    report(host, result);
  }
```
with the same lines plus `await offerSkills(host, result);` after `report`.
- In `src/cli.js`, directly before the line `  const forNext = results.filter(({ result }) => result.status !== "error");`, add `offerSkills`.
- In `src/cli.js`, replace
```js
  return results.some(({ result }) => result.status === "error") ? 1 : 0;
```
with a return that also gives 1 when `skillsFailed`.
- In `test/cli.test.js`, directly after the line `import { fakeExec, tempHome } from "./helpers.js";`, add the import of `bundledSkills` and `skillsDirFor` from `../src/skills.js`.
- In `test/cli.test.js`, replace
```js
async function cli(h, argv, { isTTY = false, prompt, answers, fetchOk = true, out = [] } = {}) {
```
with the same signature plus `confirm = async () => false`, and pass `confirm` in the `run` io next to `prompt`.

Tests (`test/cli.test.js`; the new ones fail before because no skills step exists):
- "--yes installs the bundled skills and the login line still follows": `codex --yes`; every bundled name under skillsDirFor; out has `Codex CLI: plgn skills installed in`; `Next, log in once in each tool:` and `codex mcp login plgn` come after it.
- "a second --yes run says the skills are already installed and asks nothing": out has `already installed`; the snapshot is unchanged; a counting confirm is never called.
- "the question names the host and the bundled count, and yes installs": isTTY true, `codex`, confirm returns true; its message equals `t("en", "skills.ask", { count: bundledSkills().skills.length, label: "Codex CLI" })`.
- "a no, no TTY without --yes, and --no-skills all skip the skills": no answer and no TTY print `skills not installed` and `npx plgn-setup codex`; `--yes --no-skills` prints no line holding `skills`; the MCP file is written each time and the skills folder never exists.
- "--dry-run lists the skills it would copy and writes nothing": isTTY true; confirm never called; out has `would install` and every bundled name; snapshot unchanged.
- "hosts without a skills folder get no skills step": `claude-desktop --yes` prints nothing matching `/skills/i`.
- "a skills folder that is a file prints an error line and exits 1": put a file at `.codex/skills`; `codex --yes` exits 1, out has `could not install the skills`, config.toml holds MCP_URL.
- "--help names --no-skills".

Commit: `git commit -m "cli: skills step after each host, --no-skills"`

### Task 6: Package 0.2.0, README, CHANGELOG and the generate workflow

Files:
- Modify: `package.json`, `README.md`, `CHANGELOG.md`
- Create: `.github/workflows/generate.yml`
- Test: `test/rules.test.js`

What changes:
- Copy `F:/G drive/Projects/hbs-projects/plgn-lane-plugin/_dev/portable-repo/generate.yml` to `.github/workflows/generate.yml` with `cp`, then prove it with `cmp` (byte-identical).
- `npm pack --dry-run` lists the `skills/` files (check only; never publish).

Anchors:
- In `package.json`, replace
```json
  "version": "0.1.1",
```
with version `0.2.0`.
- In `package.json`, replace
```json
    "bin",
    "src",
```
with the same two lines plus `"skills",` after `"src",`.
- In `test/rules.test.js`, replace
```js
test("package files list is exactly bin, src, README.md, CHANGELOG.md, LICENSE", () => {
  const pkg = JSON.parse(read(path.join(root, "package.json")));
  assert.deepEqual([...pkg.files].sort(), ["CHANGELOG.md", "LICENSE", "README.md", "bin", "src"]);
```
with the title "package files list is exactly bin, src, skills, README.md, CHANGELOG.md, LICENSE" and `"skills"` added to the sorted list.
- In `test/rules.test.js`, directly after the line `  assert.ok(readme.includes(".plgn-backup-YYYYMMDD-HHmmss"));`, add asserts that the README holds `--no-skills` and `npx skills add PLGN-App/plgn-setup`.
- In `CHANGELOG.md`, directly after the line `# Changelog`, add a `## 0.2.0 - 2026-10-08` entry: installs plgn's skills (commands, roles and skills from the plgn plugin) into Codex CLI, Cursor, Gemini CLI, Devin and VS Code (GitHub Copilot) from the package itself, no network, never touching other skills; `--no-skills`; `--dry-run` lists them; doctor counts them; `npx skills add PLGN-App/plgn-setup` also works.
- In `README.md`, directly before the line `## One tool at a time`, add a section `## plgn's skills`: what the step does and asks, that it copies from the package with no network, that only folders named after plgn's own skills are ever replaced, a table of host id to folder (codex `~/.codex/skills` or `$CODEX_HOME/skills`; cursor `~/.cursor/skills`; gemini `~/.gemini/skills`; devin `~/.config/devin/skills` or `$XDG_CONFIG_HOME/devin/skills`, Windows included; vscode `~/.copilot/skills`), that Claude Code gets the plugin and Claude Desktop has no skills folder, and the line `npx skills add PLGN-App/plgn-setup` for people who already use the skills CLI. No skills count.
- In `README.md`, replace
```md
- `--dry-run` shows what it would do and changes nothing.
```
with the same line plus a line: `--no-skills` connects the tools but does not install plgn's skills.
- In `README.md`, replace
```md
2. `npm pack --dry-run` lists only bin, src, README, CHANGELOG, LICENSE and package.json.
```
with the same step naming skills too, and one step before step 1: after a plugin release, `gh workflow run generate.yml` refreshes `skills/`.

Tests (`test/rules.test.js`; fail before because files has no `skills`, the README lacks the lines and the workflow is missing):
- The updated files-list test (above).
- The README test with its two new asserts (above).
- "the generate workflow regenerates skills/ from the plugin": `.github/workflows/generate.yml` exists and holds `contents: write` and `_dev/scripts/portable.mjs" --out ./skills`.

Commit: `git commit -m "release: 0.2.0 with bundled skills, generate workflow, README and changelog"`

### Task 7: Live proof on a real machine (needs the owner's go)

Files: none.

What changes:
- Only on the owner's word: merge and push, tag `v0.2.0` so the publish workflow puts 0.2.0 on npm, then run the generate workflow once by hand (`gh workflow run generate.yml`) once the plugin has its release tag.
- `npx skills add PLGN-App/plgn-setup -l` lists as many skills as `skills/` holds.
- `npx plgn-setup@0.2.0 codex` on his machine, `codex mcp login plgn`, then Codex runs "plgn post for Bunduq" end to end. Points are spent only on his go.
- Open in Devin and in VS Code (Copilot) and check that each lists the plgn skills from the folder of Decision 3; if one does not, record the folder it really reads as a follow-up.

Anchors: none. Tests: none (live). Commit: none.
