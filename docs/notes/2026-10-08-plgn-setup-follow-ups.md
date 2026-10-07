# plgn-setup follow-ups

## plgn-setup-v1 leftovers, added 2026-10-08

- [x] A. `src/hosts/file-host.js`: doctor reports `doctor.entryWrong` even when the URL matches but another key differs (e.g., host UI adds `disabled`). Use `doctor.entryDiffers` instead when oldUrl(found) equals oldUrl(entry). Keep the row red.

- [ ] B. `src/merge.js`: TOML header regex `^\\s*` matches U+FEFF (BOM), so BOM is dropped when swapping. Use `^[ \\t]*` instead and write BOM as "﻿".

- [ ] C. `src/merge.js`: JSON merge re-serialises the whole file, changing number form (1.0→1) and rounding large integers. Optional: throw UNSAFE when JSON.stringify(JSON.parse(original)) would not round-trip, or document in README.

- [x] D. `src/hosts/file-host.js`: apply only maps MergeError to a Result; other I/O errors throw (EACCES, EISDIR, EPERM on Windows). Either catch I/O errors and return `{ status: "error", error: "IO", detail }`, or ensure Task 11's CLI wraps each host's apply in try/catch.

- [ ] E. `src/i18n.js`: Arabic wording: 'سيتم إضافة' → 'ستتم إضافة' (إضافة is feminine), 'لم يتم كتابة أي شيء' → 'لم تتم كتابة أي شيء', pick → 'أي أدوات تريد ربطها بـ plgn؟'.

- [ ] F. `src/context.js`: On non-Windows, which() does not check execute bit; non-executable files on PATH count as installed. Check fs.accessSync(full, fs.constants.X_OK). Use `||` for APPDATA consistency with XDG_CONFIG_HOME branch.

- [ ] G. `F:/G drive/Projects/hbs-projects/plgn-setup/bin/plgn-setup.js`: Task 11 not yet implemented; when built, add a bin spawn test in test/cli.test.js with temp HOME/USERPROFILE/APPDATA/XDG_CONFIG_HOME and empty PATH, running `node bin/plgn-setup.js --dry-run --yes`. Assert temp home unchanged and no .plgn-backup file.
