import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// Every host function takes a ctx and never reads os.homedir(), process.env or the clock itself,
// so any path can run on a temporary home and a fake PATH.

const underTest = (env = process.env) => Boolean(env.NODE_TEST_CONTEXT);

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

// Windows has no execute bit (PATHEXT decides there); elsewhere a file must be executable.
function isExecutable(p, platform) {
  if (platform === "win32") return true;
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function which(name, { platform = process.platform, env = process.env } = {}) {
  const raw = env.PATH ?? env.Path ?? "";
  const dirs = raw.split(path.delimiter).filter(Boolean);
  let names = [name];
  if (platform === "win32") {
    const exts = (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean);
    // Lower case first: it matches on case-sensitive disks too; Windows ignores the case anyway.
    names = exts.flatMap((e) => [name + e.toLowerCase(), name + e]);
  }
  for (const dir of dirs) {
    for (const n of names) {
      const full = path.join(dir, n);
      if (isFile(full) && isExecutable(full, platform)) return full;
    }
  }
  return null;
}

// Never rejects: a spawn error or a timeout gives code -1 and the message in stderr.
export function runFile(file, args = [], { timeout = 5000 } = {}) {
  if (underTest()) {
    throw new Error("runFile refuses to run a real program under node --test (NODE_TEST_CONTEXT is set)");
  }
  return new Promise((resolve) => {
    const isCmd = /\.(cmd|bat)$/i.test(file);
    let child;
    try {
      // npm installs claude, codex and gemini as .cmd shims; Node 20 refuses to spawn those without a shell.
      // The command line is built here and no args array is passed: Node 24 warns (DEP0190) otherwise.
      // The args are fixed strings chosen by this program, never user input.
      child = isCmd
        ? spawn([`"${file}"`, ...args].join(" "), { shell: true, windowsHide: true })
        : spawn(file, args, { windowsHide: true });
    } catch (e) {
      resolve({ code: -1, stdout: "", stderr: String(e?.message ?? e) });
      return;
    }
    let stdout = "";
    let stderr = "";
    let done = false;
    const finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish({ code: -1, stdout, stderr: stderr || "timeout" });
    }, timeout);
    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));
    child.on("error", (e) => finish({ code: -1, stdout, stderr: String(e?.message ?? e) }));
    child.on("close", (code) => finish({ code: code ?? -1, stdout, stderr }));
  });
}

export function makeContext({ home, platform, env, exec, now } = {}) {
  if (home === undefined && underTest()) {
    throw new Error("makeContext needs an explicit home under node --test (NODE_TEST_CONTEXT is set)");
  }
  if (env === undefined && underTest()) {
    throw new Error("makeContext needs an explicit env under node --test (NODE_TEST_CONTEXT is set)");
  }
  home = home ?? os.homedir();
  platform = platform ?? process.platform;
  env = env ?? process.env;
  let appData;
  if (platform === "win32") appData = env.APPDATA || path.join(home, "AppData", "Roaming");
  else if (platform === "darwin") appData = path.join(home, "Library", "Application Support");
  else appData = env.XDG_CONFIG_HOME || path.join(home, ".config");
  const whichIn = (name) => which(name, { platform, env });
  return {
    home,
    platform,
    env,
    appData,
    which: whichIn,
    exec:
      exec ??
      (async (name, args = [], opts = {}) => {
        const file = whichIn(name);
        if (!file) return { code: 127, stdout: "", stderr: "not found" };
        return runFile(file, args, opts);
      }),
    now: now ?? (() => new Date()),
  };
}
