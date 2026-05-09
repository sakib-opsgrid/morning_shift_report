/* ============================================================
   Morning Shift Report — app.js
   Infozillion Teletech Bd Ltd · Service Assurance
   ============================================================ */

'use strict';

/* ── Constants ──────────────────────────────────────────── */
const OPERATORS = ['GP', 'RB', 'TT', 'BL'];

const DLR_CODES = [
  { code: '1000', label: '1000 Success' },
  { code: '1020', label: '1020 Internal Server Error' },
  { code: '1052', label: '1052 Submission record not found' }
];

const LS_DRAFT   = 'msr_draft_v2';
const LS_HISTORY = 'msr_history_v2';
const LS_THEME   = 'msr_theme';

/* ── State ──────────────────────────────────────────────── */
const togState = {};
let autoSaveTimer = null;

/* ── DOM Ready ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDate();
  initToggles();
  initDlr();
  initTraffic();
  renderHistory();
  loadDraft();
  initCollapse();

  // Auto-save on any input change
  document.body.addEventListener('input', scheduleAutoSave);
  document.body.addEventListener('change', scheduleAutoSave);
});

/* ── Theme ──────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem(LS_THEME) || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS_THEME, theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── Date ───────────────────────────────────────────────── */
function initDate() {
  const el = document.getElementById('rep-date');
  if (el && !el.value) el.value = new Date().toISOString().slice(0, 10);
}

/* ── Collapse ───────────────────────────────────────────── */
function initCollapse() {
  document.querySelectorAll('.card-header[data-collapse]').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.card');
      card.classList.toggle('collapsed');
    });
  });
}

/* ── Toggles ────────────────────────────────────────────── */
function initToggles() {
  setTog('1xx', 'ok');
  setTog('issue', 'ok');
}

function setTog(key, val) {
  togState[key] = val;

  const okBtn    = document.getElementById(`tog-${key}-ok`);
  const issueBtn = document.getElementById(`tog-${key}-issue`);
  if (okBtn)    okBtn.className    = 'tog' + (val === 'ok'    ? ' ok'    : '');
  if (issueBtn) issueBtn.className = 'tog' + (val === 'issue' ? ' issue' : '');

  if (key === '1xx') {
    const okDet    = document.getElementById('det-1xx-ok');
    const issueDet = document.getElementById('det-1xx-issue');
    if (okDet)    okDet.style.display    = val === 'ok'    ? 'block' : 'none';
    if (issueDet) issueDet.style.display = val === 'issue' ? 'block' : 'none';
  }
  if (key === 'issue') {
    const det = document.getElementById('det-issue');
    if (det) det.style.display = val === 'issue' ? 'block' : 'none';
  }
  scheduleAutoSave();
}

/* ── 5xx Auto Total + sync Network display ──────────────── */
function calcTotal(op) {
  const v504  = parseInt(document.querySelector(`.h5-504[data-op="${op}"]`)?.value) || 0;
  const v502  = parseInt(document.querySelector(`.h5-502[data-op="${op}"]`)?.value) || 0;
  const total = v504 + v502;

  const elTotal = document.getElementById(`total-${op}`);
  if (elTotal) elTotal.textContent = total;

  // Sync Network section display
  const n504 = document.getElementById(`net-504-${op}`);
  const n502 = document.getElementById(`net-502-${op}`);
  const nErr = document.getElementById(`net-err-${op}`);
  if (n504) n504.textContent = v504;
  if (n502) n502.textContent = v502;
  if (nErr) nErr.textContent = total;
}

/* ── DLR ────────────────────────────────────────────────── */
function initDlr() {
  const dn = new Date();
  const d1 = new Date(dn); d1.setDate(dn.getDate() - 2);
  const d2 = new Date(dn); d2.setDate(dn.getDate() - 1);
  addDlrDate(d1.toISOString().slice(0, 10));
  addDlrDate(d2.toISOString().slice(0, 10));
}

