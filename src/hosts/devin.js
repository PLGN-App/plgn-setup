// Source: https://docs.devin.ai/desktop/cascade/mcp (checked 2026-10-08)
// Docs: Windsurf is now the Devin app; its docs (the old docs.windsurf.com/windsurf/cascade/mcp link redirects
// here) name one file: ~/.config/devin/mcp_config.json ($XDG_CONFIG_HOME/devin on Linux, %APPDATA%\devin on
// Windows), with a remote server as { serverUrl } under mcpServers. Older installs still read
// ~/.codeium/windsurf/mcp_config.json. Setup writes the devin file; only when the old Windsurf file is the one
// that exists does it update that file instead, and it says so. Doctor reads whichever file is there.
// The `windsurf` binary name is the v1 fact; the Devin app's own command name is not in the docs.
import fs from "node:fs";
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

const FILE = "mcp_config.json";

// %APPDATA%\devin on Windows; $XDG_CONFIG_HOME/devin or ~/.config/devin elsewhere (macOS included).
export const devinDir = (ctx) =>
  ctx.platform === "win32"
    ? path.join(ctx.appData, "devin")
    : path.join(ctx.env.XDG_CONFIG_HOME || path.join(ctx.home, ".config"), "devin");
export const legacyDir = (ctx) => path.join(ctx.home, ".codeium", "windsurf");
export const devinFile = (ctx) => path.join(devinDir(ctx), FILE);
export const legacyFile = (ctx) => path.join(legacyDir(ctx), FILE);

// The devin file, unless only the old Windsurf file exists. Setup writes here and doctor reads here.
export function configPath(ctx) {
  const devin = devinFile(ctx);
  if (fs.existsSync(devin)) return devin;
  const legacy = legacyFile(ctx);
  return fs.existsSync(legacy) ? legacy : devin;
}

const host = makeFileHost({
  id: "devin",
  label: "Devin (formerly Windsurf)",
  bin: "windsurf",
  format: "json",
  configPath,
  detectPaths: (ctx) => [devinDir(ctx), legacyDir(ctx)],
  path: ["mcpServers"],
  entry: { serverUrl: MCP_URL },
  nextStep: (lang) => t(lang, "next.devin"),
});

export default {
  ...host,
  async apply(ctx, opts) {
    const r = await host.apply(ctx, opts);
    // The CLI prints this line after the result when the old Windsurf file was the one updated.
    if (r.file && r.file === legacyFile(ctx)) r.note = { key: "devin.oldPath", vars: { file: r.file } };
    return r;
  },
};
