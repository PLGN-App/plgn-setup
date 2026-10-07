import picocolors from "picocolors";
import { WELL_KNOWN_URL } from "./constants.js";
import { t } from "./i18n.js";

// The only file that calls fetch: one public GET, no body, no header, nothing about the person.
export async function checkReach(fetchFn) {
  const url = WELL_KNOWN_URL;
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) return { id: "plgn", check: "reach", status: "ok", key: "doctor.reachOk", vars: { url } };
    return { id: "plgn", check: "reach", status: "fail", key: "doctor.reachFail", vars: { url, detail: String(res.status) } };
  } catch (e) {
    return {
      id: "plgn",
      check: "reach",
      status: "fail",
      key: "doctor.reachFail",
      vars: { url, detail: String(e?.message ?? e) },
    };
  }
}

export async function runDoctor(ctx, { hosts, fetch: fetchFn }) {
  const rows = [await checkReach(fetchFn)];
  for (const host of hosts) {
    try {
      rows.push(...(await host.doctor(ctx)));
    } catch (e) {
      // One odd host never hides the others (Decision 11).
      rows.push({
        id: host.id,
        check: "config",
        status: "fail",
        key: "doctor.error",
        vars: { detail: String(e?.message ?? e) },
      });
    }
  }
  return { rows, ok: rows.every((r) => r.status !== "fail") };
}

const MARKS = { ok: "✔", fail: "✘", skip: "–" };

export function renderTable(rows, { lang, color, labels }) {
  const pc = picocolors.createColors(color);
  const paint = { ok: pc.green, fail: pc.red, skip: pc.dim };
  const cells = rows.map((r) => ({
    row: r,
    name: r.id === "plgn" ? "plgn" : (labels[r.id] ?? r.id),
    check: t(lang, `check.${r.check}`),
    text: t(lang, r.key, r.vars),
  }));
  // Pad the plain text first, then colour only the one-character mark: escape codes never count.
  const nameWidth = Math.max(0, ...cells.map((c) => c.name.length));
  const checkWidth = Math.max(0, ...cells.map((c) => c.check.length));
  const lines = cells.map(
    (c) =>
      `${c.name.padEnd(nameWidth)}  ${c.check.padEnd(checkWidth)}  ${paint[c.row.status](MARKS[c.row.status])}  ${c.text}`,
  );
  const failed = rows.filter((r) => r.status === "fail").length;
  lines.push(failed === 0 ? t(lang, "doctor.summaryOk") : t(lang, "doctor.summaryFail", { count: String(failed) }));
  return lines.join("\n");
}