function addDlrDate(dateVal = '', vals = {}) {
  const container = document.getElementById('dlr-dates');
  const id = 'dlr_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  const block = document.createElement('div');
  block.className = 'dlr-date-block';
  block.id = id;

  const rowsHtml = DLR_CODES.map(c => `
    <div class="dlr-row">
      <div class="dlr-code">${c.label}</div>
      <input type="number" class="dlr-val" data-code="${c.code}"
        placeholder="0" min="0" value="${vals[c.code] || ''}" oninput="scheduleAutoSave()">
    </div>`).join('');

  block.innerHTML = `
    <div class="dlr-block-header">
      <input type="date" class="dlr-date" value="${dateVal}"
        style="width:160px;" onchange="scheduleAutoSave()">
      <button class="btn-icon" onclick="document.getElementById('${id}').remove();scheduleAutoSave()">× Remove</button>
    </div>
    ${rowsHtml}`;
  container.appendChild(block);
}

/* ── Traffic ────────────────────────────────────────────── */
function initTraffic() {
  const today = new Date();
  for (let i = 6; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    addTrafficRow(d.toISOString().slice(0, 10), '');
  }
}

function fmtNum(n) { return (parseInt(n) || 0).toLocaleString(); }

function recalcAll() {
  const rows = document.querySelectorAll('#traffic-list .tr-row');
  rows.forEach((row, i) => {
    const cur   = parseInt(row.querySelector('.tr-vol')?.value) || 0;
    const badge = row.querySelector('.pct-badge');
    if (!badge) return;
    if (i === 0) { badge.textContent = '—'; badge.className = 'pct-badge pct-neu'; row.dataset.pct = '—'; return; }
    const prev = parseInt(rows[i - 1].querySelector('.tr-vol')?.value) || 0;
    if (prev === 0) { badge.textContent = '—'; badge.className = 'pct-badge pct-neu'; row.dataset.pct = '—'; return; }
    const pct  = (cur - prev) / prev * 100;
    const sign = pct >= 0 ? '+' : '';
    const txt  = `${sign}${pct.toFixed(2)}%`;
    badge.textContent = txt;
    badge.className   = 'pct-badge ' + (pct > 0 ? 'pct-up' : pct < 0 ? 'pct-dn' : 'pct-neu');
    row.dataset.pct   = txt;
  });
  scheduleAutoSave();
}

function addTrafficRow(date = '', vol = '') {
  const list = document.getElementById('traffic-list');
  const row  = document.createElement('div');
  row.className = 'tr-row';
  row.innerHTML = `
    <input type="date"   class="tr-date" value="${date}" style="font-size:12px;padding:6px 8px;">
    <input type="number" class="tr-vol"  placeholder="volume" value="${vol}" style="font-size:12px;padding:6px 8px;">
    <span class="pct-badge pct-neu">—</span>
    <button class="btn-icon" onclick="this.closest('.tr-row').remove();recalcAll()">×</button>`;
  row.querySelector('.tr-vol').addEventListener('input', recalcAll);
  row.querySelector('.tr-date').addEventListener('change', recalcAll);
  list.appendChild(row);
  recalcAll();
}

function trafficSummary() {
  const rows = document.querySelectorAll('#traffic-list .tr-row');
  if (!rows.length) return 'No data';
  const pct = rows[rows.length - 1].dataset.pct || '—';
  if (pct === '—') return 'No change data';
  const val = parseFloat(pct);
  return isNaN(val) ? pct : val > 0 ? `Increase: ${pct}` : val < 0 ? `Decrease: ${pct}` : `No Change: ${pct}`;
}

/* ── Todo ───────────────────────────────────────────────── */
function addTodo(val = '') {
  const list = document.getElementById('todo-list');
  const row  = document.createElement('div');
  row.className = 'todo-item';
  row.innerHTML = `
    <input type="text" class="todo-txt" placeholder="e.g. Guide Royal Green IPTSP through UAT" value="${val}" oninput="scheduleAutoSave()">
    <button class="btn-icon" onclick="this.closest('.todo-item').remove();scheduleAutoSave()">×</button>`;
  list.appendChild(row);
}

/* ── Date Format ────────────────────────────────────────── */
function fmtDateLabel(iso) {
  if (!iso) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, dd] = iso.split('-');
  return `${parseInt(dd)} ${months[parseInt(m) - 1]} ${y}`;
}

