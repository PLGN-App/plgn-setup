// Source: https://docs.windsurf.com/windsurf/cascade/mcp (checked 2026-10-08)
// Source: https://docs.devin.ai/desktop/cascade/mcp (that page is where the Windsurf link now redirects)
// Docs: a remote server is { serverUrl } under mcpServers. The redirected page lists
// ~/.config/devin/mcp_config.json (Windows: %APPDATA%\devin\mcp_config.json) for the Devin app and does not
// mention Windsurf; v1 keeps the long-standing Windsurf file ~/.codeium/windsurf/mcp_config.json. Needs a live check:
// open follow-up H in docs/notes/2026-10-08-plgn-setup-follow-ups.md (owner ruling + Task 12 live check).
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

export default makeFileHost({
  id: "windsurf",
  label: "Windsurf",
  bin: "windsurf",
  format: "json",
  configPath: (ctx) => path.join(ctx.home, ".codeium", "windsurf", "mcp_config.json"),
  detectPaths: (ctx) => [path.join(ctx.home, ".codeium", "windsurf")],
  path: ["mcpServers"],
  entry: { serverUrl: MCP_URL },
  nextStep: (lang) => t(lang, "next.windsurf"),
});
