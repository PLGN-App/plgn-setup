// Source: https://learn.chatgpt.com/docs/extend/mcp?surface=cli (checked 2026-10-08)
// Docs: config.toml lives in CODEX_HOME (default ~/.codex); [mcp_servers.<name>] with url;
// login is `codex mcp login <name>`; OAuth uses dynamic client registration, so no extra table or flag.
import path from "node:path";
import { MCP_URL } from "../constants.js";
import { t } from "../i18n.js";
import { makeFileHost } from "./file-host.js";

const codexHome = (ctx) => ctx.env.CODEX_HOME || path.join(ctx.home, ".codex");

export default makeFileHost({
  id: "codex",
  label: "Codex CLI",
  bin: "codex",
  format: "toml",
  configPath: (ctx) => path.join(codexHome(ctx), "config.toml"),
  detectPaths: (ctx) => [codexHome(ctx)],
  path: ["mcp_servers"],
  entry: { url: MCP_URL },
  nextStep: (lang) => t(lang, "next.runCommand", { label: "Codex CLI", cmd: "codex mcp login plgn" }),
});