/* ── Auto-save ──────────────────────────────────────────── */
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveDraft, 800);
}

function saveDraft() {
  try {
    const data = collectFormData();
    localStorage.setItem(LS_DRAFT, JSON.stringify(data));
    showSaveIndicator();
  } catch (e) { /* storage might be full */ }
}

function showSaveIndicator() {
  const el = document.getElementById('save-indicator');
  if (!el) return;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(LS_DRAFT);
    if (!raw) return;
    const data = JSON.parse(raw);
    restoreFormData(data);
  } catch (e) { /* corrupt draft, ignore */ }
}

function collectFormData() {
  const dlrBlocks = [];
  document.querySelectorAll('.dlr-date-block').forEach(block => {
    const dateVal = block.querySelector('.dlr-date')?.value || '';
    const vals = {};
    block.querySelectorAll('.dlr-val').forEach(inp => { vals[inp.dataset.code] = inp.value; });
    dlrBlocks.push({ dateVal, vals });
  });

  const trafficRows = [];
  document.querySelectorAll('#traffic-list .tr-row').forEach(row => {
    trafficRows.push({
      date: row.querySelector('.tr-date')?.value || '',
      vol:  row.querySelector('.tr-vol')?.value  || ''
    });
  });

  const todos = [...document.querySelectorAll('.todo-txt')].map(i => i.value);
  const ops5xx = {};
  OPERATORS.forEach(op => {
    ops5xx[op] = {
      e504: document.querySelector(`.h5-504[data-op="${op}"]`)?.value || '',
      e502: document.querySelector(`.h5-502[data-op="${op}"]`)?.value || ''
    };
  });
  const netData = {};
  OPERATORS.forEach(op => {
    netData[op] = {
      times: document.querySelector(`.net-times[data-op="${op}"]`)?.value || ''
    };
  });

  return {
    date:          document.getElementById('rep-date')?.value      || '',
    author:        document.getElementById('rep-author')?.value    || '',
    tog1xx:        togState['1xx']   || 'ok',
    togIssue:      togState['issue'] || 'ok',
    txt1xxOk:      document.getElementById('txt-1xx-ok')?.value    || '',
    txt1xxIssue:   document.getElementById('txt-1xx-issue')?.value || '',
    txt5xxOverall: document.getElementById('txt-5xx-overall')?.value || '',
    ops5xx,
    dlrBlocks,
    dlrOverall:    document.getElementById('dlr-overall')?.value   || '',
    netData,
    netOverall:    document.getElementById('net-overall')?.value   || '',
    chWa:  document.getElementById('ch-wa')?.value  || '',
    chPh:  document.getElementById('ch-ph')?.value  || '',
    chEm:  document.getElementById('ch-em')?.value  || '',
    chTk:  document.getElementById('ch-tk')?.value  || '',
    todos,
    trafficRows
  };
}

function restoreFormData(data) {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

  set('rep-date',       data.date);
  set('rep-author',     data.author);
  set('txt-1xx-ok',     data.txt1xxOk);
  set('txt-1xx-issue',  data.txt1xxIssue);
  set('txt-5xx-overall',data.txt5xxOverall);
  set('dlr-overall',    data.dlrOverall);
  set('net-overall',    data.netOverall);
  set('ch-wa',  data.chWa);
  set('ch-ph',  data.chPh);
  set('ch-em',  data.chEm);
  set('ch-tk',  data.chTk);

  if (data.tog1xx)   setTog('1xx',   data.tog1xx);
  if (data.togIssue) setTog('issue', data.togIssue);

  OPERATORS.forEach(op => {
    if (data.ops5xx?.[op]) {
      const el504 = document.querySelector(`.h5-504[data-op="${op}"]`);
      const el502 = document.querySelector(`.h5-502[data-op="${op}"]`);
      if (el504) el504.value = data.ops5xx[op].e504;
      if (el502) el502.value = data.ops5xx[op].e502;
      calcTotal(op);
    }
    if (data.netData?.[op]) {
      const elT = document.querySelector(`.net-times[data-op="${op}"]`);
      if (elT) elT.value = data.netData[op].times;
      calcTotal(op);
    }
  });

  // Restore DLR (clear defaults first)
  if (data.dlrBlocks?.length) {
    document.getElementById('dlr-dates').innerHTML = '';
    data.dlrBlocks.forEach(b => addDlrDate(b.dateVal, b.vals));
  }

  // Restore traffic
  if (data.trafficRows?.length) {
    document.getElementById('traffic-list').innerHTML = '';
    data.trafficRows.forEach(r => addTrafficRow(r.date, r.vol));
  }

  // Restore todos
  if (data.todos?.length) {
    document.getElementById('todo-list').innerHTML = '';
    data.todos.forEach(t => addTodo(t));
  }
}

