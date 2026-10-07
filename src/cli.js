import fs from "node:fs";
import { parseArgs } from "node:util";
import picocolors from "picocolors";
import { makeContext } from "./context.js";
import { HOST_IDS } from "./constants.js";
import { LANGS, t } from "./i18n.js";
import { runDoctor, renderTable } from "./doctor.js";
import { getHost, hosts } from "./hosts/index.js";

const OPTIONS = {
  yes: { type: "boolean", short: "y" },
  "dry-run": { type: "boolean" },
  lang: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
};

function readVersion() {
  const file = new URL("../package.json", import.meta.url);
  return JSON.parse(fs.readFileSync(file, "utf8")).version;
}

// The real multiselect; only the bin uses it. A cancel gives null.
async function clackPrompt(options, initialValues, lang) {
  const clack = await import("@clack/prompts");
  const picked = await clack.multiselect({ message: t(lang, "pick"), options, initialValues, required: false });
  return clack.isCancel(picked) ? null : picked;
}

export async function run(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const isTTY = io.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const color = io.color ?? picocolors.isColorSupported;
  const prompt = io.prompt ?? clackPrompt;
  const fetchFn = io.fetch ?? globalThis.fetch;
  const ctx = io.ctx ?? makeContext();
  const pc = picocolors.createColors(color);

  const out = (line = "") => stdout.write(`${line}\n`);
  const err = (line = "") => stderr.write(`${line}\n`);
  const hostList = HOST_IDS.join(", ");

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
    if (parsed.positionals.length > 1) throw new Error("Too many arguments");
  } catch (e) {
    err(t("en", "badArgs", { detail: String(e?.message ?? e).replace(/\.$/, "") }));
    return 2;
  }
  const { values, positionals } = parsed;
  const lang = values.lang ?? "en";
  if (!LANGS.includes(lang)) {
    err(t("en", "unknownLang", { lang: values.lang }));
    return 2;
  }
  if (values.help) {
    out(t(lang, "help", { hosts: hostList }));
    return 0;
  }
  if (values.version) {
    out(readVersion());
    return 0;
  }

  const name = positionals[0];
  const dryRun = Boolean(values["dry-run"]);

  if (name === "doctor") {
    const { rows, ok } = await runDoctor(ctx, { hosts, fetch: fetchFn });
    const labels = Object.fromEntries(hosts.map((h) => [h.id, h.label]));
    out(pc.bold(t(lang, "doctor.title")));
    out(renderTable(rows, { lang, color, labels }));
    return ok ? 0 : 1;
  }

  let chosen;
  if (name !== undefined) {
    const host = getHost(name);
    if (!host) {
      err(t(lang, "unknownHost", { name, hosts: hostList }));
      return 2;
    }
    chosen = [host];
  } else {
    const detected = hosts.filter((h) => h.detect(ctx));
    if (values.yes) {
      chosen = detected;
    } else if (!isTTY) {
      err(t(lang, "needYes", { hosts: hostList }));
      return 2;
    } else {
      const options = hosts.map((h) => {
        const option = { value: h.id, label: h.label };
        if (detected.includes(h)) option.hint = t(lang, "detected");
        return option;
      });
      const picked = await prompt(options, detected.map((h) => h.id), lang);
      if (!picked || picked.length === 0) {
        out(t(lang, "nothingChanged"));
        return 0;
      }
      chosen = hosts.filter((h) => picked.includes(h.id));
    }
  }

  out(t(lang, "intro"));
  if (chosen.length === 0) {
    out(t(lang, "noneFound", { hosts: hostList }));
    return 0;
  }

  const results = [];
  for (const host of chosen) {
    let result;
    try {
      result = await host.apply(ctx, { dryRun });
    } catch (e) {
      // One odd host never stops the others (Decision 4).
      result = { id: host.id, status: "error", dryRun, error: "IO", detail: String(e?.message ?? e) };
    }
    results.push({ host, result });
    report(host, result);
  }

  function report(host, result) {
    const vars = { label: host.label, file: result.file };
    const commands = result.commands ?? [];
    if (result.status === "manual") return; // only its next step, below
    if (result.status === "error") {
      if (result.error === "PARSE" || result.error === "SHAPE") {
        out(pc.red(t(lang, "notReadable", vars)));
        out(host.snippet());
      } else if (result.error === "UNSAFE") {
        out(pc.red(t(lang, "notSafe", vars)));
        out(host.snippet());
      } else if (result.error === "EXEC") {
        out(pc.red(t(lang, "failed", { ...vars, cmd: commands[commands.length - 1] ?? "", detail: result.detail ?? "" })));
      } else {
        out(pc.red(t(lang, "ioError", { ...vars, detail: result.detail ?? "" })));
      }
      return;
    }
    if (result.status === "same") {
      out(t(lang, "same", vars));
      return;
    }
    if (host.kind === "command") {
      for (const cmd of commands) out(t(lang, result.dryRun ? "wouldRun" : "ran", { ...vars, cmd }));
      return;
    }
    if (result.dryRun) {
      out(t(lang, result.status === "added" ? "wouldAdd" : "wouldUpdate", vars));
      out(host.snippet());
      return;
    }
    out(t(lang, result.status, vars));
    if (result.backup) out(t(lang, "backup", { file: result.backup }));
  }

  const forNext = results.filter(({ result }) => result.status !== "error");
  if (forNext.length > 0) {
    out();
    out(pc.bold(t(lang, "nextTitle")));
    for (const { host, result } of forNext) out(host.nextStep(lang, result));
  }
  if (dryRun) {
    out();
    out(t(lang, "dryRun"));
  }
  return results.some(({ result }) => result.status === "error") ? 1 : 0;
}
