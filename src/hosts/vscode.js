// Source: https://code.visualstudio.com/docs/copilot/customization/mcp-servers (checked 2026-10-08)
// Docs: the user-profile mcp.json (command "MCP: Open User Configuration") holds { servers: { name: { type: "http", url } } }.
// The page gives no per-platform path and no sign-in steps; v1 uses <appData>/Code/User/mcp.json (stable VS Code, default profile).
// The "MCP: List Servers" start step in next.vscode is from the planner and needs a live check.
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

const userDir = (ctx) => path.join(ctx.appData, "Code", "User");

export default makeFileHost({
  id: "vscode",
  label: "VS Code",
  bin: "code",
  format: "json",
  configPath: (ctx) => path.join(userDir(ctx), "mcp.json"),
  detectPaths: (ctx) => [userDir(ctx)],
  path: ["servers"],
  entry: { type: "http", url: MCP_URL },
  nextStep: (lang) => t(lang, "next.vscode", { cmd: "MCP: List Servers" }),
});