/* ── History ────────────────────────────────────────────── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; }
  catch { return []; }
}

function saveToHistory(msg, date) {
  const hist = getHistory();
  const entry = {
    id:      Date.now(),
    date:    date,
    time:    new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }),
    preview: msg.slice(0, 80),
    msg
  };
  hist.unshift(entry);
  const trimmed = hist.slice(0, 30); // keep last 30
  localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
  renderHistory();
}

function renderHistory() {
  const list  = document.getElementById('history-list');
  if (!list) return;
  const hist  = getHistory();
  if (!hist.length) {
    list.innerHTML = '<div class="history-empty">No reports saved yet.<br>Generate a report to save it here.</div>';
    return;
  }
  list.innerHTML = hist.map(entry => `
    <div class="history-item">
      <div class="history-item-date">${entry.date || '—'}</div>
      <div class="history-item-time">Saved at ${entry.time}</div>
      <div class="history-item-preview">${entry.preview}…</div>
      <div class="history-item-actions">
        <button class="btn btn-ghost" style="padding:4px 10px;font-size:11px;" onclick="copyHistoryItem(${entry.id})">Copy</button>
        <button class="btn btn-ghost" style="padding:4px 10px;font-size:11px;color:var(--red);" onclick="deleteHistoryItem(${entry.id})">Delete</button>
      </div>
    </div>`).join('');
}

function copyHistoryItem(id) {
  const entry = getHistory().find(e => e.id === id);
  if (!entry) return;
  navigator.clipboard.writeText(entry.msg).then(() => showToast('✓ Copied to clipboard!'));
}

function deleteHistoryItem(id) {
  const hist    = getHistory().filter(e => e.id !== id);
  localStorage.setItem(LS_HISTORY, JSON.stringify(hist));
  renderHistory();
}

function openHistory()  { document.getElementById('history-panel').classList.add('open'); document.getElementById('history-overlay').classList.add('open'); }
function closeHistory() { document.getElementById('history-panel').classList.remove('open'); document.getElementById('history-overlay').classList.remove('open'); }

/* ── Toast ──────────────────────────────────────────────── */
function showToast(msg, duration = 2500) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── Generate & Copy ─────────────────────────────────────── */
function generateAndCopy() {
  const dateVal = document.getElementById('rep-date')?.value || '';
  const [y, m, d] = dateVal.split('-');
  const dateDisp  = dateVal ? `${d}/${m}/${y}` : '—';

  /* 1xx */
  const txt1xx = togState['1xx'] === 'issue'
    ? (document.getElementById('txt-1xx-issue')?.value.trim() || 'Issue — details pending')
    : (document.getElementById('txt-1xx-ok')?.value.trim()    || 'Error observed minimal as usual.');

  /* 5xx */
  const overall5xx = document.getElementById('txt-5xx-overall')?.value.trim() || '';
  let http5xxLines = '';
  OPERATORS.forEach(op => {
    const e504  = parseInt(document.querySelector(`.h5-504[data-op="${op}"]`)?.value) || 0;
    const e502  = parseInt(document.querySelector(`.h5-502[data-op="${op}"]`)?.value) || 0;
    const total = e504 + e502;
    let detail  = '';
    if (e504 > 0) detail += ` (HTTP 504=${e504})`;
    if (e502 > 0) detail += ` (HTTP 502=${e502})`;
    http5xxLines += `* ${op}: ${total}${detail}\n`;
  });

  /* DLR */
  let dlrLines = '';
  document.querySelectorAll('.dlr-date-block').forEach(block => {
    const dateIso = block.querySelector('.dlr-date')?.value;
    if (!dateIso) return;
    dlrLines += `Date: ${fmtDateLabel(dateIso)}\n`;
    block.querySelectorAll('.dlr-val').forEach(inp => {
      const codeObj = DLR_CODES.find(c => c.code === inp.dataset.code);
      dlrLines += `* ${codeObj.label} = ${fmtNum(inp.value)}\n`;
    });
  });
  const dlrOverall = document.getElementById('dlr-overall')?.value.trim() || '';

  /* Network — Errors auto = 504+502 total */
  let netLines = '';
  OPERATORS.forEach(op => {
    const t    = parseInt(document.querySelector(`.net-times[data-op="${op}"]`)?.value) || 0;
    const e504 = parseInt(document.querySelector(`.h5-504[data-op="${op}"]`)?.value)    || 0;
    const e502 = parseInt(document.querySelector(`.h5-502[data-op="${op}"]`)?.value)    || 0;
    const e    = e504 + e502;
    netLines += `* ${op}: ${t} ${t === 1 ? 'time' : 'times'} | Errors: ${fmtNum(e)}\n`;
  });
  const netOverall = document.getElementById('net-overall')?.value.trim() || '';

  /* Client */
  const wa = parseInt(document.getElementById('ch-wa')?.value) || 0;
  const ph = parseInt(document.getElementById('ch-ph')?.value) || 0;
  const em = parseInt(document.getElementById('ch-em')?.value) || 0;
  const tk = parseInt(document.getElementById('ch-tk')?.value) || 0;

  /* Issues */
  let issueLines = '';
  if (togState['issue'] === 'issue') {
    const todos = [...document.querySelectorAll('.todo-txt')].map(i => i.value.trim()).filter(Boolean);
    issueLines = todos.length ? `To-do:\n` + todos.map(t => `* ${t}`).join('\n') : 'Pending — details TBD';
  } else {
    issueLines = 'None.';
  }

  /* Traffic */
  const tRows = document.querySelectorAll('#traffic-list .tr-row');
  let trafficLines = '';
  tRows.forEach(row => {
    const rd = row.querySelector('.tr-date')?.value;
    const rv = row.querySelector('.tr-vol')?.value;
    const rp = row.dataset.pct || '—';
    if (rd && rv) trafficLines += `   ${rd} : ${fmtNum(rv)}  |  ${rp}\n`;
  });

  /* Compose */
  const author = document.getElementById('rep-author')?.value.trim() || '';

  let msg = '';
  msg += `*System Monitoring Overview Report*\n`;
  msg += `Date: ${dateDisp}\n`;
  if (author) msg += `Prepared By: ${author}\n`;
  msg += `${'─'.repeat(24)}\n`;
  msg += `*1. HTTP Status (1xx / 5xx)*\n`;
  msg += `1xx: ${txt1xx}\n`;
  msg += `5xx: ${overall5xx}\n`;
  msg += http5xxLines;
  msg += `\n`;
  msg += `*2. Delay / DLR*\n`;
  msg += dlrLines;
  msg += `*Overall status:* ${dlrOverall}\n`;
  msg += `\n`;
  msg += `*3. Network (P2P / NTTN)*\n`;
  msg += netLines;
  msg += `*Overall status:* ${netOverall}\n`;
  msg += `\n`;
  msg += `*4. Client Communication*\n`;
  msg += `* WhatsApp: ${wa}\n`;
  msg += `* Phone: ${ph}\n`;
  msg += `* Email: ${em}\n`;
  msg += `* Ticket: ${tk}\n`;
  msg += `\n`;
  msg += `*5. Major / Pending Issue*\n`;
  msg += `${issueLines}\n`;
  msg += `\n`;
  msg += `*6. Traffic Trend (vs Previous Day)*\n`;
  msg += `* ${trafficSummary()}\n`;
  msg += trafficLines;

  /* Show preview */
  const previewSection = document.getElementById('preview-section');
  const previewBox     = document.getElementById('preview');
  previewBox.textContent = msg;
  previewSection.style.display = 'block';
  previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  /* Copy */
  navigator.clipboard.writeText(msg)
    .then(() => {
      showToast('✓ Copied to clipboard!');
      const btn = document.getElementById('copy-btn');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy WhatsApp Message'; }, 2500); }
      saveToHistory(msg, dateDisp);
      saveDraft();
    })
    .catch(() => {
      showToast('Clipboard error — please copy manually from preview');
    });
}

