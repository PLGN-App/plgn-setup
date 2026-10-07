import { HOST_ALIASES } from "../constants.js";
import claudeCode from "./claude-code.js";
import claudeDesktop from "./claude-desktop.js";
import codex from "./codex.js";
import cursor from "./cursor.js";
import devin from "./devin.js";
import gemini from "./gemini.js";
import vscode from "./vscode.js";

// HOST_IDS order.
export const hosts = [claudeCode, codex, cursor, gemini, devin, vscode, claudeDesktop];

export function getHost(id) {
  const real = HOST_ALIASES[id] ?? id;
  return hosts.find((h) => h.id === real);
}
