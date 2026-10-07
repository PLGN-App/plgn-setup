import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { MCP_URL } from "../src/constants.js";
import { phrases } from "../src/i18n.js";
import { makeFileHost } from "../src/hosts/file-host.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { fakeExec, tempHome } from "./helpers.js";

const entry = { url: MCP_URL };

const jsonHost = makeFileHost({
  id: "demo-json",
  label: "Demo JSON",
  bin: "demo",
  format: "json",
  configPath: (ctx) => path.join(ctx.home, ".demo", "mcp.json"),
  detectPaths: (ctx) => [path.join(ctx.home, ".demo")],
  path: ["mcpServers"],
  entry,
  nextStep: (lang) => `demo next ${lang}`,
});

const tomlHost = makeFileHost({
  id: "demo-toml",
  label: "Demo TOML",
  bin: "demo",
  format: "toml",
  configPath: (ctx) => path.join(ctx.home, ".demo", "config.toml"),
  detectPaths: (ctx) => [path.join(ctx.home, ".demo")],
  path: ["mcp_servers"],
  entry,
  nextStep: (lang) => `demo next ${lang}`,
});

const cases = {
  "demo-json": {
    host: jsonHost,
    rel: ".demo/mcp.json",
    others: JSON.stringify({ theme: "dark", mcpServers: { other: { command: "x", args: ["a"] } } }, null, 2),
    old: JSON.stringify({ mcpServers: { other: { url: "https://o.example/mcp" }, plgn: { url: "https://old.example/mcp" } } }, null, 2),
    broken: '{ "mcpServers": { "a": ',
    differs: JSON.stringify({ mcpServers: { plgn: { url: MCP_URL, disabled: true } } }, null, 2),
  },
  "demo-toml": {
    host: tomlHost,
    rel: ".demo/config.toml",
    others: '# my settings\nmodel = "x"\n\n[mcp_servers.other]\ncommand = "npx"\nargs = ["a"]\n',
    old: '[mcp_servers.plgn]\nurl = "https://old.example/mcp"\n\n[mcp_servers.other]\ncommand = "npx"\n',
    broken: "[mcp_servers\nurl = ",
    differs: `[mcp_servers.plgn]\nurl = "${MCP_URL}"\ndisabled = true\n`,
  },
};

for (const c of Object.values(cases)) {
  mergeCases(c.host, { others: c.others, old: c.old, broken: c.broken });
  detectCases(c.host, { dirs: [".demo"], bin: "demo" });
}

const withHome = (fn) => async () => {
  const h = tempHome();
  try {
    await fn(h);
  } finally {
    h.cleanup();
  }
};

