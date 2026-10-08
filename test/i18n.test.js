import test from "node:test";
import assert from "node:assert/strict";
import { LANGS, phrases, t } from "../src/i18n.js";

const all = () => LANGS.flatMap((lang) => Object.entries(phrases[lang]).map(([key, text]) => ({ lang, key, text })));
const holes = (s) => (s.match(/\{\w+\}/g) ?? []).sort();

test("t fills placeholders and keeps Western digits in Arabic", () => {
  const out = t("ar", "failed", { label: "x", cmd: "y", detail: 42 });
  assert.ok(out.includes("42"));
  assert.ok(out.includes("x") && out.includes("y"));
  assert.equal(t("en", "failed", { label: "Cursor", cmd: "go", detail: 7 }), "Cursor: go failed: 7");
  assert.ok(!/\{\w+\}/.test(out));
});

test("t throws on an unknown key and an unknown language", () => {
  assert.throws(() => t("en", "no.such.key"));
  assert.throws(() => t("fr", "intro"));
  assert.throws(() => t("ar", "no.such.key"));
});

test("every English key has an Arabic twin and the other way round", () => {
  assert.deepEqual(LANGS, ["en", "ar"]);
  assert.deepEqual(Object.keys(phrases.en).sort(), Object.keys(phrases.ar).sort());
  for (const key of Object.keys(phrases.en)) {
    assert.deepEqual(holes(phrases.ar[key]), holes(phrases.en[key]), `placeholders of ${key}`);
  }
});

test("no phrase holds Arabic-Indic digits", () => {
  for (const { lang, key, text } of all()) {
    assert.ok(!/[٠-٩۰-۹]/.test(text), `${lang}.${key}`);
  }
});

test("no phrase says credits", () => {
  for (const { key, text } of all().filter((p) => p.lang === "en")) {
    assert.ok(!/credit/i.test(text), `en.${key}`);
  }
  for (const { key, text } of all().filter((p) => p.lang === "ar")) {
    assert.ok(!/رصيد|كريدت/.test(text), `ar.${key}`);
  }
});

test("plgn is always lowercase", () => {
  for (const { lang, key, text } of all()) {
    for (const m of text.match(/plgn/gi) ?? []) assert.equal(m, "plgn", `${lang}.${key}`);
  }
});

test("every Arabic phrase holds Arabic letters when its English twin has words outside the placeholders", () => {
  for (const [key, en] of Object.entries(phrases.en)) {
    const words = en.replace(/\{\w+\}/g, "").match(/[A-Za-z]{2,}/g);
    if (!words) continue;
    assert.match(phrases.ar[key], /[؀-ۿ]/, `ar.${key}`);
  }
});

test("Arabic uses the feminine verb before feminine nouns", () => {
  for (const [key, text] of Object.entries(phrases.ar)) {
    assert.doesNotMatch(text, /(سيتم|يتم) (إضافة|كتابة)/, `ar.${key}`);
  }
  assert.ok(phrases.ar.pick.includes("ربطها"));
});

test("commands reach a phrase only through {vars}: no phrase spells npx or a leading / command", () => {
  for (const { lang, key, text } of all()) {
    assert.ok(!/npx /.test(text), `${lang}.${key} spells npx`);
    assert.ok(!/(^|[\s،,])\/[a-z]/.test(text), `${lang}.${key} spells a / command`);
    assert.ok(!/MCP: List Servers/.test(text), `${lang}.${key} spells a palette command`);
  }
});

test("the devin phrases name Windsurf as the old name and claudeDesktop has the + Add click", () => {
  for (const lang of LANGS) {
    assert.ok(phrases[lang]["next.devin"].startsWith("Devin (formerly Windsurf)"), lang);
    assert.ok(phrases[lang]["devin.oldPath"].includes("Windsurf"), lang);
    assert.ok(phrases[lang]["next.claudeDesktop"].includes("+ Add"), lang);
  }
  assert.equal(phrases.ar["doctor.summaryFail"], "عدد المشاكل: {count}. شغّل {cmd} لإصلاحها.");
});

test("the skills phrases exist in both languages", () => {
  const keys = ["skills.ask", "skills.same", "skills.would", "skills.done", "skills.skipped", "skills.error",
    "doctor.skillsOk", "doctor.skillsPartial", "doctor.skillsNone", "check.skills"];
  for (const lang of LANGS) {
    for (const key of keys) assert.equal(typeof phrases[lang][key], "string", `${lang}.${key}`);
  }
  assert.equal(t("en", "skills.ask", { count: 7, label: "Codex CLI" }), "Install plgn's 7 skills (commands and roles) for Codex CLI?");
  const ar = t("ar", "skills.ask", { count: 7, label: "Codex CLI" });
  assert.ok(ar.includes("7") && ar.includes("Codex CLI"));
});

test("help names --no-skills in both languages", () => {
  for (const lang of LANGS) assert.ok(phrases[lang].help.includes("--no-skills"), lang);
});
