import { db } from './db.js';
import * as D from './dates.js';
import { parseText } from './parse.js';

const VERSION = '1.0.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const ls = {
  get(k, d) { try { const v = localStorage.getItem('klar.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('klar.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const COLORS = ['#0a84ff', '#ff9f0a', '#30d158', '#ff375f', '#bf5af2', '#5ac8fa', '#ffcc00', '#ff6b3d', '#8e8e93'];
const REMINDS = [[null, 'Keine'], [0, 'Zur Uhrzeit'], [5, '5 Min. vorher'], [15, '15 Min. vorher'], [30, '30 Min. vorher'], [60, '1 Std. vorher'], [120, '2 Std. vorher'], [1440, '1 Tag vorher']];

const P = {
  cal: '<rect x="3.5" y="4.5" width="17" height="16" rx="4"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19l-3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5l3 3"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  note: '<path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5l1-12.5M9 7V4.5h6V7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4M5 12v7.5h14V12"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  wave: '<path d="M4 12h1M8 8v8M12 5v14M16 9v6M20 11v2"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  download: '<path d="M12 3v12M8 11l4 4 4-4M5 19.5h14"/>',
  upload: '<path d="M12 15V3M8 7l4-4 4 4M5 19.5h14"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  broom: '<path d="M14 4l6 6M12 6l6 6-7 7-6-6zM5 13l-2 8 8-2"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24">${P[n]}</svg>`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';

// ======================= state =======================
const S = {
  items: [], lists: [],
  tab: ls.get('tab', 'today'),
  calMode: ls.get('calMode', 'week'),
  calCursor: D.today(), calSel: D.today(),
  filter: 'all', q: '', listDetail: null, showDone: false,
  day: D.today(),
};

const listOf = (id) => S.lists.find((l) => l.id === id);
const colorOf = (it) => listOf(it.listId)?.color || 'var(--accent)';
const isOverdue = (it) => it.kind !== 'event' && !it.done && it.date && it.date < D.today();
const isOpen = (it) => !it.done && !(it.kind === 'event' && it.date && it.date < D.today());
const byWhen = (a, b) => (a.date || '9999').localeCompare(b.date || '9999')
  || (a.time || '99:99').localeCompare(b.time || '99:99')
  || (a.createdAt || 0) - (b.createdAt || 0);

async function save(it) {
  it.updatedAt = Date.now();
  const i = S.items.findIndex((x) => x.id === it.id);
  if (i >= 0) S.items[i] = it; else S.items.push(it);
  await db.put('items', it);
}
async function removeItem(it) {
  S.items = S.items.filter((x) => x.id !== it.id);
  await db.del('items', it.id);
  if (it.audioId && !S.items.some((x) => x.audioId === it.audioId)) await db.del('audio', it.audioId);
}
async function saveList(l) {
  const i = S.lists.findIndex((x) => x.id === l.id);
  if (i >= 0) S.lists[i] = l; else S.lists.push(l);
  await db.put('lists', l);
}

async function load() {
  S.lists = await db.all('lists');
  if (!S.lists.length && !(await db.get('meta', 'seeded'))) {
    const seed = [['Privat', COLORS[0]], ['Minijob', COLORS[1]], ['Projekte', COLORS[4]]];
    for (let i = 0; i < seed.length; i++) await saveList({ id: uid(), name: seed[i][0], color: seed[i][1], order: i });
    const t = D.today();
    const base = { notes: '', kind: 'task', time: null, endTime: null, repeat: '', remind: null, audioId: null, done: false };
    await save({ ...base, id: uid(), title: 'Tippe auf den Kreis, um mich abzuhaken', date: t, listId: S.lists[0].id, createdAt: Date.now() });
    await save({ ...base, id: uid(), title: 'Tippe aufs Mikro und sag: „Morgen um 10 Uhr Zahnarzt anrufen“', date: t, listId: S.lists[0].id, createdAt: Date.now() + 1 });
    await db.put('meta', { key: 'seeded', v: 1 });
  }
  S.lists.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  S.items = await db.all('items');
  await rollEvents();
}

// Repeating appointments in the past move forward to their next date.
async function rollEvents() {
  const t = D.today();
  for (const it of S.items) {
    if (it.kind === 'event' && it.repeat && it.date && it.date < t && !it.done) {
      let d = it.date;
      for (let i = 0; i < 1000 && d < t; i++) d = D.step(d, it.repeat, it.anchor);
      it.date = d;
      await save(it);
    }
  }
}

// ======================= rendering helpers =======================
function rowHTML(it, o = {}) {
  const t = D.today();
  const c = colorOf(it);
  const occ = o.occ || it.date;
  const cls = [];
  if (it.done) cls.push('done');
  if (o.ghost) cls.push('ghost');
  if (it.kind === 'event' && occ === t && (it.endTime || it.time) && (it.endTime || it.time) < nowHM()) cls.push('past');

  let left;
  if (it.kind === 'event') {
    left = `<div class="time-badge">${it.time ? esc(it.time) + (it.endTime ? `<small>${esc(it.endTime)}</small>` : '') : '<small>ganzt.</small>'}</div>`;
  } else {
    left = `<button class="check" data-act="toggle" data-id="${it.id}" aria-label="Erledigt"></button>`;
  }

  const meta = [];
  const late = isOverdue(it) && !o.ghost;
  if (o.showDate && occ) {
    meta.push(`<span class="m ${late ? 'late' : ''}">${ic('cal')}${D.fmtRel(occ)}${late ? ' · überfällig' : ''}</span>`);
  } else if (late) {
    meta.push(`<span class="m late">${ic('cal')}${D.fmtRel(it.date)}</span>`);
  }
  if (it.kind !== 'event' && it.time) meta.push(`<span class="m">${ic('clock')}${esc(it.time)}</span>`);
  const l = listOf(it.listId);
  if (l && !o.hideList) meta.push(`<span class="m"><span class="dot" style="--c:${l.color}"></span>${esc(l.name)}</span>`);
  if (it.repeat) meta.push(`<span class="m">${ic('repeat')}${D.repeatLabel(it.repeat)}</span>`);
  if (it.remind != null && it.date && !it.done) meta.push(`<span class="m">${ic('bell')}</span>`);
  if (it.notes) meta.push(`<span class="m">${ic('note')}</span>`);

  const play = it.audioId ? `<button class="play" data-act="play" data-audio="${it.audioId}" aria-label="Abspielen">${PLAY}</button>` : '';
  return `<div class="row ${cls.join(' ')}" data-act="edit" data-id="${it.id}" style="--c:${c}">${left}
    <div class="body"><div class="title">${esc(it.title)}</div>${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}</div>${play}</div>`;
}
const nowHM = () => { const d = new Date(); return `${D.pad(d.getHours())}:${D.pad(d.getMinutes())}`; };
const card = (rows) => `<div class="card glass">${rows.join('')}</div>`;
function section(title, items, o = {}) {
  if (!items.length) return '';
  return `<div class="section-title ${o.cls || ''}">${title}<span class="count">${items.length}</span></div>`
    + card(items.map((x) => (x.it ? rowHTML(x.it, { ...o, ...x }) : rowHTML(x, o))));
}
const empty = (big, b, txt) => `<div class="card glass"><div class="empty"><div class="big">${big}</div><b>${b}</b>${txt}</div></div>`;

function head(title, sub, actions = '') {
  return `<div class="head"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="head-actions">${actions}</div></div>`;
}
const gearBtn = `<button class="icon-btn glass press" data-act="settings" aria-label="Einstellungen">${ic('gear')}</button>`;

// items on a specific day (incl. repeat occurrences)
function itemsOn(d) {
  const out = [];
  for (const it of S.items) {
    if (!it.date) continue;
    if (it.done) { if (it.date === d) out.push({ it }); continue; }
    if (it.repeat) { if (D.occurrences(it, d, d).length) out.push({ it, occ: d, ghost: d !== it.date }); }
    else if (it.date === d) out.push({ it });
  }
  return out.sort((a, b) => (a.it.done - b.it.done) || byWhen(a.it, b.it));
}

function groupOpen(items, o = {}) {
  const t = D.today();
  const eow = D.addDays(D.startOfWeek(t), 6);
  const eonw = D.addDays(eow, 7);
  const groups = [
    ['Überfällig', (i) => isOverdue(i), 'red'],
    ['Heute', (i) => i.date === t],
    ['Morgen', (i) => i.date === D.addDays(t, 1)],
    ['Diese Woche', (i) => i.date && i.date <= eow],
    ['Nächste Woche', (i) => i.date && i.date <= eonw],
    ['Später', (i) => !!i.date],
    ['Ohne Datum', () => true],
  ];
  const buckets = groups.map(() => []);
  for (const it of items.sort(byWhen)) {
    const gi = groups.findIndex((g) => g[1](it));
    buckets[gi].push(it);
  }
  return groups.map((g, i) => section(g[0], buckets[i], { cls: g[2], showDate: !['Heute', 'Ohne Datum'].includes(g[0]), hideList: o.hideList })).join('');
}

// ======================= views =======================
function viewToday() {
  const t = D.today();
  const open = S.items.filter((i) => !i.done);
  const overdue = open.filter(isOverdue).sort(byWhen);
  const todays = open.filter((i) => i.date === t).sort(byWhen);
  const events = todays.filter((i) => i.kind === 'event');
  const tasks = todays.filter((i) => i.kind !== 'event');
  const doneToday = S.items.filter((i) => i.done && i.doneAt && D.ymd(new Date(i.doneAt)) === t);
  const upcoming = open.filter((i) => i.date && i.date > t && D.diffDays(t, i.date) <= 7).sort(byWhen).slice(0, 5);

  const total = tasks.length + overdue.length + doneToday.length;
  const pct = total ? doneToday.length / total : 0;
  const C = 2 * Math.PI * 24;
  const remaining = tasks.length + overdue.length;
  const sumText = total === 0 ? (events.length ? 'Keine Aufgaben – nur Termine' : 'Freier Tag ✨')
    : remaining === 0 ? 'Alles erledigt 🎉' : `Noch ${remaining} ${remaining === 1 ? 'Aufgabe' : 'Aufgaben'}`;
  const sumSub = `${doneToday.length} erledigt · ${events.length} ${events.length === 1 ? 'Termin' : 'Termine'}`;

  let html = head('Heute', D.fmtLong(t), gearBtn);
  if (!isStandalone() && !ls.get('installHidden', false)) {
    html += `<div class="install glass"><div style="flex:1"><b>Als App installieren</b>Tippe in Safari auf <span class="share">${ic('share')}</span> „Teilen“ → „Zum Home-Bildschirm“. Dann läuft Klar im Vollbild und offline.</div>
      <button class="x-btn" data-act="hideInstall" aria-label="Ausblenden">${ic('x')}</button></div>`;
  }
  html += `<div class="summary glass"><svg class="ring" viewBox="0 0 58 58"><circle class="track" cx="29" cy="29" r="24"/>
    <circle class="val" cx="29" cy="29" r="24" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 29 29)"/></svg>
    <div><div class="t1">${sumText}</div><div class="t2">${sumSub}</div></div></div>`;

  html += section('Überfällig', overdue, { cls: 'red', showDate: false });
  html += section('Termine', events);
  html += section('Aufgaben', tasks);
  if (!overdue.length && !todays.length) html += `<div style="margin-top:14px">${empty('☀️', 'Nichts mehr für heute', 'Tippe auf + oder aufs Mikro, um etwas hinzuzufügen.')}</div>`;
  html += section('Demnächst', upcoming, { showDate: true });
  if (doneToday.length) {
    html += `<button class="done-toggle" data-act="toggleDoneList">${S.showDone ? 'Erledigte ausblenden' : `Heute erledigt anzeigen (${doneToday.length})`}</button>`;
    if (S.showDone) html += card(doneToday.map((i) => rowHTML(i)));
  }
  return html;
}

function viewCalendar() {
  const seg = `<div class="seg glass" data-seg="cal" style="margin-bottom:14px"><div class="seg-ind"></div>
    <button data-act="calMode" data-v="week" class="${S.calMode === 'week' ? 'on' : ''}">Woche</button>
    <button data-act="calMode" data-v="month" class="${S.calMode === 'month' ? 'on' : ''}">Monat</button></div>`;
  const t = D.today();
  let html = head('Kalender', '', `<button class="icon-btn glass press" data-act="calToday" aria-label="Heute" style="width:auto;padding:0 14px;border-radius:999px;font-weight:600;font-size:14px">Heute</button>`) + seg;

  if (S.calMode === 'week') {
    const ws = D.startOfWeek(S.calCursor);
    const we = D.addDays(ws, 6);
    const a = D.parseYmd(ws), b = D.parseYmd(we);
    const label = a.getMonth() === b.getMonth()
      ? `${a.getDate()}.–${b.getDate()}. ${D.MONTHS[b.getMonth()]}`
      : `${a.getDate()}. ${D.MON_SHORT[a.getMonth()]} – ${b.getDate()}. ${D.MON_SHORT[b.getMonth()]}`;
    html += navBar(label);
    for (let i = 0; i < 7; i++) {
      const d = D.addDays(ws, i);
      const dd = D.parseYmd(d);
      const list = itemsOn(d);
      html += `<div class="week-day ${d === t ? 'is-today' : ''}"><div class="section-title">${D.WD_LONG[dd.getDay()]}, ${dd.getDate()}.${d === t ? ' · Heute' : ''}
        <button class="count" data-act="addOn" data-date="${d}" style="color:var(--accent);font-size:20px;line-height:1;padding:0 4px" aria-label="Hinzufügen">+</button></div>
        ${list.length ? card(list.map((x) => rowHTML(x.it, x))) : `<div class="day-empty">Nichts geplant</div>`}</div>`;
    }
  } else {
    const cur = D.parseYmd(S.calCursor);
    const first = D.ymd(new Date(cur.getFullYear(), cur.getMonth(), 1));
    const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    const gs = D.startOfWeek(first);
    const cells = Math.ceil((D.diffDays(gs, first) + lastDay) / 7) * 7;
    html += navBar(`${D.MONTHS[cur.getMonth()]} ${cur.getFullYear()}`);
    let grid = '';
    for (let i = 0; i < cells; i++) {
      const d = D.addDays(gs, i);
      const dd = D.parseYmd(d);
      const its = itemsOn(d).filter((x) => !x.it.done);
      const dots = its.slice(0, 3).map((x) => `<i style="--c:${colorOf(x.it)}"></i>`).join('');
      const cls = [dd.getMonth() !== cur.getMonth() ? 'out' : '', d === t ? 'today' : '', d === S.calSel ? 'sel' : ''].join(' ');
      grid += `<button class="day ${cls}" data-act="pickDay" data-date="${d}">${dd.getDate()}<span class="dots">${dots}</span></button>`;
    }
    html += `<div class="month glass"><div class="wd">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((x) => `<span>${x}</span>`).join('')}</div><div class="days">${grid}</div></div>`;
    const list = itemsOn(S.calSel);
    html += `<div class="section-title">${D.fmtRel(S.calSel) === 'Heute' ? 'Heute' : D.fmtLong(S.calSel)}
      <button class="count" data-act="addOn" data-date="${S.calSel}" style="color:var(--accent);font-size:20px;line-height:1;padding:0 4px" aria-label="Hinzufügen">+</button></div>`;
    html += list.length ? card(list.map((x) => rowHTML(x.it, x))) : empty('🗓️', 'Nichts geplant', 'Tippe auf +, um etwas für diesen Tag einzutragen.');
  }
  return html;
}
const navBar = (label) => `<div class="cal-nav"><button class="icon-btn glass press" data-act="calPrev" aria-label="Zurück">${ic('chevL')}</button>
  <div class="label">${label}</div><button class="icon-btn glass press" data-act="calNext" aria-label="Weiter">${ic('chevR')}</button></div>`;

function matchesQ(it) {
  if (!S.q) return true;
  const q = S.q.toLowerCase();
  return [it.title, it.notes, it.transcript].some((x) => (x || '').toLowerCase().includes(q));
}

function viewAll() {
  const open = S.items.filter(isOpen).filter((i) => S.filter === 'all' || i.listId === S.filter).filter(matchesQ);
  let html = head('Alles offen', `${open.length} ${open.length === 1 ? 'Eintrag' : 'Einträge'}`);
  html += `<label class="search glass">${ic('search')}<input id="q" type="search" placeholder="Suchen" value="${esc(S.q)}" autocomplete="off"></label>`;
  html += `<div class="chips"><button class="chip glass ${S.filter === 'all' ? 'on' : ''}" data-act="filter" data-v="all">Alle</button>${S.lists.map((l) =>
    `<button class="chip glass ${S.filter === l.id ? 'on' : ''}" data-act="filter" data-v="${l.id}"><span class="dot" style="--c:${l.color}"></span>${esc(l.name)}</button>`).join('')}</div>`;
  html += `<div id="allResults">${allResults(open)}</div>`;
  return html;
}
function allResults(open) {
  open = open || S.items.filter(isOpen).filter((i) => S.filter === 'all' || i.listId === S.filter).filter(matchesQ);
  return (open.length ? groupOpen(open) : empty('🎉', S.q ? 'Nichts gefunden' : 'Alles erledigt', S.q ? 'Versuch einen anderen Suchbegriff.' : 'Du hast nichts Offenes mehr.'))
    + doneBlock(S.items.filter((i) => i.done && (S.filter === 'all' || i.listId === S.filter)).filter(matchesQ));
}
function doneBlock(done) {
  if (!done.length) return '';
  let h = `<button class="done-toggle" data-act="toggleDoneList">${S.showDone ? 'Erledigte ausblenden' : `Erledigte anzeigen (${done.length})`}</button>`;
  if (S.showDone) h += card(done.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 60).map((i) => rowHTML(i, { showDate: true })));
  return h;
}

function viewLists() {
  if (S.listDetail) return viewListDetail();
  let html = head('Listen', '', gearBtn);
  const cnt = (f) => S.items.filter((i) => isOpen(i) && f(i)).length;
  html += '<div class="grid">';
  for (const l of S.lists) {
    html += `<button class="lcard glass press" data-act="openList" data-v="${l.id}" style="--c:${l.color}"><div class="top"><span class="ico">${ic('folder')}</span><span class="n">${cnt((i) => i.listId === l.id)}</span></div><div class="name">${esc(l.name)}</div></button>`;
  }
  html += `<button class="lcard glass press" data-act="openList" data-v="__none" style="--c:#8e8e93"><div class="top"><span class="ico">${ic('list')}</span><span class="n">${cnt((i) => !listOf(i.listId))}</span></div><div class="name">Ohne Liste</div></button>`;
  html += `<button class="lcard glass press" data-act="openList" data-v="__audio" style="--c:#ff375f"><div class="top"><span class="ico">${ic('mic')}</span><span class="n">${S.items.filter((i) => i.audioId).length}</span></div><div class="name">Sprachnotizen</div></button>`;
  html += `<button class="lcard glass press" data-act="openList" data-v="__done" style="--c:#30d158"><div class="top"><span class="ico">${ic('check')}</span><span class="n">${S.items.filter((i) => i.done).length}</span></div><div class="name">Erledigt</div></button>`;
  html += `<button class="lcard glass press add" data-act="editList">${ic('plus').replace('<svg', '<svg style="width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"')}Neue Liste</button>`;
  html += '</div>';
  return html;
}
function viewListDetail() {
  const id = S.listDetail;
  const back = `<button class="icon-btn glass press" data-act="backLists" aria-label="Zurück">${ic('chevL')}</button>`;
  let title, items, html;
  if (id === '__audio') {
    title = 'Sprachnotizen';
    items = S.items.filter((i) => i.audioId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    html = head(title, `${items.length} Aufnahmen`, back) + (items.length ? card(items.map((i) => rowHTML(i, { showDate: true }))) : empty('🎙️', 'Noch keine Sprachnotizen', 'Tippe unten aufs Mikro und sprich los.'));
    return html;
  }
  if (id === '__done') {
    title = 'Erledigt';
    items = S.items.filter((i) => i.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    return head(title, `${items.length} erledigt`, back) + (items.length ? card(items.slice(0, 200).map((i) => rowHTML(i, { showDate: true }))) : empty('✅', 'Noch nichts erledigt', 'Abgehakte Aufgaben landen hier.'));
  }
  const l = listOf(id);
  const f = id === '__none' ? (i) => !listOf(i.listId) : (i) => i.listId === id;
  items = S.items.filter((i) => isOpen(i) && f(i));
  const edit = l ? `<button class="icon-btn glass press" data-act="editList" data-v="${l.id}" aria-label="Liste bearbeiten">${ic('edit')}</button>` : '';
  html = head(l ? esc(l.name) : 'Ohne Liste', `${items.length} offen`, back + edit);
  html += items.length ? groupOpen(items, { hideList: true }) : empty('📭', 'Liste ist leer', 'Tippe auf +, um etwas hinzuzufügen.');
  html += doneBlock(S.items.filter((i) => i.done && f(i)));
  return html;
}

const TITLES = { today: 'Heute', calendar: 'Kalender', all: 'Alles offen', lists: 'Listen' };
function render(animate = false) {
  const v = $('#view');
  const html = S.tab === 'today' ? viewToday() : S.tab === 'calendar' ? viewCalendar() : S.tab === 'all' ? viewAll() : viewLists();
  v.innerHTML = html;
  if (animate) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === S.tab));
  $('#topbarTitle').textContent = S.tab === 'lists' && S.listDetail ? (listOf(S.listDetail)?.name || 'Liste') : TITLES[S.tab];
  $$('.seg').forEach(placeSeg);
  const q = $('#q');
  if (q) q.addEventListener('input', () => { S.q = q.value; $('#allResults').innerHTML = allResults(); });
}
function placeSeg(seg) {
  const btns = $$('button', seg);
  const on = btns.findIndex((b) => b.classList.contains('on'));
  const ind = $('.seg-ind', seg);
  if (!ind || on < 0) return;
  ind.style.width = btns[on].offsetWidth + 'px';
  ind.style.transform = `translateX(${btns[on].offsetLeft - 4}px)`;
}
function moveTabInd(animate) {
  const on = $(`.tab[data-tab="${S.tab}"]`);
  const ind = $('#tabInd');
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = `translateX(${on.offsetLeft - 5}px)`;
  if (animate) { ind.classList.remove('squish'); void ind.offsetWidth; ind.classList.add('squish'); }
}
function setTab(tab) {
  if (tab === S.tab) { if (tab === 'lists' && S.listDetail) { S.listDetail = null; render(true); } window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  S.tab = tab; S.showDone = false; ls.set('tab', tab);
  window.scrollTo(0, 0);
  render(true); moveTabInd(true);
}

// ======================= actions =======================
let lastToggle = null;
async function toggleDone(id, rowEl) {
  const it = S.items.find((x) => x.id === id);
  if (!it) return;
  haptic();
  if (!it.done && it.repeat && it.date) {
    const before = { ...it };
    const copy = { ...it, id: uid(), repeat: '', done: true, doneAt: Date.now(), remind: null, audioId: null, firedKey: null };
    let d = D.step(it.date, it.repeat, it.anchor);
    for (let i = 0; i < 1000 && d <= D.today(); i++) d = D.step(d, it.repeat, it.anchor);
    it.date = d; it.firedKey = null;
    rowEl?.classList.add('done');
    await save(copy); await save(it);
    setTimeout(() => render(), 420);
    toast('Erledigt ✓', { sub: `Nächstes Mal: ${D.fmtRel(d)}`, action: ['Rückgängig', async () => { await removeItem(copy); await save(before); render(); }] });
    return;
  }
  it.done = !it.done;
  it.doneAt = it.done ? Date.now() : null;
  rowEl?.classList.toggle('done', it.done);
  await save(it);
  if (it.done) {
    lastToggle = it.id;
    setTimeout(() => { rowEl?.classList.add('gone'); }, 260);
    setTimeout(() => render(), 600);
    toast('Erledigt ✓', { sub: it.title, action: ['Rückgängig', async () => { it.done = false; it.doneAt = null; await save(it); render(); }] });
  } else render();
}

function haptic() { try { navigator.vibrate?.(8); } catch { /* iOS ignores */ } }

function contextDefaults() {
  const d = {};
  if (S.tab === 'today') d.date = D.today();
  if (S.tab === 'calendar') d.date = S.calMode === 'month' ? S.calSel : (S.calSel || D.today());
  if (S.tab === 'lists' && S.listDetail && listOf(S.listDetail)) d.listId = S.listDetail;
  if (S.tab === 'lists' && S.listDetail === '__none') d.listId = null;
  if (S.tab === 'all' && S.filter !== 'all') d.listId = S.filter;
  return d;
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  switch (a) {
    case 'toggle': e.stopPropagation(); return toggleDone(el.dataset.id, el.closest('.row'));
    case 'edit': { const it = S.items.find((x) => x.id === el.dataset.id); if (it) openEditor(it); return; }
    case 'play': e.stopPropagation(); return playAudio(el.dataset.audio);
    case 'settings': return openSettings();
    case 'hideInstall': ls.set('installHidden', true); return render();
    case 'toggleDoneList': S.showDone = !S.showDone; return render();
    case 'calMode': S.calMode = el.dataset.v; ls.set('calMode', S.calMode); return render();
    case 'calPrev': case 'calNext': {
      const dir = a === 'calNext' ? 1 : -1;
      S.calCursor = S.calMode === 'week' ? D.addDays(S.calCursor, 7 * dir) : D.addMonths(D.ymd(new Date(D.parseYmd(S.calCursor).getFullYear(), D.parseYmd(S.calCursor).getMonth(), 1)), dir);
      if (S.calMode === 'week') S.calSel = D.startOfWeek(S.calCursor);
      return render();
    }
    case 'calToday': S.calCursor = S.calSel = D.today(); return render();
    case 'pickDay': S.calSel = el.dataset.date; if (D.parseYmd(S.calSel).getMonth() !== D.parseYmd(S.calCursor).getMonth()) S.calCursor = S.calSel; return render();
    case 'addOn': return openEditor(null, { date: el.dataset.date });
    case 'filter': S.filter = el.dataset.v; return render();
    case 'openList': S.listDetail = el.dataset.v; window.scrollTo(0, 0); return render(true);
    case 'backLists': S.listDetail = null; return render(true);
    case 'editList': return openListEditor(el.dataset.v ? listOf(el.dataset.v) : null);
  }
});
$$('.tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
$('#addBtn').addEventListener('click', () => openEditor(null, contextDefaults()));
$('#micBtn').addEventListener('click', () => startVoiceCapture());

// liquid light that follows the finger on glass surfaces
document.addEventListener('pointerdown', (e) => {
  const g = e.target.closest('.glass');
  if (!g) return;
  const r = g.getBoundingClientRect();
  g.style.setProperty('--px', `${e.clientX - r.left}px`);
  g.style.setProperty('--py', `${e.clientY - r.top}px`);
  g.classList.add('lit');
  const off = () => { setTimeout(() => g.classList.remove('lit'), 180); window.removeEventListener('pointerup', off); window.removeEventListener('pointercancel', off); };
  window.addEventListener('pointerup', off); window.addEventListener('pointercancel', off);
}, { passive: true });

window.addEventListener('scroll', () => { $('#topbar').classList.toggle('show', window.scrollY > 56); }, { passive: true });

// ======================= sheets =======================
const stack = [];
function openSheet(inner, { onClose } = {}) {
  $$('#toasts .toast').forEach((t) => t.remove());
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const sh = document.createElement('div');
  sh.className = 'sheet glass';
  sh.innerHTML = inner;
  $('#sheets').append(scrim, sh);
  const entry = { sh, scrim, onClose };
  stack.push(entry);
  scrim.addEventListener('click', () => closeSheet(entry));
  requestAnimationFrame(() => { scrim.classList.add('show'); sh.classList.add('show'); });
  document.body.style.overflow = 'hidden'; document.body.classList.add('sheet-open');
  // drag down to dismiss
  const handle = $('.sheet-head', sh) || sh;
  let y0 = null, dy = 0;
  const grabEls = [handle, $('.grab', sh)].filter(Boolean);
  grabEls.forEach((h) => h.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button,input,textarea,select')) return;
    y0 = e.clientY; dy = 0; sh.classList.add('dragging');
    h.setPointerCapture(e.pointerId);
  }));
  grabEls.forEach((h) => h.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.clientY - y0);
    sh.style.transform = `translateY(${dy}px)`;
  }));
  const end = () => {
    if (y0 == null) return;
    y0 = null; sh.classList.remove('dragging'); sh.style.transform = '';
    if (dy > 110) closeSheet(entry);
  };
  grabEls.forEach((h) => { h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end); });
  entry.close = () => closeSheet(entry);
  return entry;
}
function closeSheet(entry = stack[stack.length - 1]) {
  if (!entry || entry.closed) return;
  entry.closed = true;
  stack.splice(stack.indexOf(entry), 1);
  entry.sh.classList.remove('show'); entry.scrim.classList.remove('show');
  setTimeout(() => { entry.sh.remove(); entry.scrim.remove(); }, 450);
  if (!stack.length) { document.body.style.overflow = ''; document.body.classList.remove('sheet-open'); }
  entry.onClose?.();
}

