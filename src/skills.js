// Source: https://www.npmjs.com/package/skills/v/1.7.1 (checked 2026-10-08)
// The folders are the agent table's globalSkillsDir values in that package's dist/cli.mjs (codex, cursor,
// gemini-cli, devin, github-copilot); devin goes through xdg-basedir, so it is ~/.config on every platform.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codexHome } from "./hosts/codex.js";

export const SKILLS_DIRS = {
  "claude-code": null,
  codex: (ctx) => path.join(codexHome(ctx), "skills"),
  cursor: (ctx) => path.join(ctx.home, ".cursor", "skills"),
  gemini: (ctx) => path.join(ctx.home, ".gemini", "skills"),
  devin: (ctx) => path.join(ctx.env.XDG_CONFIG_HOME || path.join(ctx.home, ".config"), "devin", "skills"),
  vscode: (ctx) => path.join(ctx.home, ".copilot", "skills"),
  "claude-desktop": null,
};

export function skillsDirFor(hostId, ctx) {
  if (!Object.hasOwn(SKILLS_DIRS, hostId)) return null;
  return SKILLS_DIRS[hostId]?.(ctx) ?? null;
}

const bundleRoot = () => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "skills");

export function bundledSkills() {
  const root = bundleRoot();
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return { root, version: null, skills: [] };
  }
  const skills = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("plgn-") && fs.existsSync(path.join(root, e.name, "SKILL.md")))
    .map((e) => ({ name: e.name, dir: path.join(root, e.name) }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  let version = null;
  try {
    version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim() || null;
  } catch {
    // no VERSION file
  }
  return { root, version, skills };
}

// Relative file paths under dir, sorted; a missing folder gives null.
function listFiles(dir, rel = "") {
  let entries;
  try {
    entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
  } catch {
    return rel === "" ? null : [];
  }
  return entries
    .flatMap((e) => {
      const r = path.join(rel, e.name);
      return e.isDirectory() ? listFiles(dir, r) : [r];
    })
    .sort();
}

function sameFolder(a, b) {
  const fa = listFiles(a);
  const fb = listFiles(b);
  if (!fa || !fb || fa.length !== fb.length) return false;
  return fa.every((f, i) => f === fb[i] && fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))));
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (e.isDirectory()) copyDir(src, dst);
    else if (e.isFile()) fs.copyFileSync(src, dst);
  }
}

export function installSkills(ctx, hostId, { dryRun = false } = {}) {
  const dir = skillsDirFor(hostId, ctx);
  if (!dir) return null;
  const result = { dir, copied: [], replaced: [], same: [] };
  for (const s of bundledSkills().skills) {
    const target = path.join(dir, s.name);
    if (!fs.existsSync(target)) {
      result.copied.push(s.name);
      if (!dryRun) copyDir(s.dir, target);
    } else if (sameFolder(s.dir, target)) {
      result.same.push(s.name);
    } else {
      result.replaced.push(s.name);
      if (!dryRun) {
        fs.rmSync(target, { recursive: true, force: true });
        copyDir(s.dir, target);
      }
    }
  }
  return result;
}

export function skillsStatus(ctx, hostId) {
  const dir = skillsDirFor(hostId, ctx);
  if (!dir) return null;
  const { skills, version } = bundledSkills();
  const installed = skills.filter((s) => fs.existsSync(path.join(dir, s.name, "SKILL.md"))).length;
  return { installed, total: skills.length, version };
}
