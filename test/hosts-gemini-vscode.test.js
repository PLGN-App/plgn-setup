import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MCP_URL } from "../src/constants.js";
import gemini from "../src/hosts/gemini.js";
import vscode from "../src/hosts/vscode.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { tempHome } from "./helpers.js";

const geminiOthers =
  JSON.stringify({ theme: "Default", mcpServers: { docs: { command: "npx" } } }, null, 2) + "\n";
const vscodeOthers =
  JSON.stringify({ servers: { docs: { type: "stdio", command: "npx" } }, inputs: [] }, null, 2) + "\n";
const oldFor = (key, top) =>
  JSON.stringify({ [top]: { plgn: { [key]: "https://old.example/mcp" } } }, null, 2) + "\n";

mergeCases(gemini, {
  others: geminiOthers,
  old: oldFor("httpUrl", "mcpServers"),
  broken: '{ "mcpServers": ',
});
mergeCases(vscode, {
  others: vscodeOthers,
  old: oldFor("url", "servers"),
  broken: '{ "servers": ',
});
detectCases(gemini, { dirs: [".gemini"], bin: "gemini" });
detectCases(vscode, { dirs: ["AppData/Roaming/Code/User"], bin: "code", platform: "win32" });

test("vscode configPath follows the platform", () => {
  const win = tempHome({ platform: "win32" });
  const mac = tempHome({ platform: "darwin" });
  const lin = tempHome({ platform: "linux" });
  try {
    assert.equal(vscode.configPath(win.ctx), path.join(win.ctx.appData, "Code", "User", "mcp.json"));
    assert.ok(win.ctx.appData.includes(path.join("AppData", "Roaming")) || win.ctx.env.APPDATA);
    assert.equal(
      vscode.configPath(mac.ctx),
      path.join(mac.home, "Library", "Application Support", "Code", "User", "mcp.json"),
    );
    assert.equal(vscode.configPath(lin.ctx), path.join(lin.ctx.appData, "Code", "User", "mcp.json"));
    lin.ctx.env.XDG_CONFIG_HOME = path.join(lin.home, "xdg");
    assert.equal(
      vscode.configPath({ ...lin.ctx, appData: lin.ctx.env.XDG_CONFIG_HOME }),
      path.join(lin.home, "xdg", "Code", "User", "mcp.json"),
    );
  } finally {
    win.cleanup();
    mac.cleanup();
    lin.cleanup();
  }
});

test("gemini settings with comments are left alone", async () => {
  const h = tempHome();
  try {
    const text = '{\n  // my theme\n  "theme": "Default"\n}\n';
    h.put(".gemini/settings.json", text);
    const r = await gemini.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "error");
    assert.equal(r.error, "PARSE");
    assert.equal(fs.readFileSync(gemini.configPath(h.ctx), "utf8"), text);
  } finally {
    h.cleanup();
  }
});

test("gemini doctor says entryDiffers for a url-only plgn entry", async () => {
  const h = tempHome();
  try {
    h.put(".gemini/settings.json", JSON.stringify({ mcpServers: { plgn: { httpUrl: MCP_URL } } }));
    const rows = await gemini.doctor(h.ctx);
    const row = rows.find((r) => r.check === "entry");
    assert.equal(row.status, "fail");
    assert.equal(row.key, "doctor.entryDiffers");
  } finally {
    h.cleanup();
  }
});

test("gemini and vscode nextStep have English and Arabic text", () => {
  for (const host of [gemini, vscode]) {
    const en = host.nextStep("en");
    const ar = host.nextStep("ar");
    assert.ok(en.startsWith(host.label), host.id);
    assert.ok(ar.startsWith(host.label), host.id);
    assert.notEqual(en, ar, host.id);
    assert.ok(/[؀-ۿ]/.test(ar), host.id);
  }
  assert.ok(gemini.nextStep("en").includes("/mcp auth plgn"));
  assert.ok(gemini.nextStep("ar").includes("/mcp auth plgn"));
});
