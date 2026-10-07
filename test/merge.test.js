import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "smol-toml";
import { MergeError, mergeJson, mergeToml, readEntry, sameValue } from "../src/merge.js";

const entry = { url: "https://useplgn.com/api/mcp" };
const jsonOpts = { path: ["mcpServers"], name: "plgn", entry };
const tomlOpts = { path: ["mcp_servers"], name: "plgn", entry };

const throwsMerge = (fn, code) =>
  assert.throws(fn, (e) => e instanceof MergeError && e.code === code);

test("mergeJson adds plgn to a missing, empty or blank file", () => {
  for (const input of [null, "", "  \n "]) {
    const r = mergeJson(input, jsonOpts);
    assert.equal(r.change, "added");
    assert.deepEqual(JSON.parse(r.text), { mcpServers: { plgn: entry } });
    assert.ok(r.text.endsWith("}\n"));
    assert.ok(r.text.includes('\n  "mcpServers"'));
  }
});

test("mergeJson keeps other servers and other settings", () => {
  const input = JSON.stringify(
    { theme: "dark", mcpServers: { other: { command: "x", args: ["a"] } }, last: 1 },
    null,
    2
  );
  const r = mergeJson(input, jsonOpts);
  assert.equal(r.change, "added");
  assert.deepEqual(JSON.parse(r.text), {
    theme: "dark",
    mcpServers: { other: { command: "x", args: ["a"] }, plgn: entry },
    last: 1,
  });
  assert.deepEqual(Object.keys(JSON.parse(r.text).mcpServers), ["other", "plgn"]);
});

test("mergeJson updates an old plgn entry and keeps its key position", () => {
  const input = JSON.stringify(
    { mcpServers: { a: { x: 1 }, plgn: { url: "https://old.example/mcp", extra: true }, z: { y: 2 } } },
    null,
    2
  );
  const r = mergeJson(input, jsonOpts);
  assert.equal(r.change, "updated");
  const out = JSON.parse(r.text);
  assert.deepEqual(Object.keys(out.mcpServers), ["a", "plgn", "z"]);
  assert.deepEqual(out.mcpServers.plgn, entry);
});

test("mergeJson second merge is same and returns the text unchanged", () => {
  const first = mergeJson('{"mcpServers":{"o":{"a":1}}}', jsonOpts);
  const second = mergeJson(first.text, jsonOpts);
  assert.equal(second.change, "same");
  assert.equal(second.text, first.text);
  // key order inside the entry does not matter
  const odd = '{"mcpServers":{"plgn":{"url":"https://useplgn.com/api/mcp"}}} ';
  const third = mergeJson(odd, jsonOpts);
  assert.equal(third.change, "same");
  assert.equal(third.text, odd);
});

test("mergeJson keeps a 4-space indent, CRLF and a BOM", () => {
  const input = '﻿{\r\n    "mcpServers": {\r\n        "o": {\r\n            "a": 1\r\n        }\r\n    }\r\n}';
  const r = mergeJson(input, jsonOpts);
  assert.ok(r.text.startsWith("﻿{"));
  assert.ok(r.text.includes('\r\n    "mcpServers"'));
  assert.ok(r.text.includes('\r\n        "plgn"'));
  assert.ok(!/[^\r]\n/.test(r.text.slice(1)));
  assert.ok(r.text.endsWith("}\r\n"));
  assert.deepEqual(JSON.parse(r.text.slice(1)).mcpServers.plgn, entry);
  assert.equal(mergeJson(r.text, jsonOpts).change, "same");
});

test("mergeJson throws PARSE on bad JSON and on JSON with comments", () => {
  throwsMerge(() => mergeJson("{ nope", jsonOpts), "PARSE");
  throwsMerge(() => mergeJson('{\n  // keep me\n  "mcpServers": {}\n}', jsonOpts), "PARSE");
});

test("mergeJson throws SHAPE when the container is an array or a string", () => {
  throwsMerge(() => mergeJson('{"mcpServers": []}', jsonOpts), "SHAPE");
  throwsMerge(() => mergeJson('{"mcpServers": "x"}', jsonOpts), "SHAPE");
  throwsMerge(() => mergeJson('{"mcpServers": null}', jsonOpts), "SHAPE");
  throwsMerge(() => mergeJson("[1]", jsonOpts), "SHAPE");
  throwsMerge(
    () => mergeJson('{"mcp": {"servers": []}}', { path: ["mcp", "servers"], name: "plgn", entry }),
    "SHAPE"
  );
});

