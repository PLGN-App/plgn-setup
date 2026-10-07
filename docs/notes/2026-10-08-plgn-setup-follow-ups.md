# plgn-setup follow-ups

## plgn-setup-v1 leftovers, added 2026-10-08

- [x] A. `src/hosts/file-host.js`: doctor reports `doctor.entryWrong` even when the URL matches but another key differs (e.g., host UI adds `disabled`). Use `doctor.entryDiffers` instead when oldUrl(found) equals oldUrl(entry). Keep the row red.

- [x] B. `src/merge.js`: TOML header regex `^\\s*` matches U+FEFF (BOM), so BOM is dropped when swapping. Use `^[ \\t]*` instead and write BOM as "﻿".

- [x] C. `src/merge.js`: JSON merge re-serialises the whole file, changing number form (1.0→1) and rounding large integers. Optional: throw UNSAFE when JSON.stringify(JSON.parse(original)) would not round-trip, or document in README.

- [x] D. `src/hosts/file-host.js`: apply only maps MergeError to a Result; other I/O errors throw (EACCES, EISDIR, EPERM on Windows). Either catch I/O errors and return `{ status: "error", error: "IO", detail }`, or ensure Task 11's CLI wraps each host's apply in try/catch.

- [x] E. `src/i18n.js`: Arabic wording: 'سيتم إضافة' → 'ستتم إضافة' (إضافة is feminine), 'لم يتم كتابة أي شيء' → 'لم تتم كتابة أي شيء', pick → 'أي أدوات تريد ربطها بـ plgn؟'.

- [x] F. `src/context.js`: On non-Windows, which() does not check execute bit; non-executable files on PATH count as installed. Check fs.accessSync(full, fs.constants.X_OK). Use `||` for APPDATA consistency with XDG_CONFIG_HOME branch.

- [x] G. `F:/G drive/Projects/hbs-projects/plgn-setup/bin/plgn-setup.js`: Task 11 not yet implemented; when built, add a bin spawn test in test/cli.test.js with temp HOME/USERPROFILE/APPDATA/XDG_CONFIG_HOME and empty PATH, running `node bin/plgn-setup.js --dry-run --yes`. Assert temp home unchanged and no .plgn-backup file.

- [x] H. Windsurf config path needs the owner's ruling before release (found 2026-10-08, review of v1 part 2). docs.windsurf.com/windsurf/cascade/mcp now redirects (307) to docs.devin.ai/desktop/cascade/mcp, which names only ~/.config/devin/mcp_config.json (or $XDG_CONFIG_HOME/devin) on macOS/Linux and %APPDATA%\devin\mcp_config.json on Windows, and never mentions Windsurf or ~/.codeium/windsurf. v1 keeps the old Windsurf file ~/.codeium/windsurf/mcp_config.json (src/hosts/windsurf.js) because a ruling was not available; if the app reads the devin file, setup says "added" and doctor shows green for a file the app ignores. Options for the owner: (1) point configPath at the devin path, (2) detect both folders, (3) add a separate Devin Desktop host, (4) keep the old path and accept it. Task 12 step 4 live check MUST include Windsurf: after setup, open Windsurf, confirm a plgn tool call answers, and note which file it read.
  Renamed to devin on the owner's ruling, 2026-10-08. `src/hosts/devin.js`: writes `~/.config/devin/mcp_config.json` (`%APPDATA%\devin\mcp_config.json` on Windows); when only the old `~/.codeium/windsurf/mcp_config.json` exists it updates that one and the output says it is the old Windsurf path; doctor reads whichever file is there; `windsurf` stays an alias of `devin` on the command line; display name "Devin (formerly Windsurf)". The Task 12 live check inside the Devin app is still owed.

## plgn-setup-v1-part2 leftovers, added 2026-10-08

- [x] I. `src/hosts/file-host.js`: apply converts any string-code error to an IO result, but Node errors also use string codes—a bug like undefined configPath becomes silent instead of throwing. Also omits the backup path from the IO result when backupFile succeeds but writeConfig fails. Treat only system errors as IO (e.g., `!e.code.startsWith("ERR_")`); keep the backup path in the result.