/* ── PDF / Print ─────────────────────────────────────────── */
function printReport() {
  const previewEl = document.getElementById('preview');
  if (!previewEl || !previewEl.textContent.trim()) {
    showToast('First generate the report, then print.');
    return;
  }
  const content = previewEl.textContent;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Morning Shift Report</title>
<style>
  body { font-family: 'Courier New', monospace; font-size: 13px; padding: 32px; color: #000; background: #fff; max-width: 700px; margin: 0 auto; }
  pre { white-space: pre-wrap; word-break: break-word; line-height: 1.8; }
  .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
  @media print { @page { margin: 20mm; } }
</style></head><body>
<pre>${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
<div class="footer">© 2026 Najmaz Sakib · Infozillion Teletech Bd Ltd · Service Assurance</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();
}


/* ── Google Sheet Traffic Fetch ──────────────────────────── */
const SHEET_ID  = '1iXJXX0eAyVcUKXyj9cF8SPpD4knJCzed';
const SHEET_GID = '1186344439';

async function fetchTrafficFromSheet() {
  const btn      = document.getElementById('fetch-traffic-btn');
  const statusEl = document.getElementById('fetch-traffic-status');

  btn.textContent = 'Fetching…';
  btn.disabled    = true;
  statusEl.textContent = 'Connecting to Google Sheet…';
  statusEl.className   = 'csv-status info';

  // gviz/tq returns JSONP-style — we use tqx=out:csv for plain CSV, CORS-safe
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.trim().length < 10) throw new Error('Empty response — check Sheet sharing settings');
    parseTrafficSheet(text);
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
    statusEl.className   = 'csv-status error';
  } finally {
    btn.textContent = 'Fetch from Google Sheet';
    btn.disabled    = false;
  }
}

