// Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md (checked 2026-10-08)
// Docs: user file ~/.gemini/settings.json (the docs name no variable that moves it); a remote server is
// { httpUrl, oauth: { enabled: true } } under mcpServers; sign-in is `/mcp auth plgn` typed inside gemini.
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

export default makeFileHost({
  id: "gemini",
  label: "Gemini CLI",
  bin: "gemini",
  format: "json",
  configPath: (ctx) => path.join(ctx.home, ".gemini", "settings.json"),
  detectPaths: (ctx) => [path.join(ctx.home, ".gemini")],
  path: ["mcpServers"],
  entry: { httpUrl: MCP_URL, oauth: { enabled: true } },
  nextStep: (lang) => t(lang, "next.typeInside", { label: "Gemini CLI", cmd: "/mcp auth plgn" }),
});
