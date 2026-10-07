import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { run } from "../src/cli.js";
import { HOST_IDS, MCP_URL } from "../src/constants.js";
import { getHost, hosts } from "../src/hosts/index.js";
import { fakeExec, tempHome } from "./helpers.js";

const BIN = fileURLToPath(new URL("../bin/plgn-setup.js", import.meta.url));

// Runs the CLI in-process on a temp home; collects both streams, never touches the network.
async function cli(h, argv, { isTTY = false, prompt, answers, fetchOk = true } = {}) {
  const out = [];
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
    assert.equal(version.out.trim(), "0.1.0");
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
    const prompt = async (options, initialValues, lang) => {
      seen.push({ options, initialValues, lang });
      return ["codex"];
    };
    const r = await cli(h, [], { isTTY: true, prompt });
    assert.equal(r.code, 0);
    assert.equal(seen.length, 1);
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
    assert.match(red.out, /problem\(s\)/);
    assert.equal(red.fetchCalls.length, 1);
    await cli(h, ["cursor", "--yes"]);
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

test("bin --version prints 0.1.0", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "plgn-setup-bin-"));
  try {
    const r = spawnBin(home, ["--version"]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), "0.1.0");
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
