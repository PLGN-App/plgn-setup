import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MCP_URL } from "../src/constants.js";
import { makeContext } from "../src/context.js";
import gemini from "../src/hosts/gemini.js";
import vscode from "../src/hosts/vscode.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { fakeExec, tempHome } from "./helpers.js";

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
// vscode keeps the address under "url" (entry: { type: "http", url }); the old-entry case uses the same key.
assert.equal(Object.hasOwn(vscode.entry, "url"), true);
mergeCases(vscode, {
  others: vscodeOthers,
  old: oldFor("url", "servers"),
  broken: '{ "servers": ',
});
detectCases(gemini, { dirs: [".gemini"], bin: "gemini" });
detectCases(vscode, { dirs: ["AppData/Roaming/Code/User"], bin: "code", platform: "win32" });

test("vscode configPath follows the platform", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-vscode-"));
  const ctx = (platform, env) => makeContext({ home, platform, env, exec: fakeExec(), now: () => new Date(0) });
  try {
    const cases = [
      // [platform, env, expected]
      ["win32", { APPDATA: path.join(home, "Roaming") }, path.join(home, "Roaming", "Code", "User", "mcp.json")],
      ["win32", {}, path.join(home, "AppData", "Roaming", "Code", "User", "mcp.json")],
      ["darwin", {}, path.join(home, "Library", "Application Support", "Code", "User", "mcp.json")],
      [
        "darwin",
        { XDG_CONFIG_HOME: path.join(home, "xdg") },
        path.join(home, "Library", "Application Support", "Code", "User", "mcp.json"),
      ],
      ["linux", { XDG_CONFIG_HOME: path.join(home, "xdg") }, path.join(home, "xdg", "Code", "User", "mcp.json")],
      ["linux", {}, path.join(home, ".config", "Code", "User", "mcp.json")],
    ];
    for (const [platform, env, expected] of cases) {
      assert.equal(vscode.configPath(ctx(platform, env)), expected, `${platform} ${JSON.stringify(env)}`);
    }
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
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

test("gemini doctor says entryDiffers when our address sits under httpUrl without oauth, or under url", async () => {
  for (const plgn of [{ httpUrl: MCP_URL }, { url: MCP_URL }]) {
    const h = tempHome();
    try {
      h.put(".gemini/settings.json", JSON.stringify({ mcpServers: { plgn } }));
      const rows = await gemini.doctor(h.ctx);
      const row = rows.find((r) => r.check === "entry");
      assert.equal(row.status, "fail", JSON.stringify(plgn));
      assert.equal(row.key, "doctor.entryDiffers", JSON.stringify(plgn));
    } finally {
      h.cleanup();
    }
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
  assert.ok(vscode.nextStep("en").includes("MCP: List Servers"));
  assert.ok(vscode.nextStep("ar").includes("MCP: List Servers"));
});
