// Source: https://cursor.com/docs/context/mcp (checked 2026-10-08)
// Docs: the global file is ~/.cursor/mcp.json on every platform; a remote server is { url };
// OAuth is handled by Cursor itself (no client id needed for a server that registers clients).
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

export default makeFileHost({
  id: "cursor",
  label: "Cursor",
  bin: "cursor",
  format: "json",
  configPath: (ctx) => path.join(ctx.home, ".cursor", "mcp.json"),
  detectPaths: (ctx) => [path.join(ctx.home, ".cursor")],
  path: ["mcpServers"],
  entry: { url: MCP_URL },
  nextStep: (lang) => t(lang, "next.cursor"),
});