// ======================= editor =======================
function openEditor(src, defaults = {}) {
  const isNew = !src;
  const t = D.today();
  const d = src ? { ...src } : {
    id: uid(), title: '', notes: '', kind: 'task', date: null, time: null, endTime: null,
    listId: S.lists[0]?.id || null, repeat: '', remind: null, audioId: null, transcript: '',
    done: false, createdAt: Date.now(),
  };
  let pending = null; // { blob, dur }
  if (isNew) {
    if (defaults._audio) { pending = defaults._audio; }
    for (const [k, v] of Object.entries(defaults)) if (k !== '_audio' && v !== undefined) d[k] = v;
  }
  let dropAudio = false;
  let confirmDel = false;

  const entry = openSheet(`<div class="grab"></div><div class="sheet-head">
      <button class="pill-btn" data-x="cancel">Abbrechen</button><h2 id="edTitle"></h2>
      <button class="pill-btn primary" data-x="save">Sichern</button></div><div class="sheet-body"></div>`,
  { onClose: () => stopAudio() });
  const sh = entry.sh;
  const body = $('.sheet-body', sh);

  const hasAudio = () => !!pending || (!!d.audioId && !dropAudio);

  function draw() {
    $('#edTitle', sh).textContent = isNew ? (d.kind === 'event' ? 'Neuer Termin' : 'Neue Aufgabe') : (d.kind === 'event' ? 'Termin' : 'Aufgabe');
    const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v ?? ''}" ${String(v ?? '') === String(cur ?? '') ? 'selected' : ''}>${l}</option>`).join('');
    const tomorrow = D.addDays(t, 1);
    const dur = pending ? pending.dur : d.audioDur;
    const bars = Array.from({ length: 34 }, (_, i) => { const h = 20 + Math.abs(Math.sin((i + 1) * 1.7 + d.id.charCodeAt(0))) * 80; return `<i style="height:${h}%"></i>`; }).join('');
    body.innerHTML = `
      <div class="field glass">
        <textarea class="big" id="fTitle" rows="1" placeholder="${d.kind === 'event' ? 'Was für ein Termin?' : 'Was steht an?'}">${esc(d.title)}</textarea>
        <div class="parse-hint" id="fHint" hidden></div>
        <div class="sep"></div>
        <textarea id="fNotes" rows="2" placeholder="Notizen">${esc(d.notes)}</textarea>
      </div>
      <div class="seg glass" style="margin-bottom:12px"><div class="seg-ind"></div>
        <button data-k="task" class="${d.kind !== 'event' ? 'on' : ''}">Aufgabe</button>
        <button data-k="event" class="${d.kind === 'event' ? 'on' : ''}">Termin</button></div>
      <div class="field glass">
        <div class="frow"><div class="lbl"><i style="--c:#ff3b30">${ic('cal')}</i>Datum</div><div class="ctl">
          <button class="mini ${d.date === t ? 'on' : ''}" data-date="${t}">Heute</button>
          <button class="mini ${d.date === tomorrow ? 'on' : ''}" data-date="${tomorrow}">Morgen</button>
          <input type="date" id="fDate" value="${d.date || ''}">
          ${d.date ? `<button class="x-btn" data-clear="date" aria-label="Datum entfernen">${ic('x')}</button>` : ''}</div></div>
        <div class="frow"><div class="lbl"><i style="--c:#0a84ff">${ic('clock')}</i>${d.kind === 'event' ? 'Zeit' : 'Uhrzeit'}</div><div class="ctl">
          <input type="time" id="fTime" value="${d.time || ''}">
          ${d.kind === 'event' ? `<span style="color:var(--text2)">bis</span><input type="time" id="fEnd" value="${d.endTime || ''}">` : ''}
          ${d.time ? `<button class="x-btn" data-clear="time" aria-label="Zeit entfernen">${ic('x')}</button>` : ''}</div></div>
        <div class="frow"><div class="lbl"><i style="--c:#8e8e93">${ic('repeat')}</i>Wiederholen</div><div class="ctl">
          <select id="fRepeat" ${d.date ? '' : 'disabled'}>${opt(D.REPEATS, d.repeat)}</select></div></div>
        <div class="frow"><div class="lbl"><i style="--c:#ff9500">${ic('bell')}</i>Erinnerung</div><div class="ctl">
          <select id="fRemind" ${d.date ? '' : 'disabled'}>${opt(REMINDS, d.remind)}</select></div></div>
      </div>
      ${!d.date ? '<p class="hint">Ohne Datum landet der Eintrag unter „Alles offen → Ohne Datum“. Für Wiederholung & Erinnerung bitte ein Datum wählen.</p>' : ''}
      ${d.remind != null && d.date ? `<p class="hint">🔔 Erinnerung ${d.time ? '' : 'um 9:00 '}kommt, wenn Klar offen ist bzw. kurz im Hintergrund lief. Für eine garantierte Erinnerung: „In iPhone-Kalender übernehmen“.</p>` : ''}
      <div class="field glass">
        <div class="frow"><div class="lbl"><i style="--c:#30d158">${ic('list')}</i>Liste</div></div>
        <div class="list-chips">
          <button class="mini ${!listOf(d.listId) ? 'on' : ''}" data-list="">Keine</button>
          ${S.lists.map((l) => `<button class="mini ${d.listId === l.id ? 'on' : ''}" data-list="${l.id}"><span class="dot" style="--c:${l.color};display:inline-block;margin-right:5px;vertical-align:1px"></span>${esc(l.name)}</button>`).join('')}
        </div>
      </div>
      <div class="field glass">
        ${hasAudio() ? `<div class="audio-box"><button class="play" data-x="playDraft" aria-label="Abspielen">${PLAY}</button>
            <div class="wave">${bars}</div><span class="dur">${D.fmtDur(dur)}</span>
            <button class="x-btn" data-x="dropAudio" aria-label="Aufnahme löschen">${ic('x')}</button></div>
            ${d.transcript ? `<p class="hint" style="padding:0 16px 12px">„${esc(d.transcript)}“</p>` : ''}`
        : `<button class="frow" data-x="rec"><div class="lbl"><i style="--c:#ff375f">${ic('mic')}</i>Sprachnotiz aufnehmen</div></button>`}
      </div>
      ${d.date ? `<div class="btn-row"><button class="wide glass press" data-x="ics">${ic('cal')}In iPhone-Kalender übernehmen</button></div>` : ''}
      ${!isNew ? `<div class="btn-row"><button class="wide glass press danger-txt" data-x="del">${ic('trash')}${confirmDel ? 'Wirklich löschen?' : 'Löschen'}</button></div>` : ''}
    `;
    placeSeg($('.seg', body));
    const ti = $('#fTitle', body), no = $('#fNotes', body);
    const grow = (el) => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
    grow(ti); grow(no);
    ti.addEventListener('input', () => { d.title = ti.value; grow(ti); hint(); });
    no.addEventListener('input', () => { d.notes = no.value; grow(no); });
    ti.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSave(); } });
    $('#fDate', body).addEventListener('change', (e) => { d.date = e.target.value || null; draw(); });
    $('#fTime', body).addEventListener('change', (e) => { d.time = e.target.value || null; if (d.time && !d.date) d.date = t; draw(); });
    $('#fEnd', body)?.addEventListener('change', (e) => { d.endTime = e.target.value || null; });
    $('#fRepeat', body).addEventListener('change', (e) => { d.repeat = e.target.value; draw(); });
    $('#fRemind', body).addEventListener('change', (e) => { d.remind = e.target.value === '' ? null : +e.target.value; askNotifyOnce(); draw(); });
    hint();
  }

  let parsed = null;
  function hint() {
    const box = $('#fHint', body);
    if (!box) return;
    const p = d.title.length > 3 ? parseText(d.title) : null;
    parsed = p && (p.date || p.time) && p.title !== d.title ? p : null;
    if (!parsed) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `${parsed.date ? `<span>📅 ${D.fmtRel(parsed.date)}</span>` : ''}${parsed.time ? `<span>⏰ ${parsed.time}${parsed.endTime ? '–' + parsed.endTime : ''}</span>` : ''}
      <button class="mini on" data-x="applyParse" style="padding:4px 10px;font-size:12.5px">Übernehmen</button>`;
  }

  body.addEventListener('click', async (e) => {
    const k = e.target.closest('[data-k]');
    if (k) { d.kind = k.dataset.k; draw(); return; }
    const dd = e.target.closest('[data-date]');
    if (dd) { d.date = d.date === dd.dataset.date ? null : dd.dataset.date; draw(); return; }
    const cl = e.target.closest('[data-clear]');
    if (cl) {
      if (cl.dataset.clear === 'date') { d.date = null; d.time = null; d.endTime = null; d.repeat = ''; d.remind = null; }
      else { d.time = null; d.endTime = null; }
      draw(); return;
    }
    const li = e.target.closest('[data-list]');
    if (li) { d.listId = li.dataset.list || null; draw(); return; }
    const x = e.target.closest('[data-x]');
    if (!x) return;
    switch (x.dataset.x) {
      case 'applyParse':
        if (parsed) {
          d.title = parsed.title; if (parsed.date) d.date = parsed.date; if (parsed.time) d.time = parsed.time;
          if (parsed.endTime) { d.endTime = parsed.endTime; d.kind = 'event'; }
          draw();
        }
        return;
      case 'rec':
        startVoiceCapture((res) => {
          if (!res.blob && !res.text) return;
          if (res.blob) { pending = res; dropAudio = false; }
          if (res.text) {
            if (!d.title.trim()) {
              const p = parseText(res.text);
              d.title = p.title; if (p.date) d.date = p.date; if (p.time) d.time = p.time;
            }
            d.transcript = res.text;
          }
          draw();
        });
        return;
      case 'playDraft':
        if (pending) playBlob(pending.blob, x); else if (d.audioId) playAudio(d.audioId, x);
        return;
      case 'dropAudio':
        stopAudio();
        if (pending) pending = null; else dropAudio = true;
        draw(); return;
      case 'ics': return exportIcs(d);
      case 'del':
        if (!confirmDel) { confirmDel = true; draw(); return; }
        await removeItem(src); entry.close(); render(); toast('Gelöscht'); return;
    }
  });
  $('[data-x="cancel"]', sh).addEventListener('click', () => entry.close());
  $('[data-x="save"]', sh).addEventListener('click', () => doSave());

  async function doSave() {
    d.title = d.title.trim(); d.notes = (d.notes || '').trim();
    if (!d.title) {
      if (hasAudio()) d.title = `Sprachnotiz ${nowHM()}`;
      else if (isNew) { entry.close(); return; }
      else { $('#fTitle', body).focus(); return; }
    }
    if (!d.date) { d.repeat = ''; d.remind = null; d.time = null; d.endTime = null; }
    if (d.kind !== 'event') d.endTime = null;
    if (d.repeat && (!src || src.date !== d.date || src.repeat !== d.repeat || !d.anchor)) d.anchor = d.date;
    if (!src || src.date !== d.date || src.time !== d.time || src.remind !== d.remind) d.firedKey = null;
    if (dropAudio && src?.audioId) {
      const old = src.audioId; d.audioId = null; d.audioDur = null;
      if (!S.items.some((x) => x.id !== d.id && x.audioId === old)) await db.del('audio', old);
    }
    if (pending) {
      if (src?.audioId && !dropAudio && !S.items.some((x) => x.id !== d.id && x.audioId === src.audioId)) await db.del('audio', src.audioId);
      const aid = uid();
      await db.put('audio', { id: aid, type: pending.blob.type || 'audio/mp4', data: await pending.blob.arrayBuffer() });
      d.audioId = aid; d.audioDur = pending.dur;
    }
    await save(d);
    entry.close();
    render();
    if (isNew) toast(d.kind === 'event' ? 'Termin gespeichert' : 'Aufgabe gespeichert', { sub: d.date ? `${D.fmtRel(d.date)}${d.time ? ' · ' + d.time : ''}` : 'Ohne Datum' });
    checkReminders();
  }

  draw();
  if (isNew && !pending) $('#fTitle', body).focus();
}

