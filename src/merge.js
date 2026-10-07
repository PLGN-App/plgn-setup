import { parse, stringify } from "smol-toml";

// Merge the plgn entry into a JSON or TOML config. Everything else in the file stays.
// "same" returns the input text untouched, so the caller neither backs up nor writes.

export class MergeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MergeError";
    this.code = code; // "PARSE" | "SHAPE" | "UNSAFE"
  }
}

const isPlain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v !== null && typeof v === "object") {
    if (typeof v.toJSON === "function") return v.toJSON();
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonical(v[k]);
    return out;
  }
  return v;
}

// Key order and prototypes do not matter.
export function sameValue(a, b) {
  if (a === undefined || b === undefined) return a === b;
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

const BOM = "\uFEFF";
const blank = (text) => text == null || text.trim() === "";

function parseJson(text) {
  const body = (text ?? "").replace(/^\uFEFF/, "");
  if (body.trim() === "") return {};
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new MergeError("PARSE", `Not valid JSON: ${e.message}`);
  }
}

function parseToml(text) {
  try {
    return parse(text ?? "");
  } catch (e) {
    throw new MergeError("PARSE", `Not valid TOML: ${e.message}`);
  }
}

// Walks path, creating missing containers when asked. Returns the container or undefined.
function walk(root, path, create) {
  if (!isPlain(root)) throw new MergeError("SHAPE", "The file is not an object at the top.");
  let node = root;
  for (const key of path) {
    if (node[key] === undefined) {
      if (!create) return undefined;
      node[key] = {};
    } else if (!isPlain(node[key])) {
      throw new MergeError("SHAPE", `"${path.join(".")}" is not an object.`);
    }
    node = node[key];
  }
  return node;
}

// One pass over a JSON string or a number; strings are matched so their digits are skipped.
const NUMBER_OR_STRING = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export function mergeJson(text, { path, name, entry }) {
  const root = parseJson(text);
  const container = walk(root, path, true);
  if (sameValue(container[name], entry)) return { text, change: "same" };
  const body = (text ?? "").replace(/^\uFEFF/, "");
  // Re-serialising would write these numbers differently (1.0, 1e5, past 2^53); refuse instead.
  for (const m of body.match(NUMBER_OR_STRING) ?? []) {
    if (m[0] !== '"' && String(Number(m)) !== m) {
      throw new MergeError("UNSAFE", `A number in the file would be rewritten (${m}); nothing was written.`);
    }
  }
  const existed = Object.hasOwn(container, name);
  container[name] = entry;

  const indent = body.match(/^([ \t]+)\S/m)?.[1] ?? "  ";
  const eol = body.includes("\r\n") ? "\r\n" : "\n";
  let out = JSON.stringify(root, null, indent) + "\n";
  if (eol === "\r\n") out = out.replace(/\n/g, "\r\n");
  if (text != null && text.startsWith(BOM)) out = BOM + out;
  return { text: out, change: existed ? "updated" : "added" };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function mergeToml(text, { path, name, entry }) {
  // A BOM stays in front; everything below works on the text after it.
  const bom = !blank(text) && text.startsWith(BOM) ? BOM : "";
  const original = blank(text) ? "" : text.slice(bom.length);
  const data = parseToml(original);
  const container = walk(data, path, false);
  const current = container?.[name];
  if (current !== undefined && sameValue(current, entry)) return { text, change: "same" };

  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const header = `[${[...path, name].join(".")}]`;
  // The target table's header and keys only; stringify may emit empty parent headers first.
  const raw = stringify(nest([...path, name], entry)).split("\n");
  const start = raw.indexOf(header);
  if (start < 0) throw new MergeError("UNSAFE", "Could not build the plgn table.");
  const blockLines = raw.slice(start);
  while (blockLines.length && blockLines[blockLines.length - 1] === "") blockLines.pop();
  const block = blockLines.join(eol) + eol;

  const lines = original.split(/(?<=\n)/);
  const headerRe = new RegExp(
    "^[ \\t]*\\[\\s*" + [...path, name].map(escapeRe).join("\\s*\\.\\s*") + "\\s*\\]\\s*(#.*)?\\r?\\n?$"
  );
  const at = lines.findIndex((l) => headerRe.test(l));

  let next;
  if (at >= 0) {
    let end = lines.findIndex((l, i) => i > at && l.trimStart().startsWith("["));
    if (end < 0) end = lines.length;
    let last = end - 1;
    // Blank and comment lines right before the next header belong to what follows.
    while (last > at && /^\s*(#.*)?\r?\n?$/.test(lines[last])) last--;
    const tail = lines.slice(last + 1);
    let swap = block;
    if (tail.length === 0 && !/\n$/.test(lines[last])) swap = block.slice(0, -eol.length);
    next = lines.slice(0, at).join("") + swap + tail.join("");
  } else if (original === "") {
    next = block;
  } else {
    next = original + (/\n$/.test(original) ? "" : eol) + eol + block;
  }

  let after;
  try {
    after = parse(next);
  } catch {
    throw new MergeError("UNSAFE", "The edited file no longer parses; nothing was written.");
  }
  const before = parse(original);
  const mine = walk(after, path, false)?.[name];
  for (const root of [before, after]) {
    const c = walk(root, path, false);
    if (c) delete c[name];
  }
  // A container this edit created, now empty, is not a difference.
  if (!walk(before, path, false)) pruneEmpty(after, path);
  if (!sameValue(mine, entry) || !sameValue(before, after)) {
    throw new MergeError("UNSAFE", "The edit would change more than plgn; nothing was written.");
  }
  return { text: bom + next, change: at >= 0 ? "updated" : "added" };
}

function pruneEmpty(root, path) {
  for (let n = path.length; n > 0; n--) {
    const parent = walk(root, path.slice(0, n - 1), false);
    const child = parent?.[path[n - 1]];
    if (!isPlain(child) || Object.keys(child).length) return;
    delete parent[path[n - 1]];
  }
}

function nest(keys, value) {
  return keys.reduceRight((acc, k) => ({ [k]: acc }), value);
}

export function readEntry(text, { format, path, name }) {
  if (blank(text)) return undefined;
  const root = format === "toml" ? parseToml(text) : parseJson(text);
  return walk(root, path, false)?.[name];
}
