import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { MCP_URL } from "../src/constants.js";
import codex from "../src/hosts/codex.js";
import { detectCases, mergeCases } from "./host-cases.js";
import { tempHome } from "./helpers.js";

const others = '# my settings\nmodel = "x"\n\n[mcp_servers.docs]\ncommand = "npx"\n';

mergeCases(codex, {
  others,
  old: '[mcp_servers.plgn]\nurl = "https://old.example/mcp"\n',
  broken: "[mcp_servers",
});
detectCases(codex, { dirs: [".codex"], bin: "codex" });

test("codex configPath follows CODEX_HOME", () => {
  const h = tempHome();
  try {
    assert.equal(codex.configPath(h.ctx), path.join(h.home, ".codex", "config.toml"));
    const custom = path.join(h.home, "elsewhere");
    h.ctx.env.CODEX_HOME = custom;
    assert.equal(codex.configPath(h.ctx), path.join(custom, "config.toml"));
    h.ctx.env.CODEX_HOME = "";
    assert.equal(codex.configPath(h.ctx), path.join(h.home, ".codex", "config.toml"));
  } finally {
    h.cleanup();
  }
});

test("codex merge keeps the comment line byte for byte", () => {
  const out = codex.merge(others).text;
  assert.ok(out.startsWith("# my settings\nmodel = \"x\"\n"));
  assert.ok(out.includes(`url = "${MCP_URL}"`));
});

test("codex nextStep names the login command in English and Arabic", () => {
  for (const lang of ["en", "ar"]) {
    const s = codex.nextStep(lang);
    assert.ok(s.includes("codex mcp login plgn"), lang);
    assert.ok(s.includes("Codex CLI"), lang);
  }
  assert.notEqual(codex.nextStep("en"), codex.nextStep("ar"));
});
