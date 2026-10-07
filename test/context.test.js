import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeContext, which, runFile } from "../src/context.js";
import { tempHome } from "./helpers.js";

test("makeContext keeps the given home, platform and env", () => {
  const env = { PATH: "x", FOO: "bar" };
  const ctx = makeContext({ home: "/h", platform: "linux", env });
  assert.equal(ctx.home, "/h");
  assert.equal(ctx.platform, "linux");
  assert.equal(ctx.env, env);
  assert.equal(typeof ctx.exec, "function");
  assert.equal(typeof ctx.which, "function");
  assert.ok(ctx.now() instanceof Date);
});

test("makeContext without a home throws under node --test", () => {
  assert.ok(process.env.NODE_TEST_CONTEXT);
  assert.throws(() => makeContext(), /home/i);
  assert.throws(() => makeContext({ platform: "linux" }), /home/i);
});

test("makeContext without an env throws under node --test", () => {
  assert.throws(() => makeContext({ home: "/h" }), /env/i);
  assert.throws(() => makeContext({ home: "/h", platform: "linux" }), /env/i);
});

test("appData follows the platform", () => {
  const mk = (platform, env) => makeContext({ home: "/h", platform, env }).appData;
  assert.equal(mk("win32", { APPDATA: "C:\\Roam" }), "C:\\Roam");
  assert.equal(mk("win32", {}), path.join("/h", "AppData", "Roaming"));
  assert.equal(mk("darwin", {}), path.join("/h", "Library", "Application Support"));
  assert.equal(mk("linux", { XDG_CONFIG_HOME: "/xdg" }), "/xdg");
  assert.equal(mk("linux", {}), path.join("/h", ".config"));
});

test("which returns a fake binary on PATH and null when it is missing", () => {
  const w = tempHome({ platform: "win32" });
  const l = tempHome({ platform: "linux" });
  try {
    const wfile = w.addBin("claude");
    assert.equal(w.ctx.which("claude"), wfile);
    assert.ok(wfile.endsWith("claude.cmd"));
    assert.equal(w.ctx.which("codex"), null);
    const lfile = l.addBin("claude");
    assert.equal(l.ctx.which("claude"), lfile);
    assert.equal(l.ctx.which("codex"), null);
    assert.equal(which("claude", { platform: "linux", env: {} }), null);
  } finally {
    w.cleanup();
    l.cleanup();
  }
});

test("appData falls back when APPDATA is empty", () => {
  const ctx = makeContext({ home: "/h", platform: "win32", env: { APPDATA: "" } });
  assert.equal(ctx.appData, path.join("/h", "AppData", "Roaming"));
});

test("which skips a file without the execute bit outside Windows", { skip: process.platform === "win32" }, () => {
  const l = tempHome({ platform: "linux" });
  try {
    const file = l.addBin("codex");
    fs.chmodSync(file, 0o644);
    assert.equal(l.ctx.which("codex"), null);
    fs.chmodSync(file, 0o755);
    assert.equal(l.ctx.which("codex"), file);
  } finally {
    l.cleanup();
  }
});

test("ctx.exec of a missing binary gives code 127", async () => {
  const h = tempHome();
  try {
    const ctx = makeContext({ home: h.home, platform: process.platform, env: { PATH: h.binDir } });
    const r = await ctx.exec("no-such-tool", ["--version"]);
    assert.deepEqual(r, { code: 127, stdout: "", stderr: "not found" });
  } finally {
    h.cleanup();
  }
});

test("runFile refuses to run under node --test", () => {
  assert.throws(() => runFile(process.execPath, ["--version"]), /node --test|NODE_TEST_CONTEXT/);
});