// ======================= list editor =======================
function openListEditor(l) {
  const isNew = !l;
  const d = l ? { ...l } : { id: uid(), name: '', color: COLORS[S.lists.length % COLORS.length], order: S.lists.length };
  let confirmDel = false;
  const entry = openSheet(`<div class="grab"></div><div class="sheet-head"><button class="pill-btn" data-x="cancel">Abbrechen</button>
    <h2>${isNew ? 'Neue Liste' : 'Liste bearbeiten'}</h2><button class="pill-btn primary" data-x="save">Sichern</button></div><div class="sheet-body"></div>`);
  const body = $('.sheet-body', entry.sh);
  function draw() {
    body.innerHTML = `<div class="field glass"><input type="text" id="lName" placeholder="Name der Liste" value="${esc(d.name)}" style="font-size:19px;font-weight:600"></div>
      <div class="field glass"><div class="color-row">${COLORS.map((c) => `<button class="swatch ${c === d.color ? 'on' : ''}" style="--c:${c}" data-c="${c}" aria-label="Farbe"></button>`).join('')}</div></div>
      ${!isNew ? `<div class="btn-row"><button class="wide glass press danger-txt" data-x="del">${ic('trash')}${confirmDel ? 'Wirklich löschen? Einträge bleiben erhalten' : 'Liste löschen'}</button></div>` : ''}`;
    $('#lName', body).addEventListener('input', (e) => { d.name = e.target.value; });
  }
  body.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-c]');
    if (c) { d.color = c.dataset.c; draw(); return; }
    if (e.target.closest('[data-x="del"]')) {
      if (!confirmDel) { confirmDel = true; draw(); return; }
      S.lists = S.lists.filter((x) => x.id !== d.id); await db.del('lists', d.id);
      for (const it of S.items.filter((i) => i.listId === d.id)) { it.listId = null; await save(it); }
      if (S.filter === d.id) S.filter = 'all';
      S.listDetail = null; entry.close(); render(); toast('Liste gelöscht');
    }
  });
  $('[data-x="cancel"]', entry.sh).addEventListener('click', () => entry.close());
  $('[data-x="save"]', entry.sh).addEventListener('click', async () => {
    d.name = d.name.trim();
    if (!d.name) { $('#lName', body).focus(); return; }
    await saveList(d); entry.close(); render();
  });
  draw();
  if (isNew) $('#lName', body).focus();
}

