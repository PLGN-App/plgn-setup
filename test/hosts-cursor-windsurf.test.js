import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import cursor from "../src/hosts/cursor.js";
import windsurf from "../src/hosts/windsurf.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { tempHome } from "./helpers.js";

const othersFor = (name) =>
  JSON.stringify({ theme: "dark", mcpServers: { docs: { command: "npx", args: ["x"] } } }, null, 2) + "\n";
const oldFor = (key) =>
  JSON.stringify({ mcpServers: { plgn: { [key]: "https://old.example/mcp" } } }, null, 2) + "\n";

mergeCases(cursor, { others: othersFor("cursor"), old: oldFor("url"), broken: '{ "mcpServers": ' });
mergeCases(windsurf, { others: othersFor("windsurf"), old: oldFor("serverUrl"), broken: '{ "mcpServers": ' });
detectCases(cursor, { dirs: [".cursor"], bin: "cursor" });
detectCases(windsurf, { dirs: [".codeium/windsurf"], bin: "windsurf" });

test("cursor and windsurf configPath sit under the home on every platform", () => {
  for (const platform of ["win32", "darwin", "linux"]) {
    const h = tempHome({ platform });
    try {
      assert.equal(cursor.configPath(h.ctx), path.join(h.home, ".cursor", "mcp.json"), platform);
      assert.equal(
        windsurf.configPath(h.ctx),
        path.join(h.home, ".codeium", "windsurf", "mcp_config.json"),
        platform,
      );
    } finally {
      h.cleanup();
    }
  }
});

test("cursor and windsurf nextStep have English and Arabic text", () => {
  for (const host of [cursor, windsurf]) {
    const en = host.nextStep("en");
    const ar = host.nextStep("ar");
    assert.ok(en.startsWith(host.label), host.id);
    assert.ok(ar.startsWith(host.label), host.id);
    assert.notEqual(en, ar, host.id);
    assert.ok(/[؀-ۿ]/.test(ar), host.id);
  }
});
