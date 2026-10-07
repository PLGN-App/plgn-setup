import fs from "node:fs";
import { SERVER_NAME } from "../constants.js";
import { backupFile, writeConfig } from "../backup.js";
import { MergeError, mergeJson, mergeToml, readEntry, sameValue } from "../merge.js";

// One factory for the five hosts that keep plgn in a JSON or TOML file.
// A host file holds only its checked facts; merge, apply and doctor live here once.

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (e) {
    if (e?.code === "ENOENT") return null;
    throw e;
  }
}

// The address inside an old entry, whichever key the host uses for it.
const oldUrl = (e) => (e && typeof e === "object" ? (e.url ?? e.httpUrl ?? e.serverUrl ?? "") : "");

export function makeFileHost(spec) {
  const { id, label, bin, format, path, entry } = spec;
  const opts = { path, name: SERVER_NAME, entry };
  const mergeText = format === "toml" ? mergeToml : mergeJson;
  const merge = (text) => mergeText(text, opts);

  const detect = (ctx) =>
    spec.detectPaths(ctx).some((p) => fs.existsSync(p)) || Boolean(bin && ctx.which(bin));

  return {
    id,
    label,
    kind: "file",
    bin: bin ?? null,
    format,
    path,
    entry,
    detect,
    configPath: (ctx) => spec.configPath(ctx),
    merge,
    // What a person would paste by hand: the same text a merge into an empty file gives.
    snippet: () => merge(null).text,
    nextStep: (lang, result) => spec.nextStep(lang, result),

    async apply(ctx, { dryRun }) {
      const file = spec.configPath(ctx);
      // backupFile returns null when there is no file yet; kept outside the try so a failed write still names it.
      let backup = null;
      try {
        const merged = merge(readText(file));
        if (merged.change === "same") return { id, status: "same", dryRun, file };
        if (dryRun) return { id, status: merged.change, dryRun, file };
        backup = backupFile(file, { now: ctx.now() });
        writeConfig(file, merged.text);
        return { id, status: merged.change, dryRun, file, backup };
      } catch (e) {
        if (e instanceof MergeError) return { id, status: "error", dryRun, error: e.code, detail: e.message, file };
        // Only a real file-system error (EACCES, EISDIR, EPERM: a string code AND a syscall) becomes a result.
        // Node's own ERR_* errors have a code but no syscall, so a bug such as an undefined path still throws.
        if (typeof e?.code === "string" && typeof e?.syscall === "string") {
          const r = { id, status: "error", dryRun, error: "IO", detail: e.message, file };
          if (backup) r.backup = backup;
          return r;
        }
        throw e;
      }
    },

    async doctor(ctx) {
      if (!detect(ctx)) return [{ id, check: "found", status: "skip", key: "doctor.notFound" }];
      const rows = [];
      const file = spec.configPath(ctx);
      let text;
      let readFailed = false;
      try {
        text = readText(file);
      } catch {
        readFailed = true;
      }
      if (readFailed) {
        rows.push({ id, check: "config", status: "fail", key: "doctor.unreadable", vars: { file } });
      } else if (text === null) {
        rows.push({ id, check: "config", status: "fail", key: "doctor.fileMissing", vars: { file } });
      } else {
        rows.push({ id, check: "config", status: "ok", key: "doctor.fileFound", vars: { file } });
        try {
          const found = readEntry(text, { format, path, name: SERVER_NAME });
          if (found === undefined) {
            rows.push({ id, check: "entry", status: "fail", key: "doctor.entryMissing" });
          } else if (sameValue(found, entry)) {
            rows.push({ id, check: "entry", status: "ok", key: "doctor.entryOk", vars: { url: oldUrl(entry) } });
          } else if (oldUrl(found) === oldUrl(entry)) {
            rows.push({ id, check: "entry", status: "fail", key: "doctor.entryDiffers" });
          } else {
            rows.push({ id, check: "entry", status: "fail", key: "doctor.entryWrong", vars: { url: oldUrl(found) } });
          }
        } catch (e) {
          if (!(e instanceof MergeError)) throw e;
          rows.push({ id, check: "entry", status: "fail", key: "doctor.unreadable", vars: { file } });
        }
      }
      if (bin) {
        const r = await ctx.exec(bin, ["--version"], { timeout: 5000 });
        if (r.code === 0) {
          const version = String(r.stdout).split(/\r?\n/)[0].trim();
          rows.push({ id, check: "version", status: "ok", key: "doctor.version", vars: { version } });
        } else {
          rows.push({ id, check: "version", status: "skip", key: "doctor.noBinary", vars: { bin } });
        }
      }
      return rows;
    },
  };
}