test("mergeToml appends a table and keeps every other byte, comments included", () => {
  const input = '# my config\nmodel = "x"  # inline\n\n[mcp_servers.other]\ncommand = "y"\n';
  const r = mergeToml(input, tomlOpts);
  assert.equal(r.change, "added");
  assert.ok(r.text.startsWith(input));
  assert.equal(r.text.slice(input.length), '\n[mcp_servers.plgn]\nurl = "https://useplgn.com/api/mcp"\n');
  assert.ok(sameValue(parse(r.text).mcp_servers.plgn, entry));

  const added = mergeToml(null, tomlOpts);
  assert.equal(added.change, "added");
  assert.equal(added.text, '[mcp_servers.plgn]\nurl = "https://useplgn.com/api/mcp"\n');

  const noNewline = mergeToml('a = 1', tomlOpts);
  assert.ok(noNewline.text.startsWith("a = 1\n\n[mcp_servers.plgn]"));

  const crlf = mergeToml('a = 1\r\n', tomlOpts);
  assert.ok(crlf.text.startsWith("a = 1\r\n\r\n[mcp_servers.plgn]\r\n"));
  assert.ok(!/[^\r]\n/.test(crlf.text));
});

test("mergeToml swaps an old plgn table in place", () => {
  const input =
    '# top\n[mcp_servers.a]\ncommand = "a"\n\n[ mcp_servers.plgn ]  # old one\nurl = "https://old.example/mcp"\nextra = 1\n\n# about b\n[mcp_servers.b]\ncommand = "b"\n';
  const r = mergeToml(input, tomlOpts);
  assert.equal(r.change, "updated");
  assert.equal(
    r.text,
    '# top\n[mcp_servers.a]\ncommand = "a"\n\n[mcp_servers.plgn]\nurl = "https://useplgn.com/api/mcp"\n\n# about b\n[mcp_servers.b]\ncommand = "b"\n'
  );
});

test("mergeToml second merge is same and returns the text unchanged", () => {
  const first = mergeToml('# c\nx = 1\n', tomlOpts);
  const second = mergeToml(first.text, tomlOpts);
  assert.equal(second.change, "same");
  assert.equal(second.text, first.text);
});

test("mergeToml throws PARSE on bad TOML and UNSAFE on an inline mcp_servers table", () => {
  throwsMerge(() => mergeToml("a = = 1", tomlOpts), "PARSE");
  throwsMerge(() => mergeToml('mcp_servers = { other = { command = "x" } }\n', tomlOpts), "UNSAFE");
  throwsMerge(() => mergeToml("mcp_servers = 5\n", tomlOpts), "SHAPE");
});

test("readEntry returns the entry or undefined for both formats", () => {
  const j = { format: "json", path: ["mcpServers"], name: "plgn" };
  const m = { format: "toml", path: ["mcp_servers"], name: "plgn" };
  assert.ok(sameValue(readEntry(JSON.stringify({ mcpServers: { plgn: entry } }), j), entry));
  assert.equal(readEntry('{"mcpServers":{}}', j), undefined);
  assert.equal(readEntry(null, j), undefined);
  assert.equal(readEntry("{}", j), undefined);
  assert.ok(sameValue(readEntry('[mcp_servers.plgn]\nurl = "https://useplgn.com/api/mcp"\n', m), entry));
  assert.equal(readEntry("a = 1\n", m), undefined);
  assert.equal(readEntry(null, m), undefined);
  throwsMerge(() => readEntry('{"mcpServers": []}', j), "SHAPE");
  throwsMerge(() => readEntry("{ nope", j), "PARSE");
});

test("sameValue ignores key order and prototypes", () => {
  assert.equal(sameValue({ a: 1, b: { c: [1, 2], d: 3 } }, { b: { d: 3, c: [1, 2] }, a: 1 }), true);
  const bare = Object.create(null);
  bare.url = "u";
  assert.equal(sameValue(bare, { url: "u" }), true);
  assert.equal(sameValue({ a: [1, 2] }, { a: [2, 1] }), false);
  assert.equal(sameValue({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(sameValue(undefined, {}), false);
});
