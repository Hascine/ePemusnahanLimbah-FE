// Utilities to handle timestamps that are stored as Jakarta local time (UTC+7) with explicit offset
// The goal: when a timestamp string like '2025-09-28T15:04:05+07:00' is received from backend,
// display the same wall-clock components (date/time) without converting to the client's timezone.

function pad(n) { return n < 10 ? '0' + n : String(n); }

export function parseJakartaIso(iso) {
  if (!iso || typeof iso !== 'string') return null;
  // Accept forms: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss[.sss][Z|(+|-)HH:MM]
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: m[4] ? Number(m[4]) : 0,
    minute: m[5] ? Number(m[5]) : 0,
    second: m[6] ? Number(m[6]) : 0
  };
}


// Build Jakarta ISO string from a JS Date (taking local components as-is)
export function toJakartaIsoFromLocal(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+07:00`;
}

// Convert any ISO timestamp (with Z or an offset) into Jakarta wall-clock components
// and return an object { year, month, day, hour, minute, second } in Jakarta time.
export function isoToJakartaParts(iso) {
  if (!iso) return null;
  // Try to parse with Date — the Date will represent the instant
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // Fallback: try parsing as local Jakarta-like string
    return parseJakartaIso(iso);
  }
  // Use UTC components of the instant, then add +7 hours to get Jakarta wall-clock
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;
  let day = d.getUTCDate();
  let hh = d.getUTCHours();
  let mm = d.getUTCMinutes();
  let ss = d.getUTCSeconds();

  // add timezone offset for Jakarta (+7)
  hh += 7;
  // Normalize overflow/underflow
  while (ss >= 60) { ss -= 60; mm += 1; }
  while (mm >= 60) { mm -= 60; hh += 1; }
  while (hh >= 24) { hh -= 24; day += 1; }

  // handle month/day overflow with simple Date math
  const recon = new Date(Date.UTC(y, m - 1, day, hh, mm, ss));
  return {
    year: recon.getUTCFullYear(),
    month: recon.getUTCMonth() + 1,
    day: recon.getUTCDate(),
    hour: recon.getUTCHours(),
    minute: recon.getUTCMinutes(),
    second: recon.getUTCSeconds()
  };
}

// Update formatters to prefer isoToJakartaParts so any incoming ISO is converted to Jakarta wall-clock
export function formatDateID(iso) {
  const p = isoToJakartaParts(iso);
  if (!p) return '';
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

export function formatDateTimeID(iso) {
  const p = isoToJakartaParts(iso);
  if (!p) return '';
  return `${pad(p.day)}/${pad(p.month)}/${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

// Format time (hours:minutes:seconds) in Jakarta wall-clock from an ISO/time string
export function formatTimeID(iso) {
  const p = isoToJakartaParts(iso);
  if (!p) return '';
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

export function formatTimeHHMM(iso) {
  const p = isoToJakartaParts(iso);
  if (!p) return '';
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export default {
  parseJakartaIso,
  formatDateID,
  formatDateTimeID,
  formatTimeHHMM,
  toJakartaIsoFromLocal
};
