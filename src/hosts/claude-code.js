// Source: https://code.claude.com/docs/en/plugins/cli-reference (checked 2026-10-08)
// Source: https://code.claude.com/docs/en/mcp (checked 2026-10-08)
// Source: https://raw.githubusercontent.com/PLGN-App/PLGN-CLAUDE/main/.claude-plugin/marketplace.json (checked 2026-10-08)
// Docs: `claude plugin list --json` prints an array of { id: "<plugin>@<marketplace>", enabled, ... };
// marketplace.json names the marketplace "plgn" and the plugin "plgn", so the install is plgn@plgn;
// the plugin's server logs in with /mcp inside claude. `claude plugin marketplace add <owner/repo>` is the
// documented form (a GitHub owner/repo source); adding a marketplace that is already there exits 0.
// `plugin list --json` also prints pseudo-ids (<name>@skills-dir, <name>@inline, <name>@synced) for local
// skills folders and the like; those are not the marketplace plugin and never count.
import fs from "node:fs";
import path from "node:path";
import { MARKETPLACE, PLUGIN, PLUGIN_ID } from "../constants.js";
import { t } from "../i18n.js";

const id = "claude-code";
const label = "Claude Code";
const bin = "claude";
const commands = [`claude plugin marketplace add ${MARKETPLACE}`, `claude plugin install ${PLUGIN_ID}`];

const detect = (ctx) => fs.existsSync(path.join(ctx.home, ".claude")) || Boolean(ctx.which(bin));

// plgn@plgn exactly, or plgn from another marketplace; never a pseudo-id.
const PSEUDO = /@(skills-dir|inline|synced)$/;
const isPlgn = (id) => id === PLUGIN_ID || (id.startsWith(`${PLUGIN}@`) && !PSEUDO.test(id));

// The plgn install that covers this person, read from the list: { state, entry }, state "on", "off", "missing"
// or "unknown"; entry is that install's row (its id, scope and version) when there is one.
async function pluginInstall(ctx) {
  const r = await ctx.exec(bin, ["plugin", "list", "--json"], { timeout: 15000 });
  if (r.code !== 0) return { state: "unknown" };
  const out = String(r.stdout);
  const start = out.indexOf("[");
  if (start < 0) return { state: "unknown" };
  let list;
  try {
    list = JSON.parse(out.slice(start));
  } catch {
    return { state: "unknown" };
  }
  if (!Array.isArray(list)) return { state: "unknown" };
  const mine = list.filter((p) => typeof p?.id === "string" && isPlgn(p.id));
  // Only installs that cover this person count: user-wide ones, or a project/local one for this folder.
  const here = path.resolve(ctx.cwd ?? process.cwd());
  const counts = (p) =>
    ["user", "managed", "synced"].includes(p.scope) ||
    (typeof p.projectPath === "string" && path.resolve(p.projectPath) === here) ||
    (p.scope === undefined && p.projectPath === undefined);
  const mineHere = mine.filter(counts);
  if (mineHere.length === 0) return { state: "missing" };
  const on = mineHere.find((p) => p.enabled !== false);
  return { state: on ? "on" : "off", entry: on ?? mineHere[0] };
}

// "on", "off", "missing" or "unknown"; the read-only list is the only thing this runs.
const pluginState = async (ctx) => (await pluginInstall(ctx)).state;

// Source: `claude plugin update --help` and `claude plugin marketplace --help` (checked 2026-10-10):
// `marketplace update [name]` refreshes a marketplace, `plugin update <plugin>` takes the latest version (restart
// required), `--scope` names a project or local install. An admin's managed install is never touched.
function updateCommands(entry) {
  const marketplace = entry.id.slice(entry.id.indexOf("@") + 1);
  const scope = ["project", "local"].includes(entry.scope) ? ` --scope ${entry.scope}` : "";
  return [`claude plugin marketplace update ${marketplace}`, `claude plugin update ${entry.id}${scope}`];
}

const firstLine = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);