// ======================= voice capture =======================
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function startVoiceCapture(onDone) {
  // Everything that needs the tap gesture happens synchronously here.
  const mediaP = navigator.mediaDevices?.getUserMedia
    ? navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    : Promise.reject(new Error('nomedia'));
  let rec = null, baseTxt = '', finalTxt = '', interim = '', srFailed = !SR, srRestarts = 0;
  let active = true;
  let ctx = null;
  try { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); ctx.resume?.(); } catch { ctx = null; }
  if (SR) {
    try {
      rec = new SR();
      rec.lang = 'de-DE'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e) => {
        let f = '', it = '';
        for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) f += r[0].transcript + ' '; else it += r[0].transcript; }
        finalTxt = (baseTxt + ' ' + f).trim(); interim = it.trim(); showText();
      };
      rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { srFailed = true; showText(); } };
      rec.onend = () => {
        if (active && !srFailed && srRestarts < 8) {
          srRestarts++;
          baseTxt = (finalTxt + ' ' + interim).trim(); finalTxt = baseTxt; interim = '';
          try { rec.start(); } catch { /* */ }
        }
      };
      rec.start();
    } catch { srFailed = true; }
  }

  $('#micBtn').classList.add('rec');
  const entry = openSheet(`<div class="grab"></div><div class="sheet-head"><span style="width:80px"></span><h2>Sprachnotiz</h2><span style="width:80px"></span></div>
    <div class="sheet-body"><div class="rec-wrap">
      <div class="orb" id="orb">${ic('mic')}</div>
      <div class="rec-time" id="recTime">0:00</div>
      <div class="rec-text glass" id="recText"><span class="ph">Sprich einfach los …</span></div>
      <div class="rec-actions"><button class="glass press" data-x="cancel">Abbrechen</button><button class="stop press" data-x="stop">Fertig</button></div>
    </div></div>`, { onClose: () => cleanup(true) });
  const sh = entry.sh;

  function showText() {
    const box = $('#recText', sh);
    if (!box) return;
    if (finalTxt || interim) box.innerHTML = `${esc(finalTxt)} <span class="interim">${esc(interim)}</span>`;
    else if (srFailed) box.innerHTML = `<span class="ph">Live-Text ist hier nicht verfügbar – die Aufnahme wird trotzdem gespeichert.</span>`;
  }

  let stream = null, mr = null, chunks = [], raf = 0, t0 = Date.now(), timer = 0, cancelled = false, finished = false;
  timer = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    const el = $('#recTime', sh); if (el) el.textContent = D.fmtDur(s);
    if (s > 300) finish();
  }, 250);

  mediaP.then((st) => {
    if (!active) { st.getTracks().forEach((t) => t.stop()); return; }
    stream = st;
    if (window.MediaRecorder) {
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac'].find((m) => MediaRecorder.isTypeSupported?.(m));
      try {
        mr = new MediaRecorder(st, mime ? { mimeType: mime } : undefined);
        mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        mr.start(500);
      } catch { mr = null; }
    }
    try { // level meter -> orb
      if (!ctx) throw new Error('noctx');
      ctx.resume?.();
      const an = ctx.createAnalyser(); an.fftSize = 512;
      ctx.createMediaStreamSource(st).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const orb = $('#orb', sh);
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
        const lvl = Math.min(1, Math.sqrt(sum / buf.length) / 40);
        if (orb) orb.style.transform = `scale(${1 + lvl * 0.28})`;
        raf = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* no meter */ }
  }).catch(() => {
    if (srFailed) {
      toast('Kein Mikrofonzugriff', { sub: 'Erlaube das Mikrofon: iPhone-Einstellungen → Apps → Safari → Mikrofon.' });
      entry.close();
    }
  });

  function cleanup(fromClose) {
    active = false;
    clearInterval(timer); cancelAnimationFrame(raf);
    try { rec?.abort?.(); } catch { /* */ }
    $('#micBtn').classList.remove('rec');
    if (fromClose && !finished) { cancelled = true; stopStream(); }
  }
  function stopStream() {
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    try { ctx?.close(); } catch { /* */ }
  }

  async function finish() {
    if (finished) return;
    finished = true; active = false;
    clearInterval(timer); cancelAnimationFrame(raf);
    $('#orb', sh)?.classList.add('paused');
    const dur = (Date.now() - t0) / 1000;
    try { rec?.stop(); } catch { /* */ }
    let blob = null;
    if (mr && mr.state !== 'inactive') {
      blob = await new Promise((res) => { mr.onstop = () => res(new Blob(chunks, { type: mr.mimeType || 'audio/mp4' })); try { mr.stop(); } catch { res(null); } });
    }
    stopStream();
    await new Promise((r) => setTimeout(r, 450)); // let last speech result arrive
    const text = (finalTxt + ' ' + interim).replace(/\s+/g, ' ').trim();
    if (blob && blob.size < 1000) blob = null;
    entry.close();
    const res = { blob, dur, text };
    if (onDone) onDone(res);
    else if (blob || text) {
      const p = text ? parseText(text) : { title: '' };
      const ctxd = contextDefaults();
      openEditor(null, { ...ctxd, title: p.title || '', date: p.date || ctxd.date || null, time: p.time || null, endTime: p.endTime || null, kind: p.endTime ? 'event' : 'task', transcript: text, _audio: blob ? { blob, dur } : null });
    } else toast('Nichts aufgenommen', { sub: 'Versuch es noch einmal.' });
  }

  $('[data-x="stop"]', sh).addEventListener('click', finish);
  $('[data-x="cancel"]', sh).addEventListener('click', () => entry.close());
}

