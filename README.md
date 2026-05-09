# Morning Shift Report
**Infozillion Teletech Bd Ltd · Service Assurance**

Daily shift reporting tool for the Service Assurance team. Supports CSV auto-fill from ELK exports and live data fetch from Google Sheets.

---

## Features

| Feature | Description |
|---|---|
| CSV Auto-fill | Upload ELK-exported CSVs — 1xx MNO, 1xx IPTSP, DLR auto-parsed |
| Google Sheet Sync | Traffic Trend fetched directly from Daily Traffic Monitor sheet |
| Auto-save | Draft saved to browser automatically while typing |
| Report History | Last 30 generated reports saved, copyable anytime |
| Dark Mode | Light/dark theme toggle, saved across sessions |
| Collapse Sections | All sections collapse/expand for easy navigation |
| Copy to Clipboard | One-click WhatsApp-ready report generation |
| Print / PDF | Clean print layout for PDF export |
| Mobile Responsive | Works on phones and tablets |

---

## File Structure

```
/
├── index.html   ← Main page (structure + upload UI)
├── style.css    ← All styles (theme, layout, dark mode)
├── app.js       ← All logic (CSV parsing, Sheet fetch, auto-save, history)
└── README.md    ← This file
```

---

## Daily Workflow

### Step 1 — Upload CSVs (ELK exports)

Go to the **"AUTO — CSV Auto-fill"** section at the top:

| File | What to upload | What gets filled |
|---|---|---|
| **1xx MNO CSV** | ELK export for transactional MNO CDR | 1xx parsed by operator (GP/RB/BL/TT) shown in summary |
| **1xx IPTSP CSV** | ELK export for transactional IPTSP CDR | 1xx parsed by gateway shown in summary |
| **DLR CSV** | ELK export for DLR 1xxx report | Auto-fills DLR section (1000 / 1020 / 1052 counts) |

### Step 2 — Fetch Traffic Trend

In the **Traffic Trend** section, click **"Fetch from Google Sheet"**.
Automatically loads the last 6 days with Day End values and calculates % change.

### Step 3 — Fill remaining fields manually

- **HTTP Status 5xx** — from nightly Google Sheet update
- **Network (P2P / NTTN)** — Times from ELK dashboard (Errors auto-synced from 5xx)
- **Client Communication** — WhatsApp / Phone / Email / Ticket counts
- **Major / Pending Issues** — toggle and add to-do items if needed

### Step 4 — Generate

Click **"Copy WhatsApp Message"** → paste into the group.

---

## CSV Format Requirements

### 1xx MNO / IPTSP CSV
ELK Discover export — required columns:
- `ansResponseCode` — response code (1000–1099 range counted)
- `applicableSmsGateway` — gateway name (GrameenPhone / Banglalink / Robi / Teletalk for MNO; Link3 / ADN etc. for IPTSP)

### DLR CSV
ELK Discover export — required column:
- `message_body` — log line containing `statusCode=1000`, `statusCode=1020`, or `statusCode=1052`

---

## Google Sheet Setup

The Traffic Trend sheet must be shared as **"Anyone with the link can view"**.
Required columns: `Date`, `Day End`.

To change the sheet, update in `app.js`:
```javascript
const SHEET_ID  = '1iXJXX0eAyVcUKXyj9cF8SPpD4knJCzed';
const SHEET_GID = '1186344439';
```

---

## Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `shift-report`)
2. Upload all 4 files: `index.html`, `style.css`, `app.js`, `README.md`
3. Go to **Settings → Pages → Source:** `main` branch → `/ (root)` → Save
4. Live at: `https://<your-username>.github.io/shift-report/`

> Google Sheet fetch works on GitHub Pages — data is fetched directly from the browser, no server needed.

---

## Privacy

All form data stored **locally in the browser** via `localStorage`. No data sent to any server except Google Sheets (read-only fetch).

---

*Built for Infozillion Teletech Bd Ltd · Service Assurance Team*
*© 2026 Najmaz Sakib*
