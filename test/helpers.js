import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { makeContext } from "../src/context.js";

// Answers keyed by "<name> <args joined by space>"; anything else is a quiet success.
// An array answers each call in turn and then keeps giving its last answer.
export function fakeExec(answers = {}) {
  const calls = [];
  const seen = {};
  const exec = async (name, args = []) => {
    calls.push({ name, args });
    const key = [name, ...args].join(" ");
    const answer = answers[key];
    if (Array.isArray(answer)) {
      const n = (seen[key] = (seen[key] ?? 0) + 1);
      return answer[Math.min(n, answer.length) - 1];
    }
    return answer ?? { code: 0, stdout: "", stderr: "" };
  };
  exec.calls = calls;
  return exec;
}

// A throwaway home folder with its own bin folder; nothing here touches the real home.
export function tempHome({ platform = process.platform } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-"));
  const binDir = path.join(home, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  const ctx = makeContext({
    home,
    platform,
    env: {
      PATH: binDir,
      PATHEXT: ".CMD;.EXE",
      APPDATA: path.join(home, "AppData", "Roaming"),
    },
    exec: fakeExec(),
    now: () => new Date(2026, 9, 8, 1, 2, 3),
  });
  const abs = (rel) => path.join(home, rel);
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : [p];
    });
  return {
    home,
    binDir,
    ctx,
    put(rel, text) {
      fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
      fs.writeFileSync(abs(rel), text);
    },
    get: (rel) => fs.readFileSync(abs(rel), "utf8"),
    exists: (rel) => fs.existsSync(abs(rel)),
    addBin(name) {
      const file = path.join(binDir, platform === "win32" ? `${name}.cmd` : name);
      fs.writeFileSync(file, platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n", { mode: 0o755 });
      return file;
    },
    files: () => walk(home),
    cleanup: () => fs.rmSync(home, { recursive: true, force: true }),
  };
}
