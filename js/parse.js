// Understands simple German date/time phrases in a sentence, e.g.
// "Morgen um 15 Uhr Zahnarzt anrufen" -> { title: "Zahnarzt anrufen", date: <morgen>, time: "15:00" }
import { today, addDays, addMonths, weekday, ymd, pad } from './dates.js';

const NUM = { ein: 1, eins: 1, einer: 1, einem: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12 };
const WDAYS = { sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6 };
const MONTHS = { januar: 1, jänner: 1, februar: 2, märz: 3, maerz: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12 };
const num = (s) => (/^\d+$/.test(s) ? +s : NUM[s.toLowerCase()]);

export function parseText(input) {
  let text = ' ' + input.trim() + ' ';
  let date = null, time = null, endTime = null;
  const t0 = today();
  const cut = (re, fn) => {
    const m = text.match(re);
    if (!m) return false;
    const ok = fn(m);
    if (ok === false) return false;
    text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length);
    return true;
  };

  // ---------- time ----------
  const fixPm = (h) => {
    if (h < 12 && /\b(abends?|nachmittags?|am nachmittag|am abend)\b/i.test(text)) {
      h += 12;
      text = text.replace(/\b(abends?|nachmittags?|am nachmittag|am abend)\b/i, ' ');
    } else if (/\b(morgens|vormittags?|früh)\b/i.test(text)) {
      text = text.replace(/\b(morgens|vormittags?)\b/i, ' ');
    }
    return h;
  };
  const setT = (h, m) => { if (h > 23 || m > 59) return false; time = `${pad(fixPm(h))}:${pad(m)}`; return true; };

  // range "von 14 bis 16 Uhr" / "14-16 Uhr"
  cut(/\s(?:von\s)?(\d{1,2})(?:[:.](\d{2}))?\s?(?:uhr\s)?(?:bis|-|–)\s?(\d{1,2})(?:[:.](\d{2}))?\s?uhr\b/i, (m) => {
    if (!setT(+m[1], +(m[2] || 0))) return false;
    endTime = `${pad(Math.min(23, +m[3]))}:${pad(+(m[4] || 0))}`;
  }) ||
  cut(/\s(?:um\s)?(\d{1,2}):(\d{2})(?:\s?uhr)?\b/i, (m) => setT(+m[1], +m[2])) ||
  cut(/\sum\s(\d{1,2})\.(\d{2})(?![.\d])(?:\s?uhr)?\b/i, (m) => setT(+m[1], +m[2])) ||
  cut(/\s(\d{1,2})\.(\d{2})\s?uhr\b/i, (m) => setT(+m[1], +m[2])) ||
  cut(/\s(?:um\s)?(\d{1,2}|ein|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s?uhr(?:\s(\d{1,2})(?!\s?(?:uhr|\.|:)))?\b/i, (m) => setT(num(m[1]), +(m[2] || 0))) ||
  cut(/\sum\s(\d{1,2}|ein|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)(?=[\s,.!?])/i, (m) => setT(num(m[1]), 0)) ||
  cut(/\shalb\s(\d{1,2}|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\b/i, (m) => setT((num(m[1]) + 23) % 24, 30));

  // "heute Abend" / "morgen Abend" -> 19:00 if no explicit time
  if (/\s(heute\s|morgen\s)?abend\b/i.test(text)) {
    if (!time) time = '19:00';
    text = text.replace(/\s(heute|morgen)\sabend\b/i, ' $1').replace(/\sabend\b/i, ' ');
  }

  // ---------- date ----------
  cut(/\sübermorgen\b/i, () => { date = addDays(t0, 2); }) ||
  cut(/\smorgen(?:\sfrüh)?\b/i, () => { date = addDays(t0, 1); }) ||
  cut(/\sheute\b/i, () => { date = t0; }) ||
  cut(/\sin\s(\d+|einer|einem|einen|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\s(tag|tagen|woche|wochen|monat|monaten)\b/i, (m) => {
    const n = num(m[1]) || 1;
    const u = m[2].toLowerCase();
    date = u.startsWith('tag') ? addDays(t0, n) : u.startsWith('woche') ? addDays(t0, 7 * n) : addMonths(t0, n);
  }) ||
  cut(/\s(?:am\s)?(?:(nächsten|nächste|kommenden|diesen)\s)?(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/i, (m) => {
    const target = WDAYS[m[2].toLowerCase()];
    let ahead = (target - weekday(t0) + 7) % 7;
    if (ahead === 0) ahead = 7;
    date = addDays(t0, ahead);
  }) ||
  cut(/\s(?:nächste|kommende)\swoche\b/i, () => { date = addDays(t0, 7 - ((weekday(t0) + 6) % 7)); }) ||
  cut(/\s(?:am\s)?(\d{1,2})\.(\d{1,2})\.(\d{2,4})?(?=[\s,!?]|$)/i, (m) => {
    const d = +m[1], mo = +m[2];
    if (d < 1 || d > 31 || mo < 1 || mo > 12) return false;
    let y = m[3] ? +m[3] : new Date().getFullYear();
    if (y < 100) y += 2000;
    let s = ymd(new Date(y, mo - 1, d));
    if (!m[3] && s < t0) s = ymd(new Date(y + 1, mo - 1, d));
    date = s;
  }) ||
  cut(/\s(?:am\s)?(\d{1,2})\.?\s(januar|jänner|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s(\d{4}))?\b/i, (m) => {
    const d = +m[1], mo = MONTHS[m[2].toLowerCase()];
    let y = m[3] ? +m[3] : new Date().getFullYear();
    let s = ymd(new Date(y, mo - 1, d));
    if (!m[3] && s < t0) s = ymd(new Date(y + 1, mo - 1, d));
    date = s;
  });

  if (time && !date) date = t0;

  let title = text.replace(/\s+/g, ' ').replace(/\s([,.!?])/g, '$1').trim()
    .replace(/^(am|um|ich muss|ich sollte|erinnere mich(?: daran)?|bitte)\s+/i, '')
    .replace(/^[,.;:\-–\s]+|[,;:\-–\s]+$/g, '').trim();
  if (title) title = title[0].toUpperCase() + title.slice(1);
  return { title: title || input.trim(), date, time, endTime };
}
