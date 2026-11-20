// GTA 6 trophy guide and tracker: checklist, filters, spoiler mode, roadmap,
// per-trophy guides with cited sources. Everything runs offline from local files;
// progress lives in localStorage and is only shared when the user exports it.
const KEY = 'gta6-trophy-guide-v1';
const rowsEl = document.getElementById('rows');
const detailPanel = document.getElementById('detail-panel');
const detailEl = document.getElementById('detail');
const roadmapEl = document.getElementById('roadmap');
const countLine = document.getElementById('count-line');
const ioStatus = document.getElementById('io-status');

let trophies = [];
let earned = new Set();

const ROADMAP = [
  { title: 'Step 1 — Play the story, chapters 1–4, and mind the one missable trophy.', covers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28], note: 'Meditate at Lucia\'s balcony spot in Chapter 1 before it ends (Positive Mental Attitude). Keep a manual save at the start of every chapter and one before the final mission.' },
  { title: 'Step 2 — Finish the side-character strands: Andy, Kenton, Billy, Randy and Tyrone, plus Bret\'s hunt.', covers: [22, 23, 24, 26, 27, 29], note: 'These strands feed Strangers & Freaks (8 strands) too.' },
  { title: 'Step 3 — Stranger strands and the odd one-offs.', covers: [25, 37, 38, 44, 45, 46, 47, 48, 49, 50, 51], note: 'Five of these (In The Beginning…, Capital Offense, Bad Luck I Guess, The Truth Is Out There, Ten Pin) had no confirmed unlock method at launch — their guides say so plainly.' },
  { title: 'Step 4 — Activities: stunts, races, fishing, arcade, bowling, drone races, shooting range, meditation.', covers: [15, 16, 17, 18, 19, 20, 21, 28], note: 'Counts to chase: 250 stunts, 42 shooting-range golds, 14 drone-race locations, 18 meditation spots.' },
  { title: 'Step 5 — Collectibles and exploration: cards, WAiNK It, vehicles, all of Leonida.', covers: [30, 31, 35, 42, 54, 55], note: '3 card sets, 100 WAiNK locations, 100 vehicles discovered.' },
  { title: 'Step 6 — Money and mayhem: robberies, heists, laundering, spending.', covers: [33, 34, 36, 39, 40, 41, 43, 52, 53], note: '5 bank vaults, $250,000 laundered, $100,000 spent.' },
  { title: 'Step 7 — The long tail: 50 of 80 challenges, then 100% completion.', covers: [32, 14], note: '100% needs 70 of the 80 challenges. This is the last stretch before the platinum.' },
  { title: 'Step 8 — Platinum: Vice Got a Price!', covers: [1], note: 'Earn the other 54 trophies. About 200 hours in total, per the cited guides.' },
];

function loadEarned() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((n) => Number.isInteger(n)));
  } catch { earned = new Set(); }
}
function saveEarned() {
  try { localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b))); } catch { /* storage unavailable */ }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function spoilerOn() { return document.getElementById('spoiler').checked; }
function isSpoilerHidden(t) {
  return spoilerOn() && !earned.has(t.id) && (t.hidden || t.category === 'story');
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('earned-count').textContent = done + '/' + total;
  document.getElementById('earned-pct').textContent = pct + '% to platinum';
  document.getElementById('progress-fill').style.width = pct + '%';
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || [0, 0];
    byGrade[t.grade][1]++;
    if (earned.has(t.id)) byGrade[t.grade][0]++;
  }
  document.getElementById('grade-counts').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => g + ' ' + (byGrade[g] ? byGrade[g][0] + '/' + byGrade[g][1] : '0/0')).join(' · ');
}

function renderRoadmap() {
  roadmapEl.innerHTML = '';
  const byId = Object.fromEntries(trophies.map((t) => [t.id, t]));
  for (const step of ROADMAP) {
    const li = el('li');
    li.appendChild(el('strong', null, step.title));
    if (step.note) li.appendChild(el('div', 'covers', step.note));
    const names = step.covers.map((id) => (byId[id] ? byId[id].name : '#' + id)).join(' · ');
    li.appendChild(el('div', 'covers', 'Covers: ' + names));
    roadmapEl.appendChild(li);
  }
}