function parseTrafficSheet(csvText) {
  const statusEl = document.getElementById('fetch-traffic-status');
  const rows = parseCsvText(csvText);

  // Find Date and Day End columns (case-insensitive)
  if (!rows.length) { statusEl.textContent = 'No data in sheet'; statusEl.className = 'csv-status error'; return; }

  // Detect header key for "Day End" — could be "Day End", "DayEnd", etc.
  const sampleKeys = Object.keys(rows[0]);
  const dayEndKey = sampleKeys.find(k => k.replace(/\s/g,'').toLowerCase() === 'dayend')
                 || sampleKeys.find(k => k.toLowerCase().includes('day') && k.toLowerCase().includes('end'));
  const dateKey   = sampleKeys.find(k => k.toLowerCase() === 'date');

  if (!dayEndKey || !dateKey) {
    statusEl.textContent = `Column not found. Found: ${sampleKeys.slice(0,6).join(', ')}`;
    statusEl.className = 'csv-status error';
    return;
  }

  // Filter rows that have a valid Day End number, then take last 6
  const valid = rows.filter(r => {
    const val = (r[dayEndKey] || '').replace(/,/g, '').trim();
    return val && !isNaN(parseInt(val)) && parseInt(val) > 0 && r[dateKey]?.trim();
  });

  const last6 = valid.slice(-6);
  if (!last6.length) {
    statusEl.textContent = 'No rows with Day End values found';
    statusEl.className = 'csv-status error';
    return;
  }

  // Clear and repopulate traffic list
  document.getElementById('traffic-list').innerHTML = '';
  last6.forEach(row => {
    const rawDate = row[dateKey].trim();
    const isoDate = parseSheetDate(rawDate);
    const vol     = (row[dayEndKey] || '').replace(/,/g, '').trim();
    addTrafficRow(isoDate, vol);
  });

  statusEl.textContent = `Loaded ${last6.length} days (${last6[0][dateKey].trim()} → ${last6[last6.length-1][dateKey].trim()})`;
  statusEl.className = 'csv-status ok';
  showToast(`Traffic: ${last6.length} days loaded from Sheet`);
  scheduleAutoSave();
}

