import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOST_IDS } from "../src/constants.js";
import { SKILLS_DIRS, skillsDirFor, bundledSkills, installSkills, skillsStatus } from "../src/skills.js";
import { devinFile } from "../src/hosts/devin.js";
import { tempHome } from "./helpers.js";

const repoSkills = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "skills");
const fsNames = () =>
  fs
    .readdirSync(repoSkills, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("plgn-"))
    .map((e) => e.name)
    .sort();
const version = () => fs.readFileSync(path.join(repoSkills, "VERSION"), "utf8").trim();

test("SKILLS_DIRS has one entry for every host id", () => {
  assert.deepEqual(Object.keys(SKILLS_DIRS).sort(), [...HOST_IDS].sort());
});

test("skillsDirFor gives the skills CLI 1.7.1 folders, and Devin's own folder beside its config", () => {
  for (const platform of ["win32", "linux"]) {
    const h = tempHome({ platform });
    try {
      const j = (...p) => path.join(h.home, ...p);
      assert.equal(skillsDirFor("codex", h.ctx), j(".codex", "skills"));
      assert.equal(skillsDirFor("cursor", h.ctx), j(".cursor", "skills"));
      assert.equal(skillsDirFor("gemini", h.ctx), j(".gemini", "skills"));
      // Audit PL15: Devin on Windows reads %APPDATA%\devin\skills, where its mcp_config.json is.
      const devinSkills = platform === "win32" ? j("AppData", "Roaming", "devin", "skills") : j(".config", "devin", "skills");
      assert.equal(skillsDirFor("devin", h.ctx), devinSkills);
      assert.equal(path.dirname(skillsDirFor("devin", h.ctx)), path.dirname(devinFile(h.ctx)));
      assert.equal(skillsDirFor("vscode", h.ctx), j(".copilot", "skills"));
      assert.equal(skillsDirFor("claude-code", h.ctx), null);
      assert.equal(skillsDirFor("claude-desktop", h.ctx), null);
      assert.equal(skillsDirFor("nope", h.ctx), null);
      assert.equal(skillsDirFor("toString", h.ctx), null);
      h.ctx.env.CODEX_HOME = j("x");
      h.ctx.env.XDG_CONFIG_HOME = j("y");
      assert.equal(skillsDirFor("codex", h.ctx), j("x", "skills"));
      assert.equal(skillsDirFor("devin", h.ctx), platform === "win32" ? devinSkills : j("y", "devin", "skills"));
    } finally {
      h.cleanup();
    }
  }
});

test("the bundled skills folder has at least 40 plgn-* folders and a VERSION", () => {
  assert.ok(fsNames().length >= 40);
  assert.match(version(), /^\d+\.\d+\.\d+$/);
});

test("bundledSkills lists the plgn-* folders that hold SKILL.md, sorted, with the VERSION", () => {
  const b = bundledSkills();
  const names = b.skills.map((s) => s.name);
  assert.deepEqual(names, fsNames());
  assert.ok(names.includes("plgn-conventions"));
  assert.ok(!names.includes("README.md"));
  assert.equal(b.version, version());
  assert.equal(path.resolve(b.root), path.resolve(repoSkills));
  for (const s of b.skills) assert.ok(fs.existsSync(path.join(s.dir, "SKILL.md")));
});

test("installSkills copies every bundled folder into a fake home", () => {
  const h = tempHome();
  try {
    const names = bundledSkills().skills.map((s) => s.name);
    const r = installSkills(h.ctx, "codex");
    assert.equal(r.dir, skillsDirFor("codex", h.ctx));
    assert.deepEqual([...r.copied].sort(), names);
    assert.deepEqual(r.replaced, []);
    assert.deepEqual(r.same, []);
    for (const n of names) {
      assert.ok(fs.readFileSync(path.join(r.dir, n, "SKILL.md")).equals(fs.readFileSync(path.join(repoSkills, n, "SKILL.md"))));
    }
  } finally {
    h.cleanup();
  }
});

