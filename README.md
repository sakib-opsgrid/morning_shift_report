# Morning Shift Report
**Infozillion Teletech Bd Ltd · Service Assurance**

A professional daily shift reporting tool for the Service Assurance team. Automatically pulls data from ELK CSV exports, Google Sheets, and Google Docs — reducing manual effort and ensuring consistent, accurate reports every morning.

---

## Features

| Feature | Description |
|---|---|
| CSV Auto-fill | Upload ELK Discover CSV exports directly in each section |
| Google Sheets Sync | Traffic Trend and Network data fetched live with one click |
| Google Docs Sync | Major / Pending Issues pulled from the shift handover document |
| Auto-save | Form data saved to browser automatically — never lose a draft |
| Report History | Last 30 generated reports stored, copyable anytime |
| Dark Mode | Light/dark theme toggle, preference saved across sessions |
| Collapsible Sections | All sections collapse and expand for easier navigation |
| WhatsApp Copy | One-click copy of a formatted, WhatsApp-ready report |
| Print / PDF | Clean print layout for PDF export |
| Mobile Responsive | Fully usable on phones and tablets |

---

## File Structure

```
/
├── index.html   ← Main page and UI structure
├── style.css    ← All styles, theming, and dark mode
├── app.js       ← All logic: CSV parsing, Sheet/Docs fetch, auto-save, history
└── README.md    ← This file
```

---

## Daily Workflow

### 1. HTTP Status — 1xx (MNO & IPTSP)

Each sub-section has an **Upload CSV** button inline.

- Upload the ELK Discover export for MNO and IPTSP separately
- Required columns: `ansResponseCode`, `applicableSmsGateway`, `clientId`
- If total records < 20,000 → status set to **Normal** automatically
- If total records ≥ 20,000 → status set to **Issue**, and all clients exceeding 20k are listed automatically

### 2. Delay / DLR

The DLR section has an **Upload CSV** button inline.

- Upload the ELK Discover export for DLR
- Required column: `message_body` (must contain `statusCode=1000`, `statusCode=1020`, or `statusCode=1052`)
- Counts are automatically filled into the last date block

### 3. Network — P2P / NTTN

Click **Fetch from Google Sheet** in the Network section.

- Reads the last available date from the P2P log sheet
- Fills each operator's reconnect times and total error count automatically

### 4. Traffic Trend

Click **Fetch from Google Sheet** in the Traffic Trend section.

- Loads the last 6 days with Day End volume values
- Calculates percentage change vs. the previous day automatically

### 5. Major / Pending Issues

Click **Fetch from Google Docs** in the Issues section.

- Reads the shift handover Google Doc
- Parses the Issues table and fills each row as a separate item
- Toggle is automatically set to **Has Issues**
- Items remain editable after fetching

### 6. Remaining Fields (Manual)

- **HTTP Status 5xx** — from the nightly Google Sheet update
- **Client Communication** — WhatsApp / Phone / Email / Ticket counts
- **Overall status remarks** — pre-filled with defaults, editable

### 7. Generate Report

Click **Copy WhatsApp Message** → paste directly into the shift group.

---

## CSV Format Requirements

### 1xx MNO / IPTSP (ELK Discover export)
| Column | Description |
|---|---|
| `ansResponseCode` | Response code — 1xxx range is counted |
| `applicableSmsGateway` | Gateway or operator name |
| `clientId` | Client identifier |

### DLR (ELK Discover export)
| Column | Description |
|---|---|
| `message_body` | Log body containing `statusCode=1000`, `statusCode=1020`, or `statusCode=1052` |

---

## Google Sheets & Docs Setup

All external sources must be published before use.

| Source | Publish Method | Used For |
|---|---|---|
| Daily Traffic Monitor | File → Share → Publish to web → CSV | Traffic Trend |
| Network P2P Log | File → Share → Publish to web → CSV | Network section |
| Shift Handover Doc | File → Share → Publish to web | Major / Pending Issues |

To update source URLs, edit the following constants in `app.js`:

```javascript
const PUBLISHED_CSV_URL = '...'; // Daily Traffic Monitor sheet
const NETWORK_CSV_URL   = '...'; // Network P2P log sheet
const DOCS_URL          = '...'; // Shift handover Google Doc
```

---

## Deploying on GitHub Pages

1. Create a new GitHub repository (e.g. `shift-report`)
2. Upload all four files: `index.html`, `style.css`, `app.js`, `README.md`
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch → `/ (root)` → **Save**
5. Your report will be live at:
   ```
   https://<your-username>.github.io/shift-report/
   ```

> **Important:** Google Sheets and Docs fetch only works when accessed over HTTPS (i.e. via GitHub Pages). It will not work when opening files locally from your computer.

---

## Privacy & Security

- All form data is stored **locally in your browser** using `localStorage`
- No data is sent to any external server
- Google Sheets and Docs are accessed as **read-only** public sources
- The office Google Doc and Sheets are not modified in any way

---

*Built for Infozillion Teletech Bd Ltd · Service Assurance Team*
*© 2026 Najmaz Sakib*