function renderRows() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const grade = document.getElementById('filter-grade').value;
  const cat = document.getElementById('filter-category').value;
  const hid = document.getElementById('filter-hidden').value;
  const doneF = document.getElementById('filter-done').value;
  const missOnly = document.getElementById('filter-missable').checked;
  rowsEl.innerHTML = '';
  let shown = 0;
  for (const t of trophies) {
    if (q && !t.name.toLowerCase().includes(q)) continue;
    if (grade && t.grade !== grade) continue;
    if (cat && t.category !== cat) continue;
    if (hid === 'hidden' && !t.hidden) continue;
    if (hid === 'visible' && t.hidden) continue;
    if (doneF === 'done' && !earned.has(t.id)) continue;
    if (doneF === 'todo' && earned.has(t.id)) continue;
    if (missOnly && !t.missable) continue;
    shown++;
    const row = el('div', 'row' + (earned.has(t.id) ? ' done' : ''));
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = earned.has(t.id);
    cb.setAttribute('aria-label', 'Earned: ' + t.name);
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) earned.add(t.id); else earned.delete(t.id);
      saveEarned();
      renderProgress();
      renderRows();
    });
    row.appendChild(cb);
    const body = el('div');
    const hiddenNow = isSpoilerHidden(t);
    body.appendChild(el('div', hiddenNow ? 'name hidden-name' : 'name', hiddenNow ? 'Hidden trophy — earn it to reveal' : t.name));
    if (!hiddenNow) body.appendChild(el('div', 'desc', t.description));
    const tags = el('div', 'tags');
    tags.appendChild(el('span', 'badge ' + t.grade, t.grade));
    tags.appendChild(el('span', 'tag', t.category));
    if (t.hidden) tags.appendChild(el('span', 'tag hidden-tag', 'hidden'));
    if (t.missable) tags.appendChild(el('span', 'tag missable-tag', '⚠ possibly missable'));
    body.appendChild(tags);
    row.appendChild(body);
    row.addEventListener('click', () => openDetail(t.id));
    rowsEl.appendChild(row);
  }
  countLine.textContent = 'Showing ' + shown + ' of ' + trophies.length + ' trophies.';
}

function openDetail(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  detailEl.innerHTML = '';
  const hiddenNow = isSpoilerHidden(t);
  detailEl.appendChild(el('h3', null, hiddenNow ? 'Hidden trophy' : t.name));
  const tags = el('div', 'tags');
  tags.appendChild(el('span', 'badge ' + t.grade, t.grade));
  tags.appendChild(el('span', 'tag', t.category));
  if (t.hidden) tags.appendChild(el('span', 'tag hidden-tag', 'hidden'));
  if (t.missable) tags.appendChild(el('span', 'tag missable-tag', '⚠ possibly missable'));
  detailEl.appendChild(tags);
  if (!hiddenNow) {
    detailEl.appendChild(el('p', 'desc', t.description));
    detailEl.appendChild(el('p', 'guide-text', t.guide));
    const src = el('p', 'source-line', 'Source: ');
    const a = document.createElement('a');
    a.href = t.source.url;
    a.textContent = t.source.name;
    a.target = '_blank';
    a.rel = 'noopener';
    src.appendChild(a);
    detailEl.appendChild(src);
  } else {
    detailEl.appendChild(el('p', 'desc', 'Hidden trophy — earn it to reveal. Grade: ' + t.grade + '.'));
  }
  const toggle = el('button', null, earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned');
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveEarned();
    renderProgress();
    renderRows();
    openDetail(id);
  });
  detailEl.appendChild(toggle);
  detailPanel.classList.remove('hidden');
  detailPanel.scrollIntoView({ behavior: 'instant', block: 'start' });
}

document.getElementById('detail-close').addEventListener('click', () => {
  detailPanel.classList.add('hidden');
});

for (const id of ['search', 'filter-grade', 'filter-category', 'filter-hidden', 'filter-done', 'filter-missable', 'spoiler']) {
  document.getElementById(id).addEventListener('input', renderRows);
  document.getElementById(id).addEventListener('change', renderRows);
}

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  ioStatus.textContent = 'Progress exported.';
});

document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      earned = new Set(ids.filter((n) => Number.isInteger(n) && trophies.some((t) => t.id === n)));
      saveEarned();
      renderProgress();
      renderRows();
      ioStatus.textContent = 'Progress imported: ' + earned.size + ' earned.';
    } catch {
      ioStatus.textContent = 'Import failed: not a valid progress file.';
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  earned = new Set();
  saveEarned();
  renderProgress();
  renderRows();
  ioStatus.textContent = 'Progress reset.';
});

async function init() {
  loadEarned();
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies;
  renderProgress();
  renderRoadmap();
  renderRows();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  // Screenshot modes: hide the panels that are not the subject, so the wanted
  // content sits at the top of the viewport without scrolling (the headless
  // shell's screenshot does not reliably capture a scrolled page).
  const hide = (id) => { const n = document.getElementById(id); if (n) n.style.display = 'none'; };
  if (shot === 'checklist') {
    hide('roadmap-panel');
    hide('about-panel');
  } else if (shot === 'detail') {
    hide('roadmap-panel');
    hide('controls-panel');
    hide('about-panel');
    const id = Number(params.get('id'));
    if (id) openDetail(id);
  } else if (shot === 'roadmap') {
    hide('controls-panel');
    hide('detail-panel');
    hide('about-panel');
  } else if (shot === 'filter') {
    hide('roadmap-panel');
    hide('about-panel');
    document.getElementById('filter-grade').value = 'silver';
    document.getElementById('spoiler').checked = true;
    renderRows();
  }
}
init();