// plgn is installed already: take its latest version (audit PL14). "updated" names both versions; "same" when
// the newest was already there or the install is an admin's.
async function update(ctx, entry, dryRun) {
  if (!entry || entry.scope === "managed") return { id, status: "same", dryRun };
  const cmds = updateCommands(entry);
  if (dryRun) return { id, status: "updated", dryRun, commands: cmds };
  // A failed marketplace refresh is ignored: the plugin update still takes what the marketplace already knows.
  await ctx.exec(bin, cmds[0].split(" ").slice(1), { timeout: 120000 });
  const r = await ctx.exec(bin, cmds[1].split(" ").slice(1), { timeout: 120000 });
  if (r.code !== 0) {
    const detail = firstLine(r.stderr) ?? firstLine(r.stdout) ?? `exit ${r.code}`;
    return { id, status: "error", dryRun, error: "EXEC", detail, commands: cmds };
  }
  const from = entry.version;
  const to = (await pluginInstall(ctx)).entry?.version;
  if (typeof from !== "string" || typeof to !== "string" || from === to) return { id, status: "same", dryRun };
  return { id, status: "updated", dryRun, commands: cmds, note: { key: "claudeCode.updated", vars: { from, to } } };
}

export default {
  id,
  label,
  kind: "command",
  bin,
  detect,
  configPath: () => null,
  snippet: () => commands.join("\n"),
  nextStep(lang, result) {
    if (result?.status === "manual") {
      return [t(lang, "next.claudeCodeManual"), ...(result.commands ?? commands).map((c) => `  ${c}`)].join("\n");
    }
    if (result?.status === "updated" && !result.dryRun) return t(lang, "next.claudeCodeRestart");
    return t(lang, "next.claudeCode", { cmd: "/mcp" });
  },

  async apply(ctx, { dryRun }) {
    if (!ctx.which(bin)) return { id, status: "manual", dryRun, commands };
    const { state, entry } = await pluginInstall(ctx);
    if (state === "on" || state === "off") return update(ctx, entry, dryRun);
    if (dryRun) return { id, status: "added", dryRun, commands };
    // A failed marketplace add is ignored: it may already be added, and the install says if it is not.
    await ctx.exec(bin, ["plugin", "marketplace", "add", MARKETPLACE], { timeout: 120000 });
    const r = await ctx.exec(bin, ["plugin", "install", PLUGIN_ID], { timeout: 120000 });
    if (r.code !== 0) {
      const detail = firstLine(r.stderr) ?? firstLine(r.stdout) ?? `exit ${r.code}`;
      return { id, status: "error", dryRun, error: "EXEC", detail, commands };
    }
    return { id, status: "added", dryRun, commands };
  },

  async doctor(ctx) {
    if (!detect(ctx)) return [{ id, check: "found", status: "skip", key: "doctor.notFound" }];
    if (!ctx.which(bin)) return [{ id, check: "version", status: "skip", key: "doctor.noBinary", vars: { bin } }];
    const rows = [];
    const v = await ctx.exec(bin, ["--version"], { timeout: 5000 });
    if (v.code === 0) {
      const version = String(v.stdout).split(/\r?\n/)[0].trim();
      rows.push({ id, check: "version", status: "ok", key: "doctor.version", vars: { version } });
    } else {
      rows.push({ id, check: "version", status: "skip", key: "doctor.noBinary", vars: { bin } });
    }
    const state = await pluginState(ctx);
    if (state === "on") rows.push({ id, check: "plugin", status: "ok", key: "doctor.pluginOk" });
    else if (state === "off") {
      rows.push({
        id,
        check: "plugin",
        status: "fail",
        key: "doctor.pluginOff",
        vars: { cmd: `claude plugin enable ${PLUGIN_ID}` },
      });
    } else if (state === "missing") rows.push({ id, check: "plugin", status: "fail", key: "doctor.pluginMissing" });
    else rows.push({ id, check: "plugin", status: "skip", key: "doctor.pluginUnknown" });
    return rows;
  },
};
