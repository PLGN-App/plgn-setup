import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { colorDefault, run } from "../src/cli.js";
import picocolors from "picocolors";
import { devinFile, legacyFile } from "../src/hosts/devin.js";
import { HOST_IDS, MCP_URL } from "../src/constants.js";
import { getHost, hosts } from "../src/hosts/index.js";
import { installSkills } from "../src/skills.js";

// The version the CLI prints is package.json's, so a release bump never needs a test edit.
const PKG_VERSION = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
import { fakeExec, tempHome } from "./helpers.js";

const BIN = fileURLToPath(new URL("../bin/plgn-setup.js", import.meta.url));

// Runs the CLI in-process on a temp home; collects both streams, never touches the network.
async function cli(h, argv, { isTTY = false, prompt, answers, fetchOk = true, out = [] } = {}) {
  const err = [];
  const fetchCalls = [];
  const ctx = { ...h.ctx, exec: fakeExec(answers) };
  const code = await run(argv, {
    stdout: { write: (s) => out.push(s) },
    stderr: { write: (s) => err.push(s) },
    isTTY,
    color: false,
    prompt,
    fetch: async (url, opts) => {
      fetchCalls.push(url);
      return { ok: fetchOk, status: fetchOk ? 200 : 500 };
    },
    ctx,
  });
  return { code, out: out.join(""), err: err.join(""), fetchCalls, exec: ctx.exec };
}

// Every file under the home with its bytes, to prove "nothing changed".
const snapshot = (h) => Object.fromEntries(h.files().map((f) => [f, fs.readFileSync(f, "utf8")]));

test("--dry-run --yes prints the plan and leaves every file untouched", async () => {
  const h = tempHome();
  try {
    h.addBin("claude");
    h.put(".cursor/mcp.json", '{\n  "mcpServers": { "other": { "url": "https://x.test" } }\n}\n');
    h.put(".codex/config.toml", 'model = "x"\n');
    const before = snapshot(h);
    const r = await cli(h, ["--dry-run", "--yes"], { answers: { "claude plugin list --json": { code: 0, stdout: "[]", stderr: "" } } });
    assert.equal(r.code, 0);
    assert.match(r.out, /would add plgn/);
    assert.match(r.out, /would run claude plugin install plgn@plgn/);
    assert.match(r.out, /Dry run: nothing was written/);
    assert.deepEqual(snapshot(h), before);
    assert.ok(!h.files().some((f) => f.includes(".plgn-backup")));
    const bad = r.exec.calls.filter((c) => c.args[0] === "plugin" && c.args[1] !== "list");
    assert.deepEqual(bad, []);
    assert.deepEqual(r.fetchCalls, []);
  } finally {
    h.cleanup();
  }
});

test("--yes sets up detected hosts, and a second run says already set and writes nothing", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", '{\n  "mcpServers": {}\n}\n');
    h.put(".codex/config.toml", 'model = "x"\n');
    const first = await cli(h, ["--yes"]);
    assert.equal(first.code, 0);
    assert.match(first.out, /Cursor: plgn added to /);
    assert.match(first.out, /Codex CLI: plgn added to /);
    assert.match(first.out, /Backup of the old file/);
    assert.ok(h.get(".cursor/mcp.json").includes(MCP_URL));
    assert.ok(h.get(".codex/config.toml").includes(MCP_URL));
    const after = snapshot(h);
    const second = await cli(h, ["--yes"]);
    assert.equal(second.code, 0);
    assert.match(second.out, /Cursor: already set/);
    assert.match(second.out, /Codex CLI: already set/);
    assert.deepEqual(snapshot(h), after);
    assert.deepEqual(first.fetchCalls, []);
  } finally {
    h.cleanup();
  }
});

test("a named host is set up even when it is not detected", async () => {
  const h = tempHome();
  try {
    assert.equal(getHost("cursor").detect(h.ctx), false);
    const r = await cli(h, ["cursor", "--yes"]);
    assert.equal(r.code, 0);
    assert.ok(h.exists(".cursor/mcp.json"));
    assert.ok(h.get(".cursor/mcp.json").includes(MCP_URL));
    assert.ok(!h.exists(".codex/config.toml"));
  } finally {
    h.cleanup();
  }
});

test("unknown host, unknown flag and --lang xx exit 2", async () => {
  const h = tempHome();
  try {
    const host = await cli(h, ["nope", "--yes"]);
    assert.equal(host.code, 2);
    assert.match(host.err, /Unknown tool: nope/);
    const flag = await cli(h, ["--bogus"]);
    assert.equal(flag.code, 2);
    assert.match(flag.err, /npx plgn-setup --help/);
    const two = await cli(h, ["cursor", "codex"]);
    assert.equal(two.code, 2);
    const lang = await cli(h, ["--lang", "xx", "--yes"]);
    assert.equal(lang.code, 2);
    assert.match(lang.err, /Unknown language: xx/);
    assert.deepEqual(h.files(), []);
  } finally {
    h.cleanup();
  }
});

