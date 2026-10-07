import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { MCP_URL } from "../src/constants.js";
import cursor from "../src/hosts/cursor.js";
import devin, { devinFile, legacyFile } from "../src/hosts/devin.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { tempHome } from "./helpers.js";

const othersFor = (name) =>
  JSON.stringify({ theme: "dark", mcpServers: { docs: { command: "npx", args: ["x"] } } }, null, 2) + "\n";
const oldFor = (key) =>
  JSON.stringify({ mcpServers: { plgn: { [key]: "https://old.example/mcp" } } }, null, 2) + "\n";
const LEGACY = ".codeium/windsurf/mcp_config.json";
const rel = (h, file) => path.relative(h.home, file);

mergeCases(cursor, { others: othersFor("cursor"), old: oldFor("url"), broken: '{ "mcpServers": ' });
mergeCases(devin, { others: othersFor("devin"), old: oldFor("serverUrl"), broken: '{ "mcpServers": ' });
detectCases(cursor, { dirs: [".cursor"], bin: "cursor" });
detectCases(devin, { dirs: [".codeium/windsurf", "AppData/Roaming/devin"], bin: "windsurf", platform: "win32" });
detectCases(devin, { dirs: [".codeium/windsurf", ".config/devin"], bin: "windsurf", platform: "linux" });

test("cursor configPath sits under the home on every platform", () => {
  for (const platform of ["win32", "darwin", "linux"]) {
    const h = tempHome({ platform });
    try {
      assert.equal(cursor.configPath(h.ctx), path.join(h.home, ".cursor", "mcp.json"), platform);
    } finally {
      h.cleanup();
    }
  }
});

test("devin configPath is the devin file per platform when nothing exists yet", () => {
  const expected = {
    win32: (h) => path.join(h.home, "AppData", "Roaming", "devin", "mcp_config.json"),
    darwin: (h) => path.join(h.home, ".config", "devin", "mcp_config.json"),
    linux: (h) => path.join(h.home, ".config", "devin", "mcp_config.json"),
  };
  for (const platform of ["win32", "darwin", "linux"]) {
    const h = tempHome({ platform });
    try {
      assert.equal(devin.configPath(h.ctx), expected[platform](h), platform);
      assert.equal(devin.configPath(h.ctx), devinFile(h.ctx), platform);
      assert.equal(legacyFile(h.ctx), path.join(h.home, ".codeium", "windsurf", "mcp_config.json"), platform);
    } finally {
      h.cleanup();
    }
  }
  // XDG_CONFIG_HOME moves the devin folder on Linux.
  const lin = tempHome({ platform: "linux" });
  try {
    lin.ctx.env.XDG_CONFIG_HOME = path.join(lin.home, "xdg");
    assert.equal(devin.configPath(lin.ctx), path.join(lin.home, "xdg", "devin", "mcp_config.json"));
  } finally {
    lin.cleanup();
  }
});

test("devin configPath prefers the devin file, falls back to the old Windsurf file only when it alone exists", () => {
  const h = tempHome();
  try {
    h.put(LEGACY, "{}\n");
    assert.equal(devin.configPath(h.ctx), legacyFile(h.ctx));
    h.put(rel(h, devinFile(h.ctx)), "{}\n");
    assert.equal(devin.configPath(h.ctx), devinFile(h.ctx));
  } finally {
    h.cleanup();
  }
});

test("devin apply writes the devin file by default, with no note", async () => {
  const h = tempHome();
  try {
    const r = await devin.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.equal(r.file, devinFile(h.ctx));
    assert.equal(r.note, undefined);
    assert.ok(h.get(rel(h, devinFile(h.ctx))).includes(MCP_URL));
    assert.equal(h.exists(LEGACY), false);
  } finally {
    h.cleanup();
  }
});

test("devin apply updates the old Windsurf file when it is the only one, and says so", async () => {
  const h = tempHome();
  try {
    h.put(LEGACY, othersFor("devin"));
    const dry = await devin.apply(h.ctx, { dryRun: true });
    assert.equal(dry.status, "added");
    assert.equal(dry.file, legacyFile(h.ctx));
    assert.deepEqual(dry.note, { key: "devin.oldPath", vars: { file: legacyFile(h.ctx) } });
    assert.equal(h.get(LEGACY), othersFor("devin"));
    const r = await devin.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.equal(r.file, legacyFile(h.ctx));
    assert.deepEqual(r.note, { key: "devin.oldPath", vars: { file: legacyFile(h.ctx) } });
    assert.ok(h.get(LEGACY).includes(MCP_URL));
    assert.equal(h.exists(rel(h, devinFile(h.ctx))), false);
    assert.ok(r.backup && r.backup.includes(".plgn-backup-"));
  } finally {
    h.cleanup();
  }
});

test("devin doctor reads whichever file is there, and the devin file when both are", async () => {
  const entryRow = async (h) => (await devin.doctor(h.ctx)).find((r) => r.check === "entry");
  const configRow = async (h) => (await devin.doctor(h.ctx)).find((r) => r.check === "config");
  const h = tempHome();
  try {
    // Old folder only, no file: red, naming the devin path it would write.
    h.put(".codeium/windsurf/.keep", "");
    let config = await configRow(h);
    assert.equal(config.key, "doctor.fileMissing");
    assert.equal(config.vars.file, devinFile(h.ctx));
    // Old file with plgn: green on that file.
    h.put(LEGACY, devin.merge(null).text);
    config = await configRow(h);
    assert.equal(config.key, "doctor.fileFound");
    assert.equal(config.vars.file, legacyFile(h.ctx));
    assert.equal((await entryRow(h)).status, "ok");
    // Devin file without plgn beside it: the devin file wins and is red.
    h.put(rel(h, devinFile(h.ctx)), "{}\n");
    config = await configRow(h);
    assert.equal(config.vars.file, devinFile(h.ctx));
    assert.equal((await entryRow(h)).key, "doctor.entryMissing");
  } finally {
    h.cleanup();
  }
  const d = tempHome();
  try {
    d.put(rel(d, devinFile(d.ctx)), devin.merge(null).text);
    assert.equal((await entryRow(d)).status, "ok");
    assert.equal((await configRow(d)).vars.file, devinFile(d.ctx));
  } finally {
    d.cleanup();
  }
});

test("cursor and devin nextStep have English and Arabic text", () => {
  for (const host of [cursor, devin]) {
    const en = host.nextStep("en");
    const ar = host.nextStep("ar");
    assert.ok(en.startsWith(host.label), host.id);
    assert.ok(ar.startsWith(host.label), host.id);
    assert.notEqual(en, ar, host.id);
    assert.ok(/[؀-ۿ]/.test(ar), host.id);
  }
  assert.equal(devin.id, "devin");
  assert.equal(devin.label, "Devin (formerly Windsurf)");
});
