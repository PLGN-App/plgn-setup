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
  // Write through a symlink to the real file, and keep the file's permissions (often 0600: it can hold API keys).
  let target = file;
  let mode = null;
  if (fs.existsSync(file)) {
    target = fs.realpathSync(file);
    mode = fs.statSync(target).mode & 0o777;
  }
  const tmp = `${target}.plgn-tmp-${process.pid}`;
  try {
    fs.writeFileSync(tmp, text, "utf8");
    if (mode !== null) fs.chmodSync(tmp, mode);
    fs.renameSync(tmp, target);
  } catch (e) {
    // Remove the temp file if one was made; a cleanup error must never hide the write error.
    try {
      fs.rmSync(tmp, { force: true });
    } catch {}
    throw e;
  }
}