// Parse dates like "08-May-26", "2026-05-08", "5/8/2026", "08-May-2026"
function parseSheetDate(raw) {
  if (!raw) return '';
  raw = raw.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // DD-Mon-YY or DD-Mon-YYYY (e.g. "08-May-26" or "08-May-2026")
  const m1 = raw.match(/^(\d{1,2})[- ]([A-Za-z]+)[- ](\d{2,4})$/);
  if (m1) {
    const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
    const mon = months[m1[2].toLowerCase().slice(0,3)];
    let yr = m1[3];
    if (yr.length === 2) yr = '20' + yr;
    return `${yr}-${mon}-${m1[1].padStart(2,'0')}`;
  }

  // M/D/YYYY or MM/DD/YYYY
  const m2 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m2) {
    let yr = m2[3]; if (yr.length === 2) yr = '20' + yr;
    return `${yr}-${m2[1].padStart(2,'0')}-${m2[2].padStart(2,'0')}`;
  }

  return raw; // fallback as-is
}



// Gateway → Operator mapping (MNO)
const GW_TO_OP = {
  grameenphone: 'GP', grameen: 'GP', grameenp: 'GP',
  banglalink: 'BL',
  robi: 'RB',
  teletalk: 'TT'
};

function gwToOp(gw) {
  if (!gw) return null;
  const key = gw.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, v] of Object.entries(GW_TO_OP)) {
    if (key.includes(k)) return v;
  }
  return null;
}

// Simple CSV parser (handles quoted fields)
function parseCsvText(text) {
  const lines = text.trim().split('\n');
  if (!lines.length) return [];
  const headers = splitCsvRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCsvRow(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h.replace(/"/g, '').trim()] = (vals[idx] || '').replace(/"/g, '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function splitCsvRow(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += c; }
  }
  result.push(cur);
  return result;
}

function setStatus(id, msg, type = 'ok') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `csv-status ${type}`;
}

function readFile(input, callback) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result, file.name);
  reader.readAsText(file);
}

// ── 1xx MNO CSV ──────────────────────────────────────────────
// ── 1xx CSV shared logic ──────────────────────────────────────
function process1xxRows(rows, label, statusId) {
  const groups = {}; // key: "clientId|gateway|code" → count
  let total = 0;

  rows.forEach(row => {
    const code = row.ansResponseCode;
    const gw   = row.applicableSmsGateway;
    const cid  = (row.clientId || row.clientName || '').trim();
    if (!code || code === 'null' || code === '-') return;
    const codeNum = parseInt(code);
    if (isNaN(codeNum) || codeNum < 1000 || codeNum > 1099) return;
    if (!gw || gw === 'null' || gw === '-') return;
    const key = `${cid}|||${gw}|||${code}`;
    groups[key] = (groups[key] || 0) + 1;
    total++;
  });

  const isIssue = total >= 20000;

  // Build textarea text
  let txt = '';
  if (!isIssue) {
    txt = 'Error observed minimal as usual.';
  } else {
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const lines = sorted.map(([key, cnt]) => {
      const [cid, gw, code] = key.split('|||');
      return `${cid || 'Unknown'} receiving ${code} errors via ${gw} (${fmtNum(cnt)})`;
    });
    txt = `Total: ${fmtNum(total)} 1xx errors detected.\n` + lines.join('\n');
  }

  // Set toggle & fill textarea
  setTog('1xx', isIssue ? 'issue' : 'ok');
  const okEl    = document.getElementById('txt-1xx-ok');
  const issueEl = document.getElementById('txt-1xx-issue');
  if (isIssue) { if (issueEl) issueEl.value = txt; }
  else         { if (okEl)    okEl.value    = txt; }

  // Build preview grouped by gateway→code
  const previewData = {};
  Object.entries(groups).forEach(([key, cnt]) => {
    const [, gw, code] = key.split('|||');
    if (!previewData[gw]) previewData[gw] = {};
    previewData[gw][code] = (previewData[gw][code] || 0) + cnt;
  });
  updateCsvPreview(label, previewData, total);
  setStatus(statusId, `${fmtNum(total)} records — ${isIssue ? 'ISSUE (≥20k)' : 'Normal (<20k)'}`, isIssue ? 'error' : 'ok');
  showToast(`${label}: ${isIssue ? 'Issue detected' : 'Normal'}`);
  scheduleAutoSave();
}

