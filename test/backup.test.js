import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { stamp, backupFile, writeConfig } from "../src/backup.js";
import { tempHome } from "./helpers.js";

test("stamp formats local time as YYYYMMDD-HHmmss", () => {
  assert.equal(stamp(new Date(2026, 9, 8, 1, 2, 3)), "20261008-010203");
});

test("backupFile copies the file next to it with the stamp", () => {
  const h = tempHome();
  try {
    h.put("conf/a.json", '{"a":1}');
    const file = path.join(h.home, "conf", "a.json");
    const dest = backupFile(file, { now: new Date(2026, 9, 8, 1, 2, 3) });
    assert.equal(dest, `${file}.plgn-backup-20261008-010203`);
    assert.equal(fs.readFileSync(dest, "utf8"), '{"a":1}');
    assert.equal(fs.readFileSync(file, "utf8"), '{"a":1}');
  } finally {
    h.cleanup();
  }
});

test("backupFile never overwrites an earlier backup", () => {
  const h = tempHome();
  try {
    h.put("a.json", "one");
    const file = path.join(h.home, "a.json");
    const now = new Date(2026, 9, 8, 1, 2, 3);
    const first = backupFile(file, { now });
    fs.writeFileSync(file, "two");
    const second = backupFile(file, { now });
    assert.equal(second, `${first}-2`);
    assert.equal(fs.readFileSync(first, "utf8"), "one");
    assert.equal(fs.readFileSync(second, "utf8"), "two");
    const third = backupFile(file, { now });
    assert.equal(third, `${first}-3`);
  } finally {
    h.cleanup();
  }
});

test("backupFile returns null for a missing file", () => {
  const h = tempHome();
  try {
    assert.equal(backupFile(path.join(h.home, "nope.json"), { now: new Date(2026, 9, 8) }), null);
    assert.deepEqual(fs.readdirSync(h.home).sort(), ["bin"]);
  } finally {
    h.cleanup();
  }
});

test("writeConfig creates missing folders and leaves no temp file behind", () => {
  const h = tempHome();
  try {
    const file = path.join(h.home, "deep", "er", "c.toml");
    writeConfig(file, "x = 1\n");
    assert.equal(fs.readFileSync(file, "utf8"), "x = 1\n");
    writeConfig(file, "x = 2\n");
    assert.equal(fs.readFileSync(file, "utf8"), "x = 2\n");
    assert.deepEqual(fs.readdirSync(path.dirname(file)), ["c.toml"]);
  } finally {
    h.cleanup();
  }
});

test("writeConfig keeps the file mode and follows a symlink", { skip: process.platform === "win32" }, () => {
  const h = tempHome();
  try {
    const real = path.join(h.home, "dotfiles", "real.json");
    fs.mkdirSync(path.dirname(real), { recursive: true });
    fs.writeFileSync(real, "old");
    fs.chmodSync(real, 0o600);
    const link = path.join(h.home, "conf.json");
    fs.symlinkSync(real, link);
    writeConfig(link, "new");
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.equal(fs.readFileSync(real, "utf8"), "new");
    assert.equal(fs.statSync(real).mode & 0o777, 0o600);
    assert.deepEqual(fs.readdirSync(path.dirname(real)), ["real.json"]);
  } finally {
    h.cleanup();
  }
});
