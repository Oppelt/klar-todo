// Date helpers. Dates are local 'YYYY-MM-DD' strings, times 'HH:MM'.
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
export const weekday = (s) => parseYmd(s).getDay(); // 0 = So
export const startOfWeek = (s) => addDays(s, -((weekday(s) + 6) % 7)); // Monday
export function addMonths(s, n, anchorDay) {
  const d = parseYmd(s);
  const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last));
  return ymd(t);
}

export const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WD_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MON_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

export function fmtLong(s) {
  const d = parseYmd(s);
  return `${WD_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
export function fmtRel(s) {
  const n = diffDays(today(), s);
  if (n === 0) return 'Heute';
  if (n === 1) return 'Morgen';
  if (n === -1) return 'Gestern';
  if (n === 2) return 'Übermorgen';
  const d = parseYmd(s);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  if (n > 2 && n < 7) return WD_LONG[d.getDay()];
  return `${WD[d.getDay()]}, ${d.getDate()}. ${MON_SHORT[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()}`;
}

// ---- recurrence ----
export const REPEATS = [
  ['', 'Nie'], ['daily', 'Täglich'], ['weekdays', 'Werktags (Mo–Fr)'], ['weekly', 'Wöchentlich'],
  ['biweekly', 'Alle 2 Wochen'], ['monthly', 'Monatlich'], ['yearly', 'Jährlich'],
];
export const repeatLabel = (r) => (REPEATS.find((x) => x[0] === r) || ['', ''])[1];

export function step(date, rule, anchor) {
  const aDay = anchor ? parseYmd(anchor).getDate() : undefined;
  switch (rule) {
    case 'daily': return addDays(date, 1);
    case 'weekdays': { let d = addDays(date, 1); while ([0, 6].includes(weekday(d))) d = addDays(d, 1); return d; }
    case 'weekly': return addDays(date, 7);
    case 'biweekly': return addDays(date, 14);
    case 'monthly': return addMonths(date, 1, aDay);
    case 'yearly': return addMonths(date, 12, aDay);
    default: return null;
  }
}

/** All dates (YYYY-MM-DD) in [from, to] on which the item occurs. */
export function occurrences(item, from, to) {
  if (!item.date) return [];
  if (!item.repeat) return item.date >= from && item.date <= to ? [item.date] : [];
  const out = [];
  let d = item.date;
  for (let i = 0; i < 800 && d <= to; i++) {
    if (d >= from) out.push(d);
    d = step(d, item.repeat, item.anchor);
  }
  return out;
}

export function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}