// ── 1xx MNO CSV ──────────────────────────────────────────────
function parseMnoCsv(input) {
  readFile(input, (text) => {
    try {
      const rows = parseCsvText(text).filter(r => r.ansResponseCode && r.ansResponseCode !== 'ansResponseCode');
      if (!rows.length) { setStatus('csv-mno-status', 'No data rows found', 'error'); return; }
      process1xxRows(rows, 'MNO 1xx', 'csv-mno-status');
    } catch(e) { setStatus('csv-mno-status', 'Parse error: ' + e.message, 'error'); }
  });
}

// ── 1xx IPTSP CSV ─────────────────────────────────────────────
function parseIptspCsv(input) {
  readFile(input, (text) => {
    try {
      const rows = parseCsvText(text).filter(r => r.ansResponseCode && r.ansResponseCode !== 'ansResponseCode');
      if (!rows.length) { setStatus('csv-iptsp-status', 'No data rows found', 'error'); return; }
      process1xxRows(rows, 'IPTSP 1xx', 'csv-iptsp-status');
    } catch(e) { setStatus('csv-iptsp-status', 'Parse error: ' + e.message, 'error'); }
  });
}

// ── DLR CSV ───────────────────────────────────────────────────
function parseDlrCsv(input) {
  readFile(input, (text, name) => {
    try {
      const rows = parseCsvText(text).filter(r => r.message_body);
      if (!rows.length) { setStatus('csv-dlr-status', 'No data rows found', 'error'); return; }

      const codes = { '1000': 0, '1020': 0, '1052': 0 };
      let total = 0;
      rows.forEach(row => {
        const body = row.message_body || '';
        const m = body.match(/statusCode=(\d+)/);
        if (m) {
          const c = m[1];
          if (codes[c] !== undefined) { codes[c]++; total++; }
        }
      });

      // Auto-fill DLR section — find today-1 date block (first block)
      const dlrBlocks = document.querySelectorAll('.dlr-date-block');
      if (dlrBlocks.length > 0) {
        const lastBlock = dlrBlocks[dlrBlocks.length - 1];
        Object.entries(codes).forEach(([code, count]) => {
          const inp = lastBlock.querySelector(`.dlr-val[data-code="${code}"]`);
          if (inp) inp.value = count || '';
        });
        scheduleAutoSave();
      }

      // Show in preview
      const lines = Object.entries(codes).map(([c, v]) => `  ${c}: ${fmtNum(v)}`).join('\n');
      updateCsvPreview('DLR', { 'Status Codes': codes }, total);
      setStatus('csv-dlr-status', `Parsed ${fmtNum(total)} DLR records → filled into last date block`, 'ok');
      showToast('DLR CSV loaded & filled');
    } catch(e) {
      setStatus('csv-dlr-status', 'Parse error: ' + e.message, 'error');
    }
  });
}

// ── CSV Preview ───────────────────────────────────────────────
let csvSummary = {};

function updateCsvPreview(label, data, total) {
  csvSummary[label] = { data, total };
  renderCsvPreview();
}

function renderCsvPreview() {
  const area = document.getElementById('csv-preview-area');
  const content = document.getElementById('csv-preview-content');
  if (!area || !content) return;
  area.style.display = 'block';

  let html = '';
  for (const [label, { data, total }] of Object.entries(csvSummary)) {
    html += `<div style="margin-bottom:10px;"><strong>${label}</strong> — ${fmtNum(total)} records<br>`;
    for (const [group, codes] of Object.entries(data)) {
      const parts = Object.entries(codes).map(([c, v]) => `${c}:${fmtNum(v)}`).join('  ');
      html += `&nbsp;&nbsp;<span style="color:var(--accent);font-weight:700;">${group}</span>  ${parts}<br>`;
    }
    html += `</div>`;
  }
  content.innerHTML = html;
}

  if (!confirm('Clear all form data and start fresh?')) return;
  localStorage.removeItem(LS_DRAFT);
  location.reload();
}
