import fs from "node:fs";
import path from "node:path";

// Backups never overwrite an earlier one, and a write goes to a temp file first,
// so a crash never leaves half a config.

const pad = (n) => String(n).padStart(2, "0");

// Local time, YYYYMMDD-HHmmss.
export function stamp(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

// Returns the backup path, or null when the file does not exist.
export function backupFile(file, { now }) {
  if (!fs.existsSync(file)) return null;
  const base = `${file}.plgn-backup-${stamp(now)}`;
  for (let n = 1; ; n++) {
    const dest = n === 1 ? base : `${base}-${n}`;
    try {
      fs.copyFileSync(file, dest, fs.constants.COPYFILE_EXCL);
      return dest;
    } catch (e) {
      if (e?.code !== "EEXIST") throw e;
    }
  }
}

export function writeConfig(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.plgn-tmp-${process.pid}`;
  try {
    fs.writeFileSync(tmp, text, "utf8");
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
}
