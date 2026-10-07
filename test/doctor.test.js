import test from "node:test";
import assert from "node:assert/strict";
import { checkReach, displayWidth, renderTable, runDoctor } from "../src/doctor.js";
import { WELL_KNOWN_URL } from "../src/constants.js";
import claudeCode from "../src/hosts/claude-code.js";
import claudeDesktop from "../src/hosts/claude-desktop.js";
import codex from "../src/hosts/codex.js";
import cursor from "../src/hosts/cursor.js";
import gemini from "../src/hosts/gemini.js";
import vscode from "../src/hosts/vscode.js";
import devin from "../src/hosts/devin.js";
import { tempHome } from "./helpers.js";

const answer = (status) => async () => ({ ok: status >= 200 && status < 300, status });

test("checkReach calls the well-known URL once and is ok on 200", async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };
  const row = await checkReach(fetchFn);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, WELL_KNOWN_URL);
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.deepEqual(row, { id: "plgn", check: "reach", status: "ok", key: "doctor.reachOk", vars: { url: WELL_KNOWN_URL } });
});

test("checkReach is red on 500 and on a network error", async () => {
  const bad = await checkReach(answer(500));
  assert.equal(bad.status, "fail");
  assert.equal(bad.key, "doctor.reachFail");
  assert.equal(bad.vars.url, WELL_KNOWN_URL);
  assert.equal(String(bad.vars.detail), "500");
  const down = await checkReach(async () => {
    throw new Error("getaddrinfo ENOTFOUND");
  });
  assert.equal(down.status, "fail");
  assert.equal(down.key, "doctor.reachFail");
  assert.equal(down.vars.detail, "getaddrinfo ENOTFOUND");
});

test("runDoctor is ok when plgn answers and every detected host is set", async () => {
  const h = tempHome();
  try {
    const res = await cursor.apply(h.ctx, { dryRun: false });
    assert.equal(res.status, "added");
    const out = await runDoctor(h.ctx, { hosts: [cursor], fetch: answer(200) });
    assert.equal(out.ok, true);
    assert.equal(out.rows[0].check, "reach");
    assert.ok(out.rows.some((r) => r.id === "cursor" && r.check === "entry" && r.status === "ok"));
    assert.ok(out.rows.every((r) => r.status !== "fail"));
  } finally {
    h.cleanup();
  }
});

test("runDoctor is not ok when a detected host has no plgn entry", async () => {
  const h = tempHome();
  try {
    h.put(".cursor/mcp.json", JSON.stringify({ mcpServers: {} }));
    const out = await runDoctor(h.ctx, { hosts: [cursor], fetch: answer(200) });
    assert.equal(out.ok, false);
    assert.ok(out.rows.some((r) => r.id === "cursor" && r.check === "entry" && r.status === "fail"));
  } finally {
    h.cleanup();
  }
});

test("hosts that are not found give skip rows and keep ok true", async () => {
  const h = tempHome();
  try {
    const hosts = [claudeCode, codex, cursor, gemini, devin, vscode, claudeDesktop];
    const out = await runDoctor(h.ctx, { hosts, fetch: answer(200) });
    assert.equal(out.ok, true);
    for (const host of hosts) {
      const rows = out.rows.filter((r) => r.id === host.id);
      assert.ok(rows.length > 0, host.id);
      assert.ok(rows.every((r) => r.status === "skip"), host.id);
    }
  } finally {
    h.cleanup();
  }
});

test("a host doctor that throws becomes one fail row and the others still run", async () => {
  const h = tempHome();
  try {
    const broken = { id: "broken", doctor: async () => { throw new Error("boom"); } };
    const fine = { id: "fine", doctor: async () => [{ id: "fine", check: "found", status: "skip", key: "doctor.notFound" }] };
    const out = await runDoctor(h.ctx, { hosts: [broken, fine], fetch: answer(200) });
    const brokenRows = out.rows.filter((r) => r.id === "broken");
    assert.deepEqual(brokenRows, [
      { id: "broken", check: "config", status: "fail", key: "doctor.error", vars: { detail: "boom" } },
    ]);
    assert.ok(out.rows.some((r) => r.id === "fine"));
    assert.equal(out.ok, false);
  } finally {
    h.cleanup();
  }
});