test("--help and --version exit 0", async () => {
  const h = tempHome();
  try {
    const help = await cli(h, ["--help"]);
    assert.equal(help.code, 0);
    assert.match(help.out, /Usage:/);
    assert.ok(help.out.includes(HOST_IDS.join(", ")));
    const version = await cli(h, ["-v"]);
    assert.equal(version.code, 0);
    assert.equal(version.out.trim(), PKG_VERSION);
  } finally {
    h.cleanup();
  }
});

test("no TTY without --yes exits 2 and writes nothing", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", "{}\n");
    const before = snapshot(h);
    const r = await cli(h, [], { isTTY: false });
    assert.equal(r.code, 2);
    assert.match(r.err, /--yes/);
    assert.deepEqual(snapshot(h), before);
  } finally {
    h.cleanup();
  }
});

test("the prompt gets detected hosts pre-checked and only picked hosts are written", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", "{}\n");
    h.put(".codex/config.toml", 'model = "x"\n');
    const seen = [];
    let printed;
    const prompt = async (options, initialValues, lang) => {
      seen.push({ options, initialValues, lang });
      printed = out.join("");
      return ["codex"];
    };
    const out = [];
    const r = await cli(h, [], { isTTY: true, prompt, out });
    assert.equal(r.code, 0);
    assert.equal(seen.length, 1);
    assert.match(printed, /plgn setup: connect your AI tools to plgn\./);
    assert.deepEqual(seen[0].options.map((o) => o.value), HOST_IDS);
    assert.deepEqual(seen[0].initialValues, ["codex", "cursor"]);
    assert.equal(seen[0].lang, "en");
    assert.ok(seen[0].options.find((o) => o.value === "cursor").hint);
    assert.equal(seen[0].options.find((o) => o.value === "vscode").hint, undefined);
    assert.ok(h.get(".codex/config.toml").includes(MCP_URL));
    assert.equal(h.get(".cursor/mcp.json"), "{}\n");
  } finally {
    h.cleanup();
  }
});

test("a cancelled prompt says nothing changed and exits 0", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", "{}\n");
    const before = snapshot(h);
    for (const answer of [null, []]) {
      const r = await cli(h, [], { isTTY: true, prompt: async () => answer });
      assert.equal(r.code, 0);
      assert.match(r.out, /Nothing changed\./);
    }
    assert.deepEqual(snapshot(h), before);
  } finally {
    h.cleanup();
  }
});

test("no detected tool and no name says none found and exits 0", async () => {
  const h = tempHome();
  try {
    const r = await cli(h, ["--yes"]);
    assert.equal(r.code, 0);
    assert.match(r.out, /No AI tools found/);
    assert.deepEqual(h.files(), []);
  } finally {
    h.cleanup();
  }
});

test("an unreadable config exits 1, stays byte for byte, and the snippet is printed", async () => {
  const h = tempHome();
  try {
    const broken = '{\n  // a comment makes this strict JSON no more\n  "mcpServers": {}\n}\n';
    h.put(".cursor/mcp.json", broken);
    const r = await cli(h, ["cursor", "--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.out, /could not read /);
    assert.ok(r.out.includes(MCP_URL));
    assert.equal(h.get(".cursor/mcp.json"), broken);
    assert.ok(!h.files().some((f) => f.includes(".plgn-backup")));
  } finally {
    h.cleanup();
  }
});

test("a config path that is a folder prints an error line, exits 1, and the other hosts are still set up", async () => {
  const h = tempHome();
  try {
    fs.mkdirSync(path.join(h.home, ".cursor", "mcp.json"), { recursive: true });
    h.put(".codex/config.toml", 'model = "x"\n');
    const r = await cli(h, ["--yes"]);
    assert.equal(r.code, 1);
    assert.match(r.out, /Cursor: stopped with an error: /);
    assert.ok(h.get(".codex/config.toml").includes(MCP_URL));
  } finally {
    h.cleanup();
  }
});

test("doctor exits 0 when green and 1 when red", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", "{}\n");
    const red = await cli(h, ["doctor"]);
    assert.equal(red.code, 1);
    assert.match(red.out, /plgn doctor/);
    assert.match(red.out, /Problems: \d+\. Run npx plgn-setup to fix them\./);
    assert.equal(red.fetchCalls.length, 1);
    await cli(h, ["cursor", "--yes"]);
    installSkills(h.ctx, "cursor", { dryRun: false });
    const green = await cli(h, ["doctor"]);
    assert.equal(green.code, 0);
    assert.match(green.out, /All good\./);
    const down = await cli(h, ["doctor"], { fetchOk: false });
    assert.equal(down.code, 1);
  } finally {
    h.cleanup();
  }
});

test("--lang ar prints Arabic letters and no Arabic-Indic digits", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", "{}\n");
    h.put(".codex/config.toml", 'model = "x"\n');
    const r = await cli(h, ["--lang", "ar", "--dry-run", "--yes"]);
    assert.equal(r.code, 0);
    assert.match(r.out, /[؀-ۿ]/);
    assert.ok(!/[٠-٩۰-۹]/.test(r.out));
    const d = await cli(h, ["--lang", "ar", "doctor"]);
    assert.match(d.out, /[؀-ۿ]/);
    assert.ok(!/[٠-٩۰-۹]/.test(d.out));
  } finally {
    h.cleanup();
  }
});

