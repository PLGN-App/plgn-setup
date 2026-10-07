import claudeCode from "./claude-code.js";
import claudeDesktop from "./claude-desktop.js";
import codex from "./codex.js";
import cursor from "./cursor.js";
import gemini from "./gemini.js";
import vscode from "./vscode.js";
import windsurf from "./windsurf.js";

// HOST_IDS order.
export const hosts = [claudeCode, codex, cursor, gemini, windsurf, vscode, claudeDesktop];

export function getHost(id) {
  return hosts.find((h) => h.id === id);
}