// ======================= audio playback =======================
let player = null, playingKey = null;
function stopAudio() {
  if (player) { player.pause(); URL.revokeObjectURL(player.src); }
  player = null;
  $$('.play.playing').forEach((b) => { b.classList.remove('playing'); b.innerHTML = PLAY; });
  playingKey = null;
}
function playBlob(blob, btn, key = 'draft') {
  if (playingKey === key) { stopAudio(); return; }
  stopAudio();
  player = new Audio(URL.createObjectURL(blob));
  player.playsInline = true;
  playingKey = key;
  const btns = btn ? [btn] : $$(`[data-audio="${key}"]`);
  btns.forEach((b) => { b.classList.add('playing'); b.innerHTML = PAUSE; });
  player.onended = stopAudio;
  player.play().catch(() => { stopAudio(); toast('Wiedergabe nicht möglich'); });
}
async function playAudio(id, btn) {
  if (playingKey === id) { stopAudio(); return; }
  const a = await db.get('audio', id);
  if (!a) { toast('Aufnahme nicht gefunden'); return; }
  playBlob(new Blob([a.data], { type: a.type }), btn, id);
  if (!btn) return;
}

// ======================= reminders =======================
const rKey = (it) => `${it.date}|${it.time}|${it.remind}`;
function fireAt(it) {
  if (it.remind == null || !it.date || it.done) return null;
  const [y, m, d] = it.date.split('-').map(Number);
  const [h, mi] = (it.time || '09:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, mi).getTime() - it.remind * 60000;
}
async function checkReminders() {
  const now = Date.now();
  for (const it of S.items) {
    const f = fireAt(it);
    if (f == null || f > now || it.firedKey === rKey(it)) continue;
    it.firedKey = rKey(it);
    await db.put('items', it);
    if (now - f < 6 * 3600e3) notify(it);
  }
}
async function notify(it) {
  const body = `${D.fmtRel(it.date)}${it.time ? ' · ' + it.time : ''}${it.kind === 'event' ? ' · Termin' : ''}`;
  if (document.visibilityState === 'visible') toast(`🔔 ${it.title}`, { sub: body, ms: 8000 });
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification(it.title, { body, tag: it.id, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
    }
  } catch { /* */ }
}
function askNotifyOnce() {
  if (!('Notification' in window) || Notification.permission !== 'default' || ls.get('askedNotify', false)) return;
  ls.set('askedNotify', true);
  Notification.requestPermission().catch(() => {});
}

// ======================= .ics export =======================
function icsEsc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
function exportIcs(it) {
  if (!it.date) return;
  const dt = it.date.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Klar//Todo//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:${it.id}@klar`, `DTSTAMP:${stamp}`];
  if (it.time) {
    let end = it.endTime;
    if (!end || end <= it.time) { const [h, m] = it.time.split(':').map(Number); const e = Math.min(23 * 60 + 59, h * 60 + m + (it.kind === 'event' ? 60 : 30)); end = `${D.pad(Math.floor(e / 60))}:${D.pad(e % 60)}`; }
    L.push(`DTSTART:${dt}T${it.time.replace(':', '')}00`, `DTEND:${dt}T${end.replace(':', '')}00`);
  } else {
    L.push(`DTSTART;VALUE=DATE:${dt}`, `DTEND;VALUE=DATE:${D.addDays(it.date, 1).replace(/-/g, '')}`);
  }
  const RR = { daily: 'FREQ=DAILY', weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', weekly: 'FREQ=WEEKLY', biweekly: 'FREQ=WEEKLY;INTERVAL=2', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' };
  if (it.repeat && RR[it.repeat]) L.push(`RRULE:${RR[it.repeat]}`);
  L.push(`SUMMARY:${icsEsc(it.title || 'Termin')}`);
  const desc = [it.notes, it.transcript && `Sprachnotiz: ${it.transcript}`].filter(Boolean).join('\n\n');
  if (desc) L.push(`DESCRIPTION:${icsEsc(desc)}`);
  const remind = it.remind ?? (it.time ? 15 : null);
  if (remind != null) {
    let trig;
    if (it.time) trig = remind === 0 ? 'PT0M' : `-PT${remind}M`;
    else { const off = 540 - remind; trig = off >= 0 ? `PT${off}M` : `-PT${-off}M`; }
    L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(it.title)}`, `TRIGGER:${trig}`, 'END:VALARM');
  }
  L.push('END:VEVENT', 'END:VCALENDAR');
  const blob = new Blob([L.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) a.download = `${(it.title || 'termin').replace(/[^\wäöüÄÖÜß -]/g, '').slice(0, 40) || 'termin'}.ics`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ======================= settings / backup =======================
function openSettings() {
  const entry = openSheet(`<div class="grab"></div><div class="sheet-head"><span style="width:70px"></span><h2>Einstellungen</h2>
    <button class="pill-btn primary" data-x="close">Fertig</button></div><div class="sheet-body"></div>`);
  const body = $('.sheet-body', entry.sh);
  async function draw() {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const permTxt = { granted: 'Erlaubt ✓', denied: 'Blockiert', default: 'Tippen zum Erlauben', unsupported: isStandalone() ? 'Nicht verfügbar' : 'Erst als App installieren' }[perm];
    let persisted = false; try { persisted = await navigator.storage?.persisted?.(); } catch { /* */ }
    let usage = ''; try { const e = await navigator.storage?.estimate?.(); if (e?.usage != null) usage = `${(e.usage / 1048576).toFixed(1)} MB belegt`; } catch { /* */ }
    const theme = ls.get('theme', 'system');
    body.innerHTML = `
      <div class="settings-group glass">
        <button class="frow" data-x="notify"><div class="lbl"><i style="--c:#ff9500">${ic('bell')}</i>Mitteilungen</div><span class="val">${permTxt}</span></button>
        <div class="frow"><div class="lbl"><i style="--c:#5856d6">${ic('moon')}</i>Darstellung</div><div class="ctl">
          <select id="sTheme"><option value="system" ${theme === 'system' ? 'selected' : ''}>Wie iPhone</option><option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option><option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option></select></div></div>
      </div>
      <div class="section-title">Daten & Backup</div>
      <div class="settings-group glass">
        <button class="frow" data-x="export"><div class="lbl"><i style="--c:#0a84ff">${ic('download')}</i>Backup sichern</div><span class="val">inkl. Sprachnotizen</span></button>
        <label class="frow" style="cursor:pointer"><div class="lbl"><i style="--c:#30d158">${ic('upload')}</i>Backup laden</div><span class="val">wird ergänzt</span>
          <input type="file" id="sImport" accept="application/json,.json" hidden></label>
        <button class="frow" data-x="cleanup"><div class="lbl"><i style="--c:#8e8e93">${ic('broom')}</i>Erledigte aufräumen</div><span class="val">älter als 30 Tage</span></button>
      </div>
      <p class="hint">Alles wird nur auf diesem iPhone gespeichert (${S.items.length} Einträge${usage ? ', ' + usage : ''}${persisted ? ', dauerhaft geschützt' : ''}). Wenn du Klar vom Home-Bildschirm löschst, sind die Daten weg – sichere ab und zu ein Backup in „Dateien“/iCloud.</p>
      <p class="hint" style="text-align:center">Klar ${VERSION}</p>`;
    $('#sTheme', body).addEventListener('change', (e) => { ls.set('theme', e.target.value); applyTheme(); });
    $('#sImport', body).addEventListener('change', async (e) => { const f = e.target.files?.[0]; if (f) { await importBackup(f); draw(); } });
  }
  body.addEventListener('click', async (e) => {
    const x = e.target.closest('[data-x]');
    if (!x) return;
    if (x.dataset.x === 'notify') {
      if (!('Notification' in window)) { toast('Mitteilungen gibt es nur in der installierten App', { sub: 'Teilen → Zum Home-Bildschirm' }); return; }
      if (Notification.permission === 'denied') { toast('Mitteilungen sind blockiert', { sub: 'iPhone-Einstellungen → Mitteilungen → Klar' }); return; }
      await Notification.requestPermission(); draw();
    }
    if (x.dataset.x === 'export') exportBackup();
    if (x.dataset.x === 'cleanup') {
      const lim = Date.now() - 30 * 864e5;
      const old = S.items.filter((i) => i.done && (i.doneAt || 0) < lim);
      for (const i of old) await removeItem(i);
      toast(`${old.length} alte Einträge entfernt`); render(); draw();
    }
  });
  $('[data-x="close"]', entry.sh).addEventListener('click', () => entry.close());
  draw();
}

function abToB64(buf) {
  const bytes = new Uint8Array(buf); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToAb(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }

async function exportBackup() {
  const audio = (await db.all('audio')).map((a) => ({ id: a.id, type: a.type, b64: abToB64(a.data) }));
  const data = { app: 'klar', version: 1, exportedAt: new Date().toISOString(), items: S.items, lists: S.lists, audio };
  const name = `klar-backup-${D.today()}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Klar Backup' }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'klar') throw new Error('kein Klar-Backup');
    for (const l of data.lists || []) await saveList(l);
    for (const a of data.audio || []) await db.put('audio', { id: a.id, type: a.type, data: b64ToAb(a.b64) });
    for (const it of data.items || []) await save(it);
    S.lists.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    render();
    toast('Backup geladen ✓', { sub: `${(data.items || []).length} Einträge` });
  } catch (e) { toast('Backup konnte nicht geladen werden', { sub: e.message }); }
}

