import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "smol-toml";
import { MCP_URL, SERVER_NAME } from "../src/constants.js";
import { MergeError, readEntry, sameValue } from "../src/merge.js";
import { tempHome } from "./helpers.js";

// Shared cases for every file host. No test here runs on its own: a host test file calls these.
// others / old / broken are file texts in the host's own format.

const parseAs = (host, text) => (host.format === "toml" ? parse(text) : JSON.parse(text));

// The whole document with the plgn entry taken out, so "everything else" can be compared.
function withoutPlgn(host, text) {
  const doc = parseAs(host, text);
  let node = doc;
  for (const key of host.path) {
    node = node?.[key];
    if (node === undefined) return doc;
  }
  if (node && typeof node === "object") delete node[SERVER_NAME];
  return doc;
}

const readOurs = (host, text) => readEntry(text, { format: host.format, path: host.path, name: SERVER_NAME });
const countUrl = (text) => text.split(MCP_URL).length - 1;

function checkResult(host, text, original) {
  assert.equal(countUrl(text), 1, "the MCP URL appears exactly once");
  assert.ok(sameValue(readOurs(host, text), host.entry), "the plgn entry is ours");
  if (original != null) {
    assert.ok(sameValue(withoutPlgn(host, text), withoutPlgn(host, original)), "everything else is kept");
  }
  const again = host.merge(text);
  assert.equal(again.change, "same");
  assert.equal(again.text, text);
}

export function mergeCases(host, { others, old, broken }) {
  test(`${host.id} merge: empty file`, () => {
    for (const input of [null, ""]) {
      const r = host.merge(input);
      assert.equal(r.change, "added");
      checkResult(host, r.text, null);
    }
  });

  test(`${host.id} merge: keeps other servers`, () => {
    const r = host.merge(others);
    assert.equal(r.change, "added");
    checkResult(host, r.text, others);
  });

  test(`${host.id} merge: updates an old plgn entry`, () => {
    const r = host.merge(old);
    assert.equal(r.change, "updated");
    checkResult(host, r.text, old);
  });

  test(`${host.id} merge: unparsable file throws MergeError`, () => {
    assert.throws(
      () => host.merge(broken),
      (e) => e instanceof MergeError && ["PARSE", "SHAPE"].includes(e.code),
    );
  });
}

export function detectCases(host, { dirs, bin, platform }) {
  test(`${host.id} detect: empty home is false`, () => {
    const h = tempHome(platform ? { platform } : {});
    try {
      assert.equal(host.detect(h.ctx), false);
    } finally {
      h.cleanup();
    }
  });

  for (const dir of dirs) {
    test(`${host.id} detect: config folder is true (${dir})`, () => {
      const h = tempHome(platform ? { platform } : {});
      try {
        h.put(`${dir}/.keep`, "");
        assert.equal(host.detect(h.ctx), true);
      } finally {
        h.cleanup();
      }
    });
  }

  if (bin) {
    test(`${host.id} detect: binary on PATH is true`, () => {
      const h = tempHome(platform ? { platform } : {});
      try {
        h.addBin(bin);
        assert.equal(host.detect(h.ctx), true);
      } finally {
        h.cleanup();
      }
    });
  }
}
