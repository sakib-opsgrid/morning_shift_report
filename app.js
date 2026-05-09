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

/* ── Clear Draft ─────────────────────────────────────────── */
function clearDraft() {
  if (!confirm('Clear all form data and start fresh?')) return;
  localStorage.removeItem(LS_DRAFT);
  location.reload();
}