test("hosts follow HOST_IDS order", () => {
  assert.deepEqual(hosts.map((x) => x.id), HOST_IDS);
  for (const id of HOST_IDS) assert.equal(getHost(id).id, id);
  assert.equal(getHost("nope"), undefined);
});

// The child gets a hand-built env (no NODE_TEST_CONTEXT), so it treats the temp folder as its real home.
function spawnBin(home, args) {
  const empty = path.join(home, "empty-path");
  fs.mkdirSync(empty, { recursive: true });
  const env = {
    HOME: home,
    USERPROFILE: home,
    APPDATA: path.join(home, "AppData", "Roaming"),
    XDG_CONFIG_HOME: path.join(home, ".config"),
    CODEX_HOME: path.join(home, ".codex"),
    PATH: empty,
  };
  if (process.platform === "win32") env.SystemRoot = process.env.SystemRoot ?? "C:\\Windows";
  return spawnSync(process.execPath, [BIN, ...args], { env, encoding: "utf8" });
}

test("bin --version prints package.json's version", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-bin-"));
  try {
    const r = spawnBin(home, ["--version"]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), PKG_VERSION);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("bin --dry-run --yes on a temp home changes nothing and makes no backup", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-bin-"));
  try {
    fs.mkdirSync(path.join(home, ".cursor"), { recursive: true });
    fs.mkdirSync(path.join(home, ".codex"), { recursive: true });
    fs.writeFileSync(path.join(home, ".cursor", "mcp.json"), '{\n  "mcpServers": {}\n}\n');
    fs.writeFileSync(path.join(home, ".codex", "config.toml"), 'model = "x"\n');
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      });
    const snap = () => Object.fromEntries(walk(home).filter((f) => !f.includes("empty-path")).map((f) => [f, fs.readFileSync(f, "utf8")]));
    const before = snap();
    const r = spawnBin(home, ["--dry-run", "--yes"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /would add plgn/);
    assert.deepEqual(snap(), before);
    assert.ok(!walk(home).some((f) => f.includes(".plgn-backup")));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("windsurf is accepted as an alias of devin on the command line", async () => {
  const h = tempHome();
  try {
    assert.equal(getHost("windsurf"), getHost("devin"));
    const r = await cli(h, ["windsurf", "--yes"]);
    assert.equal(r.code, 0);
    assert.match(r.out, /Devin \(formerly Windsurf\): plgn added to /);
    assert.ok(fs.readFileSync(devinFile(h.ctx), "utf8").includes(MCP_URL));
    assert.equal(fs.existsSync(legacyFile(h.ctx)), false);
    assert.ok(!r.out.includes("old Windsurf path"));
  } finally {
    h.cleanup();
  }
});

test("devin says when the old Windsurf file was the one updated", async () => {
  const h = tempHome();
  try {
    h.put(".codeium/windsurf/mcp_config.json", "{}\n");
    const dry = await cli(h, ["devin", "--dry-run", "--yes"]);
    assert.equal(dry.code, 0);
    assert.match(dry.out, /is the old Windsurf path/);
    assert.equal(h.get(".codeium/windsurf/mcp_config.json"), "{}\n");
    const r = await cli(h, ["devin", "--yes"]);
    assert.equal(r.code, 0);
    assert.match(r.out, /Devin \(formerly Windsurf\): plgn added to /);
    assert.match(r.out, /is the old Windsurf path/);
    assert.ok(h.get(".codeium/windsurf/mcp_config.json").includes(MCP_URL));
    assert.equal(fs.existsSync(devinFile(h.ctx)), false);
    const ar = await cli(h, ["--lang", "ar", "devin", "--yes"]);
    assert.match(ar.out, /Windsurf القديم/);
  } finally {
    h.cleanup();
  }
});

test("colour is off when stdout is not a TTY or NO_COLOR is set", () => {
  assert.equal(colorDefault({ isTTY: false, env: {} }), false);
  assert.equal(colorDefault({ isTTY: true, env: { NO_COLOR: "1" } }), false);
  assert.equal(colorDefault({ isTTY: true, env: {} }), picocolors.isColorSupported);
  assert.equal(colorDefault({ isTTY: true, env: { NO_COLOR: "" } }), picocolors.isColorSupported);
});

test("bin output piped to a file has no escape codes", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-bin-"));
  try {
    fs.mkdirSync(path.join(home, ".cursor"), { recursive: true });
    fs.writeFileSync(path.join(home, ".cursor", "mcp.json"), "{}\n");
    const r = spawnBin(home, ["--dry-run", "--yes"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Next, log in once in each tool:/);
    assert.ok(!r.stdout.includes("\u001b"), r.stdout);
    assert.ok(!r.stderr.includes("\u001b"), r.stderr);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
