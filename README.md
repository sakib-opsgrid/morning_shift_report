# Morning Shift Report `v2.8.0`
**Infozillion Teletech Bd Ltd · Service Assurance**

A premium, browser-based daily shift reporting tool for the Service Assurance team. Automatically pulls data from ELK CSV exports and Google Sheets, reducing manual effort and ensuring consistent reports every morning.

---

## Features

| Feature | Description |
|---|---|
| Drag & Drop CSV | Drop CSV files directly onto upload zones, or click to browse |
| CSV Auto-fill | ELK Discover CSV exports parsed and filled automatically across sections |
| HTTP 5xx Auto-fill | Upload one CSV to auto-fill HTTP 500/501/502/503/504 counts per operator |
| Google Sheets Sync | Traffic Trend and Network data fetched live with one click |
| Auto-save | Form data saved to browser automatically — never lose a draft |
| Report History | Last 30 generated reports stored and copyable anytime |
| Dark Mode | Light/dark theme toggle, preference saved across sessions |
| Collapsible Sections | All sections collapse and expand for easier navigation |
| WhatsApp Copy | One-click copy of a formatted, WhatsApp-ready report |
| Print / PDF | Clean print layout for PDF export |
| Mobile Responsive | Fully usable on phones and tablets |
| Premium UI | DM Sans / DM Mono / Instrument Serif typography, warm minimal theme |
| Version Badge | Current version shown in the header next to the app subtitle |

---

## File Structure

```
/
├── index.html   ← Main page and UI structure
├── style.css    ← All styles, theming, and dark mode
├── app.js       ← All logic: CSV parsing, Sheet fetch, auto-save, history
└── README.md    ← This file
```

---

## Daily Workflow

### 1. HTTP Status — 1xx MNO & IPTSP

Each sub-section has a **drag & drop CSV zone**.

- Drop (or click to upload) the ELK Discover export for MNO and IPTSP separately
- Required columns: `ansResponseCode`, `applicableSmsGateway`, `clientId`
- Total < 20,000 → status set to **Normal** automatically
- Total ≥ 20,000 → status set to **Issue**, clients exceeding 20k listed automatically

### 2. HTTP Status — 4xx / 5xx (Per Operator)

A single CSV upload zone auto-fills HTTP **500 / 501 / 502 / 503 / 504** counts for every operator (GP, RB, TT, BL).

- Required columns: `ans_type` (or `ansType`), and any column containing `event` (e.g. `event.original`)
- Operator is detected from `ans_type` (matches GP/Grameenphone, RB/Robi, TT/Teletalk, BL/Banglalink)
- HTTP status code is extracted from the `event.original` log line
- **CSV upload is optional** — every code box can also be filled in manually by expanding an operator card
- Each operator card shows a live total once any code has a value

### 3. Delay / DLR

The DLR section has a **drag & drop CSV zone**.

- Drop (or click to upload) the ELK Discover export for DLR
- Required column: `message_body` (must contain `statusCode=1000`, `statusCode=1020`, or `statusCode=1052`)
- Counts are automatically filled into the last date block

### 4. Network — P2P / NTTN

Click **Fetch from Google Sheet** in the Network section.

- Reads the last available date from the P2P log sheet
- Required columns: `DATE`, `IMPACTED_OPERATOR` (operator name — GP/Grameenphone, RB/Robi, TT/Teletalk, BL/Banglalink), `FAILED`
- Fills each operator's reconnect **times** (row count for that date) and total **failed/error** count automatically
- Overall Network Status remark refers to **NTTN connectivity only**

### 5. Traffic Trend

Click **Fetch from Google Sheet** in the Traffic Trend section.

- Loads the last 6 days with Day End volume values
- Calculates percentage change vs. the previous day automatically
- If the live fetch fails, a manual CSV upload fallback appears automatically

### 6. Major / Pending Issues

Toggle **Has Issues** and add items manually using **+ Add Item**.

### 7. Remaining Fields (Manual)

- **Client Communication** — WhatsApp / Phone / Email / Ticket counts
- **Overall status remarks** — pre-filled with sensible defaults, fully editable

### 8. Generate Report

Click **Copy WhatsApp Message** → paste directly into the shift group.

---

## CSV Format Requirements

### 1xx MNO / IPTSP (ELK Discover export)

| Column | Description |
|---|---|
| `ansResponseCode` | Response code — 1xxx range is counted |
| `applicableSmsGateway` | Gateway or operator name |
| `clientId` | Client identifier |

### 4xx / 5xx HTTP (ELK Discover export)

| Column | Description |
|---|---|
| `ans_type` | Used to detect operator (GP, RB, TT, BL) |
| `event.original` (or any column containing `event`) | Log line containing `HTTP/x.x <code>` — codes 500–504 are counted |

### DLR (ELK Discover export)

| Column | Description |
|---|---|
| `message_body` | Log body containing `statusCode=1000`, `statusCode=1020`, or `statusCode=1052` |

---

## Google Sheets Setup

Both sheets must be published before use via **File → Share → Publish to web → CSV**.

| Sheet | Used For | Required Columns |
|---|---|---|
| Daily Traffic Monitor | Traffic Trend section | `Date`, `Day End` |
| Network P2P Log | Network section | `DATE`, `IMPACTED_OPERATOR`, `FAILED` |

To update source URLs, edit the following constants in `app.js`:

```javascript
const PUBLISHED_CSV_URL = '...'; // Daily Traffic Monitor sheet
const NETWORK_CSV_URL   = '...'; // Network P2P log sheet
```

If a sheet's column headers ever change, update the matching logic inside `parseTrafficCsv()` or `parseNetworkCsv()` in `app.js` accordingly.

---

## Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `shift-report`)
2. Upload all four files: `index.html`, `style.css`, `app.js`, `README.md`
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch → `/ (root)` → **Save**
5. Live at:
   ```
   https://<your-username>.github.io/shift-report/
   ```

> **Important:** Google Sheets fetch only works over HTTPS (GitHub Pages). It will not work when opening files locally.

---

## Changelog

| Version | Changes |
|---|---|
| v2.8.0 | Version badge added to header |
| v2.7.0 | Traffic Trend Google Sheet fetch fixed (re-published sheet link) |
| v2.6.0 | Network section Google Sheet fetch fixed for new `IMPACTED_OPERATOR` column structure; CORS proxy fallback added |
| v2.5.0 | Header layout fixed (logo left, action buttons right); NTTN overall status text corrected to remove "(All Connectivity)" |
| v2.0.0 | Premium UI redesign (DM Sans / DM Mono / Instrument Serif); HTTP 4xx/5xx (500–504) CSV auto-fill section added per operator, with manual entry fallback |
| v1.1.0 | Prepared By field placeholder updated to generic "e.g. Name" for shared team use |
| v1.0.0 | Drag & drop CSV upload added for MNO / IPTSP / DLR sections |

---

## Privacy & Security

- All form data is stored **locally in your browser** via `localStorage`
- No data is sent to any external server
- Google Sheets are accessed as **read-only** published sources
- No office files or documents are modified in any way

---

*Built for Infozillion Teletech Bd Ltd · Service Assurance Team*
*© 2026 Najmaz Sakib*
