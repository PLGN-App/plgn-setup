import fs from "node:fs";
import { parseArgs } from "node:util";
import picocolors from "picocolors";
import { makeContext } from "./context.js";
import { HOST_IDS } from "./constants.js";
import { LANGS, t } from "./i18n.js";
import { runDoctor, renderTable } from "./doctor.js";
import { getHost, hosts } from "./hosts/index.js";
import { bundledSkills, installSkills, skillsDirFor } from "./skills.js";

const OPTIONS = {
  yes: { type: "boolean", short: "y" },
  "dry-run": { type: "boolean" },
  "no-skills": { type: "boolean" },
  lang: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
};

// How a person types this program; every phrase gets it as a {cmd} var, never spelled inside i18n.js.
const CMD = "npx plgn-setup";

// Colour only on a real terminal that supports it, and never when NO_COLOR is set (https://no-color.org).
export function colorDefault({ isTTY = Boolean(process.stdout.isTTY), env = process.env } = {}) {
  if (typeof env.NO_COLOR === "string" && env.NO_COLOR !== "") return false;
  return isTTY && picocolors.isColorSupported;
}

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

// The real yes/no question; only the bin uses it. A cancel gives null.
async function clackConfirm(message) {
  const clack = await import("@clack/prompts");
  const answer = await clack.confirm({ message });
  return clack.isCancel(answer) ? null : answer;
}

export async function run(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const isTTY = io.isTTY ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const color = io.color ?? colorDefault();
  const prompt = io.prompt ?? clackPrompt;
  const confirm = io.confirm ?? clackConfirm;
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
    err(t("en", "badArgs", { detail: String(e?.message ?? e).replace(/\.$/, ""), cmd: `${CMD} --help` }));
    return 2;
  }
  const { values, positionals } = parsed;
  const lang = values.lang ?? "en";
  if (!LANGS.includes(lang)) {
    err(t("en", "unknownLang", { lang: values.lang }));
    return 2;
  }
  if (values.help) {
    out(t(lang, "help", { hosts: hostList, cmd: CMD }));
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
    out(t(lang, "intro"));
    chosen = [host];
  } else {
    const detected = hosts.filter((h) => h.detect(ctx));
    if (!values.yes && !isTTY) {
      err(t(lang, "needYes", { hosts: hostList }));
      return 2;
    }
    out(t(lang, "intro"));
    if (values.yes) {
      chosen = detected;
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

  if (chosen.length === 0) {
    out(t(lang, "noneFound", { hosts: hostList, cmd: CMD }));
    return 0;
  }

  const results = [];
  let skillsFailed = false;
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
    await offerSkills(host, result);
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
    // A host may add one line of its own after the result (e.g. devin: the old Windsurf file was the one updated).
    const note = () => result.note && out(t(lang, result.note.key, { ...vars, ...result.note.vars }));
    if (result.status === "same") {
      out(t(lang, "same", vars));
      note();
      return;
    }
    if (host.kind === "command") {
      for (const cmd of commands) out(t(lang, result.dryRun ? "wouldRun" : "ran", { ...vars, cmd }));
      return;
    }
    if (result.dryRun) {
      out(t(lang, result.status === "added" ? "wouldAdd" : "wouldUpdate", vars));
      note();
      out(host.snippet());
      return;
    }
    out(t(lang, result.status, vars));
    note();
    if (result.backup) out(t(lang, "backup", { file: result.backup }));
  }

  // The skills step (Decisions 8-9): plan first, then ask only when something would be written.
  async function offerSkills(host, result) {
    if (values["no-skills"] || result.status === "error" || result.status === "manual") return;
    if (!skillsDirFor(host.id, ctx) || bundledSkills().skills.length === 0) return;
    const count = bundledSkills().skills.length;
    const vars = { label: host.label, count, cmd: `${CMD} ${host.id}` };
    try {
      const plan = installSkills(ctx, host.id, { dryRun: true });
      vars.dir = plan.dir;
      const todo = [...plan.copied, ...plan.replaced];
      if (todo.length === 0) {
        out(t(lang, "skills.same", vars));
        return;
      }
      if (dryRun) {
        out(t(lang, "skills.would", { ...vars, count: todo.length }));
        out(`  ${[...todo].sort().join(", ")}`);
        return;
      }
      const yes = values.yes ? true : isTTY ? await confirm(t(lang, "skills.ask", vars), lang) : false;
      if (!yes) {
        out(t(lang, "skills.skipped", vars));
        return;
      }
      const done = installSkills(ctx, host.id);
      out(t(lang, "skills.done", { ...vars, copied: done.copied.length, replaced: done.replaced.length }));
    } catch (e) {
      // Only a real file-system error (a string code AND a syscall) is a result; anything else is a bug and throws.
      if (typeof e?.code === "string" && typeof e?.syscall === "string") {
        out(pc.red(t(lang, "skills.error", { ...vars, detail: String(e?.message ?? e) })));
        skillsFailed = true;
        return;
      }
      throw e;
    }
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
  return skillsFailed || results.some(({ result }) => result.status === "error") ? 1 : 0;
}