- [x] J. `src/hosts/claude-code.js`: pluginState only checks ids starting with plgn@, missing pseudo-ids like name@skills-dir, name@inline, name@synced from `plugin list --json`. A local skills-dir plugin would make doctor show green for an uninstalled real plugin. Ignore @skills-dir/@inline ids; treat plgn as "on" when any matching entry is enabled.

- [x] K. `test/hosts-gemini-vscode.test.js`: The "vscode configPath follows the platform" test checks almost nothing—win32 assertion always true, linux case compares against the value the code uses, only darwin is a real check. Also uses httpUrl instead of url for the gemini test. Build contexts with makeContext({ home, platform, env }) and assert literal expected paths; add { url: MCP_URL } case to gemini entryDiffers test.

- [x] L. `src/i18n.js`: Arabic doctor.summaryFail reads "{count} مشكلة", ungrammatical for counts 2-10 (should be مشاكل). New phrases also embed commands inline instead of passing through {vars} per Focus 6. Use "عدد المشاكل: {count}. شغّل {cmd} لإصلاحها." and pass all commands through {cmd} vars.

- [x] M. `src/doctor.js`: renderTable pads by String.length, so Arabic combining marks (shadda) count toward width but stay invisible, misaligning columns. When fetch rejects, the message is just "fetch failed"; the real reason (ENOTFOUND, ECONNREFUSED) is in e.cause. Measure width with combining marks removed via normalize/regex; use e?.cause?.message ?? e?.message for reachFail detail.

- [x] N. `src/hosts/claude-code.js`: Comment on lines 6-7 says the CLI reference docs do not show `marketplace add`, but they do: `claude plugin marketplace add <source>` is documented with the `owner/repo` form, and repeat add exits 0. Correct the comment to cite the documented form and exit code.

- [x] O. `src/i18n.js`: The help article instructs "Customize > Connectors, then click '+ Add', then 'Add custom connector'", but both `next.claudeDesktop` phrases and the README row omit the click step. Add the '+ Add' click to both phrases (use the Edit tool for Arabic).

- [x] P. `src/i18n.js`: Arabic doctor.summaryFail reads '{count} مشكلة', wrong grammar for 2-10 counts (should vary with count). Use 'عدد المشاكل: {count}. شغّل npx plgn-setup لإصلاحها.' with the Edit tool to fix both the phrase and keep commands inline (if allowed by decision).

- [x] Q. `src/i18n.js`: Review Focus 6 and the plan rule say commands reach a phrase only through {vars}. New phrases still embed commands inline: /mcp in next.claudeCode, "MCP: List Servers" in next.vscode, npx plgn-setup in doctor.summaryFail. Either pass these as {cmd} vars per the rule, or update the plan/focus to allow these fixed command names inline.

- [x] R. `src/cli.js`: The color default is `picocolors.isColorSupported`, which is always true on win32. A smoke run with stdout piped printed raw escape codes, so `npx plgn-setup --yes > log.txt` on Windows writes escape codes to the file. Default color to `picocolors.isColorSupported && Boolean(process.stdout.isTTY)`.

- [x] S. `README.md`: The line "Send anything anywhere, except doctor's one public GET" is true of plgn-setup's own code, but the setup run for Claude Code executes `claude plugin marketplace add`, which clones PLGN-App/PLGN-CLAUDE from GitHub. A reader may misunderstand and assume setup causes no network traffic. Add one sentence: for Claude Code, setup runs the claude CLI, which downloads the plgn plugin from GitHub.

- [x] T. `test/hosts-gemini-vscode.test.js`: The "vscode configPath follows the platform" test's Linux XDG check builds the ctx by hand (never tests that XDG_CONFIG_HOME reaches appData), and the win32 assertion is always true. Build the Linux ctx properly with makeContext({ home, platform: 'linux', env: { XDG_CONFIG_HOME } }); also add { url: MCP_URL } case to the gemini entryDiffers test for "our address under url".

- [x] U. `package-lock.json`: The lockfile root engines field still says ">=20", while package.json specifies ">=20.12" (raised because @clack/prompts 1.8.1 requires >=20.12.0). Run `npm install --package-lock-only` so the lockfile root matches package.json.
