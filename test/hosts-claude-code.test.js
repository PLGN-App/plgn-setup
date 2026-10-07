import test from "node:test";
import assert from "node:assert/strict";
import { MARKETPLACE, PLUGIN_ID } from "../src/constants.js";
import claudeCode from "../src/hosts/claude-code.js";
import { detectCases } from "./host-cases.js";
import { fakeExec, tempHome } from "./helpers.js";

const LIST = "claude plugin list --json";
const ADD = `claude plugin marketplace add ${MARKETPLACE}`;
const INSTALL = `claude plugin install ${PLUGIN_ID}`;
const ok = (stdout = "") => ({ code: 0, stdout, stderr: "" });
const listOf = (...entries) => ok(JSON.stringify(entries));
const keyOf = (c) => [c.name, ...c.args].join(" ");

// A home where claude is on PATH and the fake exec answers as given.
function withClaude(answers) {
  const h = tempHome();
  h.addBin("claude");
  h.ctx.exec = fakeExec(answers);
  return h;
}

detectCases(claudeCode, { dirs: [".claude"], bin: "claude" });

test("claude-code runs marketplace add then install plgn@plgn when claude is on PATH", async () => {
  const h = withClaude({ [LIST]: ok("[]") });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.equal(r.dryRun, false);
    assert.deepEqual(h.ctx.exec.calls.map(keyOf), [LIST, ADD, INSTALL]);
    assert.deepEqual(r.commands, [`claude plugin marketplace add ${MARKETPLACE}`, "claude plugin install plgn@plgn"]);
  } finally {
    h.cleanup();
  }
});

test("claude-code is same and runs only the list when plgn is already installed", async () => {
  for (const enabled of [true, false]) {
    const h = withClaude({ [LIST]: listOf({ id: "plgn@plgn", enabled }) });
    try {
      const r = await claudeCode.apply(h.ctx, { dryRun: false });
      assert.equal(r.status, "same");
      assert.deepEqual(h.ctx.exec.calls.map(keyOf), [LIST]);
    } finally {
      h.cleanup();
    }
  }
});

test("claude-code looks at every plgn entry and its scope", async () => {
  const mixed = listOf(
    { id: "plgn@plgn", scope: "local", projectPath: "/other", enabled: false },
    { id: "plgn@plgn", scope: "user", enabled: true },
  );
  const h = withClaude({ [LIST]: mixed, "claude --version": ok("2.1.300") });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "same");
    assert.deepEqual(h.ctx.exec.calls.map(keyOf), [LIST]);
    const row = (await claudeCode.doctor(h.ctx)).find((x) => x.check === "plugin");
    assert.equal(row.status, "ok");
  } finally {
    h.cleanup();
  }
  const other = listOf({ id: "plgn@plgn", scope: "project", projectPath: "/some/other/project", enabled: true });
  const h2 = withClaude({ [LIST]: other, "claude --version": ok("2.1.300") });
  try {
    const r = await claudeCode.apply(h2.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.deepEqual(h2.ctx.exec.calls.map(keyOf), [LIST, ADD, INSTALL]);
    const row = (await claudeCode.doctor(h2.ctx)).find((x) => x.check === "plugin");
    assert.equal(row.key, "doctor.pluginMissing");
  } finally {
    h2.cleanup();
  }
});

test("claude-code dry run never adds or installs and lists both commands", async () => {
  const h = withClaude({ [LIST]: ok("[]") });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: true });
    assert.equal(r.status, "added");
    assert.equal(r.dryRun, true);
    assert.equal(r.commands.length, 2);
    assert.ok(r.commands[0].includes("marketplace add"));
    assert.ok(r.commands[1].includes("plgn@plgn"));
    assert.deepEqual(h.ctx.exec.calls.map(keyOf), [LIST]);
  } finally {
    h.cleanup();
  }
});

test("claude-code without claude on PATH is manual and nextStep holds both lines", async () => {
  const h = tempHome();
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "manual");
    assert.equal(r.commands.length, 2);
    assert.equal(h.ctx.exec.calls.length, 0);
    for (const lang of ["en", "ar"]) {
      const text = claudeCode.nextStep(lang, r);
      for (const cmd of r.commands) assert.ok(text.split("\n").includes(`  ${cmd}`), `${lang}: ${cmd}`);
    }
    assert.ok(claudeCode.nextStep("en", r).includes("not on PATH"));
    assert.equal(claudeCode.snippet(), r.commands.join("\n"));
  } finally {
    h.cleanup();
  }
});

test("claude-code reports EXEC with the first stderr line when the install fails", async () => {
  const h = withClaude({
    [LIST]: ok("[]"),
    [INSTALL]: { code: 1, stdout: "", stderr: "\nplugin not found in marketplace\nmore detail\n" },
  });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "error");
    assert.equal(r.error, "EXEC");
    assert.equal(r.detail, "plugin not found in marketplace");
  } finally {
    h.cleanup();
  }
  const h2 = withClaude({ [LIST]: ok("[]"), [INSTALL]: { code: 3, stdout: "", stderr: "" } });
  try {
    const r = await claudeCode.apply(h2.ctx, { dryRun: false });
    assert.equal(r.detail, "exit 3");
  } finally {
    h2.cleanup();
  }
});