// ======================= toast =======================
function toast(text, { sub, action, ms = 4200 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast glass';
  el.innerHTML = `<div class="t">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>${action ? `<button>${esc(action[0])}</button>` : ''}`;
  const box = $('#toasts');
  while (box.children.length > 2) box.firstChild.remove();
  box.append(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 320); };
  if (action) $('button', el).addEventListener('click', () => { action[1](); kill(); });
  el.addEventListener('click', (e) => { if (!e.target.closest('button')) kill(); });
  setTimeout(kill, ms);
}

// ======================= boot =======================
function isStandalone() { return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches; }
function applyTheme() {
  const t = ls.get('theme', 'system');
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').content = dark ? '#070a16' : '#eef1f8';
}

async function boot() {
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  await load();
  render(true);
  requestAnimationFrame(() => moveTabInd(false));
  window.addEventListener('resize', () => { moveTabInd(false); $$('.seg').forEach(placeSeg); });
  try { navigator.storage?.persist?.(); } catch { /* */ }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  checkReminders();
  setInterval(checkReminders, 20000);
  setInterval(() => { if (S.day !== D.today()) { S.day = D.today(); rollEvents().then(() => render()); } }, 60000);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    if (S.day !== D.today()) { S.day = D.today(); S.calSel = S.calCursor = D.today(); await rollEvents(); }
    render(); checkReminders();
  });
}
boot();