const sample = [
  { id: "plgn", check: "reach", status: "ok", key: "doctor.reachOk", vars: { url: "https://x.example" } },
  { id: "cursor", check: "config", status: "ok", key: "doctor.fileFound", vars: { file: "/a/b.json" } },
  { id: "cursor", check: "entry", status: "fail", key: "doctor.entryMissing" },
  { id: "codex", check: "found", status: "skip", key: "doctor.notFound" },
];
const labels = { cursor: "Cursor", codex: "Codex CLI" };

test("renderTable with color off has no escape codes and one line per row plus the summary", () => {
  const out = renderTable(sample, { lang: "en", color: false, labels });
  assert.ok(!out.includes("\u001b"));
  const lines = out.split("\n");
  assert.equal(lines.length, sample.length + 1);
  assert.ok(lines[0].startsWith("plgn"));
  assert.ok(lines[1].startsWith("Cursor"));
  assert.ok(lines[0].includes("✔") && lines[2].includes("✘") && lines[3].includes("–"));
  // The check column is padded, so the marks line up.
  assert.equal(lines[1].indexOf("config file"), lines[2].indexOf("plgn entry"));
  assert.equal(lines[1].indexOf("✔"), lines[2].indexOf("✘"));
  assert.ok(lines[4 - 1].includes("tool"));
  assert.equal(lines[lines.length - 1], "Problems: 1. Run npx plgn-setup to fix them.");
  const good = renderTable(sample.slice(0, 2), { lang: "en", color: false, labels });
  assert.equal(good.split("\n").pop(), "All good.");
});

test("renderTable in Arabic shows the fail count in Western digits", () => {
  const out = renderTable(sample, { lang: "ar", color: false, labels });
  const last = out.split("\n").pop();
  assert.ok(last.includes("1"));
  assert.ok(!/[٠-٩۰-۹]/.test(out));
  assert.match(last, /[؀-ۿ]/);
});

test("renderTable pads by visible width when color is on", () => {
  const out = renderTable(sample, { lang: "en", color: true, labels });
  assert.ok(out.includes("\u001b["));
  const plain = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");
  const lines = out.split("\n").map(plain);
  assert.equal(lines[1].indexOf("✔"), lines[2].indexOf("✘"));
});

test("checkReach shows the cause code when fetch rejects with one", async () => {
  const down = await checkReach(async () => {
    throw new Error("fetch failed", { cause: Object.assign(new Error("getaddrinfo ENOTFOUND useplgn.com"), { code: "ENOTFOUND" }) });
  });
  assert.equal(down.status, "fail");
  assert.equal(down.vars.detail, "ENOTFOUND");
  const plain = await checkReach(async () => {
    throw new Error("fetch failed", { cause: new Error("no code here") });
  });
  assert.equal(plain.vars.detail, "fetch failed");
});

test("renderTable pads by display width: combining marks and zero-width characters take no room", () => {
  assert.equal(displayWidth("شدّة"), 3);
  assert.equal(displayWidth("a​b﻿"), 2);
  assert.equal(displayWidth("Cursor"), 6);
  const rows = [
    { id: "a", check: "config", status: "ok", key: "doctor.fileFound", vars: { file: "/x" } },
    { id: "b", check: "entry", status: "fail", key: "doctor.entryMissing" },
  ];
  // "شدّة" has a shadda (U+0651, category Mn): four code points, three seen. "abc" is three seen too.
  const out = renderTable(rows, { lang: "ar", color: false, labels: { a: "شدّة", b: "abc" } });
  const lines = out.split("\n");
  const nameCell = (s) => s.slice(0, s.indexOf("  "));
  assert.equal(displayWidth(nameCell(lines[0])), displayWidth(nameCell(lines[1])));
  // One combining mark more in line 0, so its mark sits one code unit further right, and no further.
  assert.equal(lines[0].indexOf("✔"), lines[1].indexOf("✘") + 1);
  assert.ok(lines.at(-1).startsWith("عدد المشاكل: 1."));
  assert.ok(lines.at(-1).includes("npx plgn-setup"));
});
