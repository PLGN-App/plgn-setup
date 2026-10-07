import test from "node:test";
import assert from "node:assert/strict";
import { MCP_URL } from "../src/constants.js";
import claudeDesktop from "../src/hosts/claude-desktop.js";
import { detectCases } from "./host-cases.js";
import { tempHome } from "./helpers.js";

detectCases(claudeDesktop, { dirs: ["AppData/Roaming/Claude"], bin: null, platform: "win32" });

test("claude-desktop apply is manual and writes no file", async () => {
  for (const dryRun of [true, false]) {
    const h = tempHome({ platform: "win32" });
    try {
      h.put("AppData/Roaming/Claude/.keep", "");
      const before = h.files();
      const r = await claudeDesktop.apply(h.ctx, { dryRun });
      assert.deepEqual(r, { id: "claude-desktop", status: "manual", dryRun });
      assert.deepEqual(h.files(), before);
      assert.equal(h.ctx.exec.calls.length, 0);
    } finally {
      h.cleanup();
    }
  }
});

test("claude-desktop detect follows the platform and is never true on linux", () => {
  const h = tempHome({ platform: "darwin" });
  try {
    h.put("Library/Application Support/Claude/.keep", "");
    assert.equal(claudeDesktop.detect(h.ctx), true);
  } finally {
    h.cleanup();
  }
  const l = tempHome({ platform: "linux" });
  try {
    l.put(".config/Claude/.keep", "");
    l.put("AppData/Roaming/Claude/.keep", "");
    assert.equal(claudeDesktop.detect(l.ctx), false);
  } finally {
    l.cleanup();
  }
});

test("claude-desktop doctor never gives a red row", async () => {
  const none = tempHome({ platform: "win32" });
  try {
    const rows = await claudeDesktop.doctor(none.ctx);
    assert.deepEqual(rows.map((r) => [r.status, r.key]), [["skip", "doctor.notFound"]]);
  } finally {
    none.cleanup();
  }
  const h = tempHome({ platform: "win32" });
  try {
    h.put("AppData/Roaming/Claude/.keep", "");
    const rows = await claudeDesktop.doctor(h.ctx);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].check, "manual");
    assert.equal(rows[0].status, "skip");
    assert.equal(rows[0].key, "doctor.checkByHand");
    assert.ok(rows.every((r) => r.status !== "fail"));
  } finally {
    h.cleanup();
  }
});

test("claude-desktop nextStep holds the MCP URL in English and Arabic", () => {
  for (const lang of ["en", "ar"]) {
    assert.ok(claudeDesktop.nextStep(lang).includes(MCP_URL), lang);
  }
  assert.equal(claudeDesktop.snippet(), MCP_URL);
  assert.equal(claudeDesktop.configPath(), null);
});
