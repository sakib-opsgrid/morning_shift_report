# Morning Shift Report
**Infozillion Teletech Bd Ltd · Service Assurance**

Daily shift reporting tool for the Service Assurance team. Auto-fills from ELK CSV exports and Google Sheets.

---

## Features

| Feature | Description |
|---|---|
| CSV Auto-fill | Upload ELK CSVs directly in each section — form fills automatically |
| Google Sheet Sync | Traffic Trend and Network data fetched live from Google Sheets |
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
├── index.html   ← Main page
├── style.css    ← All styles (theme, layout, dark mode)
├── app.js       ← All logic (CSV parsing, Sheet fetch, auto-save, history)
└── README.md    ← This file
```

---

## Daily Workflow

### Step 1 — HTTP Status (1xx)

**1xx MNO** and **1xx IPTSP** sections each have an **Upload CSV** button.

- Upload the ELK Discover export CSV for each
- Required columns: `ansResponseCode`, `applicableSmsGateway`, `clientId`
- Total < 20,000 → toggle set to **Normal**, textarea filled automatically
- Total ≥ 20,000 → toggle set to **Issue**, clients with ≥20k errors listed automatically

### Step 2 — Delay / DLR

**DLR** section has an **Upload CSV** button.

- Upload the ELK Discover export CSV
- Required column: `message_body` (must contain `statusCode=1000`, `statusCode=1020`, or `statusCode=1052`)
- Values auto-filled into the last date block

### Step 3 — Network (P2P / NTTN)

Click **Fetch from Google Sheet** in the Network section.

- Loads the last date's data automatically
- Per operator: Times (reconnects) and total Errors (FAILED column sum)

### Step 4 — Traffic Trend

Click **Fetch from Google Sheet** in the Traffic Trend section.

- Loads last 6 days with Day End values automatically
- % change vs previous day calculated automatically

### Step 5 — Fill remaining fields manually

- **5xx** — from nightly Google Sheet update
- **Client Communication** — WhatsApp / Phone / Email / Ticket counts
- **Major / Pending Issues** — toggle and add items if needed

### Step 6 — Generate

Click **Copy WhatsApp Message** → paste into the group.

---

## CSV Format Requirements

### 1xx MNO / IPTSP CSV (ELK Discover export)
Required columns:
- `ansResponseCode` — 1xxx range counted
- `applicableSmsGateway` — gateway/operator name
- `clientId` — client identifier

### DLR CSV (ELK Discover export)
Required column:
- `message_body` — must contain `statusCode=1000`, `statusCode=1020`, or `statusCode=1052`

---

## Google Sheets Setup

Both sheets must be published via **File → Share → Publish to web → CSV**.

| Sheet | Data | Published URL stored in |
|---|---|---|
| Daily Traffic Monitor | Day End volume per date | `app.js` → `PUBLISHED_CSV_URL` |
| Network P2P Log | MNO, Event times, Failed count | `app.js` → `NETWORK_CSV_URL` |

To update a sheet URL, change these constants in `app.js`:
```javascript
const PUBLISHED_CSV_URL = '...'; // Traffic sheet
const NETWORK_CSV_URL   = '...'; // Network sheet
```

---

## Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `shift-report`)
2. Upload all 4 files: `index.html`, `style.css`, `app.js`, `README.md`
3. Go to **Settings → Pages → Source:** `main` branch → `/ (root)` → Save
4. Live at: `https://<your-username>.github.io/shift-report/`

> Google Sheet fetch requires GitHub Pages (https). It will not work when opening the file locally.

---

## Privacy

All form data stored locally in the browser via `localStorage`. No data is sent to any server except Google Sheets (read-only fetch).

---

*Built for Infozillion Teletech Bd Ltd · Service Assurance Team*
*© 2026 Najmaz Sakib*