test("claude-code ignores a failed marketplace add when the install works", async () => {
  const h = withClaude({
    [LIST]: ok("[]"),
    [ADD]: { code: 1, stdout: "", stderr: "already added" },
  });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.deepEqual(h.ctx.exec.calls.map(keyOf), [LIST, ADD, INSTALL]);
  } finally {
    h.cleanup();
  }
});

test("claude-code doctor plugin row: ok when on, red when missing or off, skip when the list fails", async () => {
  const cases = [
    [listOf({ id: "plgn@plgn", enabled: true }), "ok", "doctor.pluginOk"],
    [listOf({ id: "plgn@other", enabled: true }), "ok", "doctor.pluginOk"],
    [listOf({ id: "plgn@plgn", enabled: false }), "fail", "doctor.pluginOff"],
    [listOf({ id: "docs@plgn", enabled: true }), "fail", "doctor.pluginMissing"],
    [ok("[]"), "fail", "doctor.pluginMissing"],
    [{ code: 1, stdout: "", stderr: "unknown option" }, "skip", "doctor.pluginUnknown"],
    [ok("not json at all"), "skip", "doctor.pluginUnknown"],
  ];
  for (const [answer, status, key] of cases) {
    const h = withClaude({ [LIST]: answer, "claude --version": ok("2.1.300 (Claude Code)\n") });
    try {
      const rows = await claudeCode.doctor(h.ctx);
      const row = rows.find((r) => r.check === "plugin");
      assert.equal(row.status, status, key);
      assert.equal(row.key, key);
      if (key === "doctor.pluginOff") assert.equal(row.vars.cmd, "claude plugin enable plgn@plgn");
      const version = rows.find((r) => r.check === "version");
      assert.equal(version.status, "ok");
      assert.equal(version.vars.version, "2.1.300 (Claude Code)");
    } finally {
      h.cleanup();
    }
  }
});

test("claude-code doctor says notFound or noBinary when there is nothing to check", async () => {
  const empty = tempHome();
  try {
    const rows = await claudeCode.doctor(empty.ctx);
    assert.deepEqual(rows.map((r) => [r.check, r.status, r.key]), [["found", "skip", "doctor.notFound"]]);
  } finally {
    empty.cleanup();
  }
  const folderOnly = tempHome();
  try {
    folderOnly.put(".claude/.keep", "");
    const rows = await claudeCode.doctor(folderOnly.ctx);
    assert.deepEqual(rows.map((r) => [r.status, r.key]), [["skip", "doctor.noBinary"]]);
    assert.equal(rows[0].vars.bin, "claude");
  } finally {
    folderOnly.cleanup();
  }
});

test("claude-code doctor never runs add or install", async () => {
  const h = withClaude({ [LIST]: ok("[]") });
  try {
    await claudeCode.doctor(h.ctx);
    const keys = h.ctx.exec.calls.map(keyOf);
    assert.ok(keys.length > 0);
    assert.ok(keys.every((k) => k === LIST || k === "claude --version"), keys.join(" | "));
  } finally {
    h.cleanup();
  }
});

test("claude-code nextStep has English and Arabic text", () => {
  const en = claudeCode.nextStep("en");
  const ar = claudeCode.nextStep("ar");
  assert.ok(en.startsWith(claudeCode.label));
  assert.ok(ar.startsWith(claudeCode.label));
  assert.notEqual(en, ar);
  assert.ok(/[؀-ۿ]/.test(ar));
  assert.ok(en.includes("/mcp") && ar.includes("/mcp"));
  assert.equal(claudeCode.kind, "command");
  assert.equal(claudeCode.configPath({}), null);
});

test("claude-code ignores pseudo-ids (@skills-dir, @inline, @synced) and counts only the real plugin", async () => {
  const pseudoOnly = listOf(
    { id: "plgn@skills-dir", enabled: true, scope: "user" },
    { id: "plgn@inline", enabled: true, scope: "user" },
    { id: "plgn@synced", enabled: true, scope: "synced" },
  );
  const h = withClaude({ [LIST]: pseudoOnly, "claude --version": ok("2.1.300") });
  try {
    const r = await claudeCode.apply(h.ctx, { dryRun: true });
    assert.equal(r.status, "added");
    const row = (await claudeCode.doctor(h.ctx)).find((x) => x.check === "plugin");
    assert.equal(row.key, "doctor.pluginMissing");
  } finally {
    h.cleanup();
  }
  const withReal = listOf(
    { id: "plgn@skills-dir", enabled: true, scope: "user" },
    { id: "plgn@plgn", enabled: true, scope: "user" },
  );
  const h2 = withClaude({ [LIST]: withReal, "claude --version": ok("2.1.300") });
  try {
    const r = await claudeCode.apply(h2.ctx, { dryRun: true });
    assert.equal(r.status, "same");
    const row = (await claudeCode.doctor(h2.ctx)).find((x) => x.check === "plugin");
    assert.equal(row.key, "doctor.pluginOk");
  } finally {
    h2.cleanup();
  }
  // A real plgn@plgn install for another project does not count, even next to a user-wide pseudo-id.
  const elsewhere = listOf(
    { id: "plgn@skills-dir", enabled: true, scope: "user" },
    { id: "plgn@plgn", enabled: true, scope: "project", projectPath: "/some/other/project" },
  );
  const h3 = withClaude({ [LIST]: elsewhere });
  try {
    assert.equal((await claudeCode.apply(h3.ctx, { dryRun: true })).status, "added");
  } finally {
    h3.cleanup();
  }
});