test("installSkills replaces an old plgn folder and keeps every other folder", () => {
  const h = tempHome();
  try {
    const first = bundledSkills().skills[0].name;
    h.put(`.codex/skills/${first}/SKILL.md`, "old");
    h.put(`.codex/skills/${first}/extra.txt`, "stale");
    h.put(".codex/skills/my-own-skill/SKILL.md", "mine");
    h.put(".codex/skills/plgn-not-bundled/SKILL.md", "keep me");
    const r = installSkills(h.ctx, "codex");
    assert.ok(r.replaced.includes(first));
    assert.ok(!r.copied.includes(first));
    assert.ok(!h.exists(`.codex/skills/${first}/extra.txt`));
    assert.equal(h.get(`.codex/skills/${first}/SKILL.md`), fs.readFileSync(path.join(repoSkills, first, "SKILL.md"), "utf8"));
    assert.equal(h.get(".codex/skills/my-own-skill/SKILL.md"), "mine");
    assert.equal(h.get(".codex/skills/plgn-not-bundled/SKILL.md"), "keep me");
  } finally {
    h.cleanup();
  }
});

// Audit PL19 (follow-up P3): `npx skills add` links each skill into the folder and updates it itself.
test("installSkills leaves a linked plgn folder alone, even when it differs from the bundle", (t) => {
  const h = tempHome();
  try {
    const first = bundledSkills().skills[0].name;
    h.put(`.agents/skills/${first}/SKILL.md`, "newer, from the skills CLI");
    fs.mkdirSync(path.join(h.home, ".codex", "skills"), { recursive: true });
    const link = path.join(h.home, ".codex", "skills", first);
    try {
      fs.symlinkSync(path.join(h.home, ".agents", "skills", first), link, process.platform === "win32" ? "junction" : "dir");
    } catch {
      t.skip("cannot create a link here");
      return;
    }
    const plan = installSkills(h.ctx, "codex", { dryRun: true });
    assert.deepEqual(plan.linked, [first]);
    assert.ok(!plan.replaced.includes(first) && !plan.copied.includes(first));
    const r = installSkills(h.ctx, "codex");
    assert.deepEqual(r.linked, [first]);
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.equal(h.get(`.agents/skills/${first}/SKILL.md`), "newer, from the skills CLI");
    assert.equal(r.copied.length, bundledSkills().skills.length - 1);
  } finally {
    h.cleanup();
  }
});

test("a second install writes nothing", () => {
  const h = tempHome();
  try {
    const names = bundledSkills().skills.map((s) => s.name);
    const r1 = installSkills(h.ctx, "codex");
    const file = path.join(r1.dir, names[0], "SKILL.md");
    const before = fs.statSync(file).mtimeMs;
    const r2 = installSkills(h.ctx, "codex");
    assert.deepEqual(r2.copied, []);
    assert.deepEqual(r2.replaced, []);
    assert.deepEqual([...r2.same].sort(), names);
    assert.equal(fs.statSync(file).mtimeMs, before);
  } finally {
    h.cleanup();
  }
});

test("installSkills with dryRun writes nothing", () => {
  const h = tempHome();
  try {
    const names = bundledSkills().skills.map((s) => s.name);
    const filesBefore = h.files();
    const r = installSkills(h.ctx, "codex", { dryRun: true });
    assert.deepEqual([...r.copied].sort(), names);
    assert.deepEqual(h.files(), filesBefore);
    assert.ok(!fs.existsSync(r.dir));
  } finally {
    h.cleanup();
  }
});

test("hosts without a skills folder give null", () => {
  const h = tempHome();
  try {
    for (const id of ["claude-code", "claude-desktop"]) {
      assert.equal(installSkills(h.ctx, id), null);
      assert.equal(skillsStatus(h.ctx, id), null);
    }
  } finally {
    h.cleanup();
  }
});

test("skillsStatus counts installed folders", () => {
  const h = tempHome();
  try {
    const b = bundledSkills();
    const s0 = skillsStatus(h.ctx, "codex");
    assert.equal(s0.installed, 0);
    assert.equal(s0.total, b.skills.length);
    assert.equal(s0.version, b.version);
    const r = installSkills(h.ctx, "codex");
    assert.equal(skillsStatus(h.ctx, "codex").installed, b.skills.length);
    fs.rmSync(path.join(r.dir, b.skills[0].name), { recursive: true });
    assert.equal(skillsStatus(h.ctx, "codex").installed, b.skills.length - 1);
  } finally {
    h.cleanup();
  }
});

test("src/skills.js runs no program and makes no network call", () => {
  const src = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "skills.js"), "utf8");
  assert.ok(!src.includes("child_process"));
  assert.ok(!src.includes("fetch("));
  assert.ok(!src.includes("npx"));
});
