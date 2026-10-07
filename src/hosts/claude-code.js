// Source: https://code.claude.com/docs/en/plugins/cli-reference (checked 2026-10-08)
// Source: https://code.claude.com/docs/en/mcp (checked 2026-10-08)
// Source: https://raw.githubusercontent.com/PLGN-App/PLGN-CLAUDE/main/.claude-plugin/marketplace.json (checked 2026-10-08)
// Docs: `claude plugin list --json` prints an array of { id: "<plugin>@<marketplace>", enabled, ... };
// marketplace.json names the marketplace "plgn" and the plugin "plgn", so the install is plgn@plgn;
// the plugin's server logs in with /mcp inside claude. The docs page does not show `marketplace add`; its
// form comes from the plan and needs the live check.
import fs from "node:fs";
import path from "node:path";
import { MARKETPLACE, PLUGIN, PLUGIN_ID } from "../constants.js";
import { t } from "../i18n.js";

const id = "claude-code";
const label = "Claude Code";
const bin = "claude";
const commands = [`claude plugin marketplace add ${MARKETPLACE}`, `claude plugin install ${PLUGIN_ID}`];

const detect = (ctx) => fs.existsSync(path.join(ctx.home, ".claude")) || Boolean(ctx.which(bin));

// "on", "off", "missing" or "unknown"; the read-only list is the only thing this runs.
async function pluginState(ctx) {
  const r = await ctx.exec(bin, ["plugin", "list", "--json"], { timeout: 15000 });
  if (r.code !== 0) return "unknown";
  const out = String(r.stdout);
  const start = out.indexOf("[");
  if (start < 0) return "unknown";
  let list;
  try {
    list = JSON.parse(out.slice(start));
  } catch {
    return "unknown";
  }
  if (!Array.isArray(list)) return "unknown";
  const found = list.find((p) => typeof p?.id === "string" && p.id.startsWith(`${PLUGIN}@`));
  if (!found) return "missing";
  return found.enabled === false ? "off" : "on";
}

const firstLine = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);

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
    return t(lang, "next.claudeCode");
  },

  async apply(ctx, { dryRun }) {
    if (!ctx.which(bin)) return { id, status: "manual", dryRun, commands };
    const state = await pluginState(ctx);
    if (state === "on" || state === "off") return { id, status: "same", dryRun };
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