for (const [id, c] of Object.entries(cases)) {
  const { host, rel } = c;

  test(`${id}: apply adds the entry, backs up the old file and returns the backup path`, withHome(async (h) => {
    h.put(rel, c.others);
    const r = await host.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.equal(r.dryRun, false);
    assert.equal(r.file, path.join(h.home, rel));
    assert.ok(r.backup && r.backup.includes(".plgn-backup-20261008-010203"));
    assert.equal(h.get(rel), host.merge(c.others).text);
    assert.equal(h.get(r.backup.slice(h.home.length + 1)), c.others);
    assert.equal(h.files().filter((f) => f.includes(".plgn-backup-")).length, 1);
  }));

  test(`${id}: apply a second time is same, writes nothing and makes no new backup`, withHome(async (h) => {
    h.put(rel, c.others);
    await host.apply(h.ctx, { dryRun: false });
    const text = h.get(rel);
    const before = h.files().sort();
    const r = await host.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "same");
    assert.equal(h.get(rel), text);
    assert.deepEqual(h.files().sort(), before);
  }));

  test(`${id}: apply with dryRun writes nothing`, withHome(async (h) => {
    h.put(rel, c.others);
    const r = await host.apply(h.ctx, { dryRun: true });
    assert.equal(r.status, "added");
    assert.equal(r.dryRun, true);
    assert.equal(h.get(rel), c.others);
    assert.equal(h.files().length, 1);
    const none = tempHome();
    try {
      const r2 = await host.apply(none.ctx, { dryRun: true });
      assert.equal(r2.status, "added");
      assert.equal(none.exists(rel), false);
    } finally {
      none.cleanup();
    }
  }));

  test(`${id}: apply creates a missing file and its folder with no backup`, withHome(async (h) => {
    assert.equal(h.exists(".demo"), false);
    const r = await host.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "added");
    assert.equal(r.backup, null);
    assert.equal(h.get(rel), host.merge(null).text);
    assert.deepEqual(h.files(), [path.join(h.home, rel)]);
  }));

  test(`${id}: apply leaves an unreadable file byte for byte alone and reports PARSE`, withHome(async (h) => {
    h.put(rel, c.broken);
    const r = await host.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "error");
    assert.equal(r.error, "PARSE");
    assert.equal(r.file, path.join(h.home, rel));
    assert.equal(h.get(rel), c.broken);
    assert.equal(h.files().length, 1);
  }));

  test(`${id}: doctor gives one skip row when the host is not found`, withHome(async (h) => {
    const rows = await host.doctor(h.ctx);
    assert.equal(rows.length, 1);
    assert.deepEqual(
      { id: rows[0].id, check: rows[0].check, status: rows[0].status, key: rows[0].key },
      { id, check: "found", status: "skip", key: "doctor.notFound" },
    );
  }));

  test(`${id}: doctor is red for a missing file, a missing entry and an old URL, green for the right entry`, withHome(async (h) => {
    const byCheck = (rows, check) => rows.find((r) => r.check === check);

    h.put(".demo/.keep", "");
    let rows = await host.doctor(h.ctx);
    assert.equal(byCheck(rows, "config").status, "fail");
    assert.equal(byCheck(rows, "config").key, "doctor.fileMissing");
    assert.equal(byCheck(rows, "config").vars.file, path.join(h.home, rel));
    assert.equal(byCheck(rows, "entry"), undefined);

    h.put(rel, c.others);
    rows = await host.doctor(h.ctx);
    assert.equal(byCheck(rows, "config").status, "ok");
    assert.equal(byCheck(rows, "config").key, "doctor.fileFound");
    assert.equal(byCheck(rows, "entry").status, "fail");
    assert.equal(byCheck(rows, "entry").key, "doctor.entryMissing");

    h.put(rel, c.old);
    rows = await host.doctor(h.ctx);
    assert.equal(byCheck(rows, "entry").status, "fail");
    assert.equal(byCheck(rows, "entry").key, "doctor.entryWrong");
    assert.equal(byCheck(rows, "entry").vars.url, "https://old.example/mcp");

    h.put(rel, c.broken);
    rows = await host.doctor(h.ctx);
    assert.equal(byCheck(rows, "entry").status, "fail");
    assert.equal(byCheck(rows, "entry").key, "doctor.unreadable");

    h.put(rel, host.merge(c.others).text);
    rows = await host.doctor(h.ctx);
    assert.equal(byCheck(rows, "entry").status, "ok");
    assert.equal(byCheck(rows, "entry").key, "doctor.entryOk");
    assert.equal(byCheck(rows, "entry").vars.url, MCP_URL);
  }));

  test(`${id}: doctor says entryDiffers when the address is right but another key differs`, withHome(async (h) => {
    h.put(rel, c.differs);
    const rows = await host.doctor(h.ctx);
    const entryRow = rows.find((r) => r.check === "entry");
    assert.equal(entryRow.status, "fail");
    assert.equal(entryRow.key, "doctor.entryDiffers");
  }));

  test(`${id}: apply returns an IO error and does not throw when the config path is a folder`, withHome(async (h) => {
    h.put(`${rel}/x`, "");
    const before = h.files().sort();
    const r = await host.apply(h.ctx, { dryRun: false });
    assert.equal(r.status, "error");
    assert.equal(r.error, "IO");
    assert.ok(r.detail && r.detail.length > 0);
    assert.deepEqual(h.files().sort(), before);
  }));

  test(`${id}: doctor gives a red unreadable config row when the config path is a folder`, withHome(async (h) => {
    h.put(`${rel}/x`, "");
    const rows = await host.doctor(h.ctx);
    const config = rows.find((r) => r.check === "config");
    assert.equal(config.status, "fail");
    assert.equal(config.key, "doctor.unreadable");
    assert.equal(rows.find((r) => r.check === "entry"), undefined);
  }));

  test(`${id}: doctor version row is ok with the first line and skip without the binary`, withHome(async (h) => {
    h.put(".demo/.keep", "");
    const exec = fakeExec({ "demo --version": { code: 0, stdout: "demo 1.2.3\nmore\n", stderr: "" } });
    h.ctx.exec = exec;
    let rows = await host.doctor(h.ctx);
    let v = rows.find((r) => r.check === "version");
    assert.equal(v.status, "ok");
    assert.equal(v.key, "doctor.version");
    assert.equal(v.vars.version, "demo 1.2.3");
    assert.deepEqual(exec.calls.at(-1), { name: "demo", args: ["--version"] });

    h.ctx.exec = fakeExec({ "demo --version": { code: 127, stdout: "", stderr: "not found" } });
    rows = await host.doctor(h.ctx);
    v = rows.find((r) => r.check === "version");
    assert.equal(v.status, "skip");
    assert.equal(v.key, "doctor.noBinary");
    assert.equal(v.vars.bin, "demo");
  }));

  test(`${id}: every row key is a known phrase`, withHome(async (h) => {
    const keys = new Set();
    const collect = async () => (await host.doctor(h.ctx)).forEach((r) => keys.add(r.key));
    await collect();
    h.put(".demo/.keep", "");
    await collect();
    for (const text of [c.others, c.old, c.broken, c.differs, host.merge(null).text]) {
      h.put(rel, text);
      await collect();
    }
    h.ctx.exec = fakeExec({ "demo --version": { code: 0, stdout: "v1\n", stderr: "" } });
    await collect();
    assert.ok(keys.size >= 8);
    for (const key of keys) {
      assert.ok(Object.hasOwn(phrases.en, key), `en ${key}`);
      assert.ok(Object.hasOwn(phrases.ar, key), `ar ${key}`);
    }
  }));

  test(`${id}: snippet holds the entry and nextStep comes from the spec`, () => {
    assert.ok(host.snippet().includes(MCP_URL));
    assert.equal(host.kind, "file");
    assert.equal(host.nextStep("en"), "demo next en");
  });
}
