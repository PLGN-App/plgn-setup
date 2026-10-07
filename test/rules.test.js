import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOST_IDS } from "../src/constants.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function srcFiles(dir = path.join(root, "src")) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? srcFiles(p) : [p];
  });
}
const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const read = (p) => fs.readFileSync(p, "utf8");

test("only src/doctor.js calls fetch", () => {
  const bad = srcFiles().filter((f) => rel(f) !== "src/doctor.js" && /\bfetch\s*\(/.test(read(f)));
  assert.deepEqual(bad.map(rel), []);
});

test("the MCP URL is spelled only in src/constants.js", () => {
  const bad = srcFiles().filter((f) => rel(f) !== "src/constants.js" && read(f).includes("useplgn.com/api/mcp"));
  assert.deepEqual(bad.map(rel), []);
});

test("no src file holds Authorization, Bearer, apiKey, api_key or password", () => {
  const bad = srcFiles().filter((f) => /Authorization|Bearer|apiKey|api_key|password/i.test(read(f)));
  assert.deepEqual(bad.map(rel), []);
});

test("no src file uses toLocaleString", () => {
  const bad = srcFiles().filter((f) => read(f).includes("toLocaleString"));
  assert.deepEqual(bad.map(rel), []);
});

test("every host file starts with a Source line", () => {
  const dir = path.join(root, "src", "hosts");
  const files = fs.readdirSync(dir).filter((n) => n.endsWith(".js") && n !== "file-host.js" && n !== "index.js");
  assert.equal(files.length, HOST_IDS.length);
  for (const name of files) {
    const first = read(path.join(dir, name)).split(/\r?\n/)[0];
    assert.match(first, /^\/\/ Source: https:\/\/\S+ \(checked \d{4}-\d{2}-\d{2}\)/, name);
  }
});

test("README names every host id, doctor, --lang ar and the backup rule", () => {
  const readme = read(path.join(root, "README.md"));
  for (const id of HOST_IDS) assert.ok(readme.includes(`npx plgn-setup ${id}`), id);
  assert.ok(readme.includes("npx plgn-setup doctor"));
  assert.ok(readme.includes("--lang ar"));
  assert.ok(readme.includes("--dry-run"));
  assert.ok(readme.includes("--yes"));
  assert.ok(readme.includes(".plgn-backup-YYYYMMDD-HHmmss"));
});

test("package files list is exactly bin, src, README.md, CHANGELOG.md, LICENSE", () => {
  const pkg = JSON.parse(read(path.join(root, "package.json")));
  assert.deepEqual([...pkg.files].sort(), ["CHANGELOG.md", "LICENSE", "README.md", "bin", "src"]);
});
