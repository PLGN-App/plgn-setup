// Source: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp (checked 2026-10-08)
// Docs: a remote connector is added in the app (Customize, Connectors, Add custom connector: name, then the
// server URL) and is brokered through the person's Claude account, so there is no local file to merge into.
// The article gives no folder; the app's own folder is <appData>/Claude on Windows and macOS (used only to
// detect it). The docs name no Microsoft Store folder, so none is checked.
import fs from "node:fs";
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";

const id = "claude-desktop";
const label = "Claude Desktop";

const detect = (ctx) =>
  (ctx.platform === "win32" || ctx.platform === "darwin") && fs.existsSync(path.join(ctx.appData, "Claude"));

export default {
  id,
  label,
  kind: "manual",
  bin: null,
  detect,
  configPath: () => null,
  snippet: () => MCP_URL,
  nextStep: (lang) => t(lang, "next.claudeDesktop", { url: MCP_URL }),

  async apply(ctx, { dryRun }) {
    return { id, status: "manual", dryRun };
  },

  async doctor(ctx) {
    if (!detect(ctx)) return [{ id, check: "found", status: "skip", key: "doctor.notFound" }];
    return [{ id, check: "manual", status: "skip", key: "doctor.checkByHand" }];
  },
};
