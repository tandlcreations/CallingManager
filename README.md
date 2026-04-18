# Ward Calling Manager

A browser-based tool for planning ward calling changes. Import your ward's calling data from LCR, then plan assignments, releases, and reorganizations — all without affecting real LCR data.

**No data ever leaves your browser.** There is no server, no database, and no network requests. Everything runs locally in your browser using `localStorage`.

## Features

### Data Import
- **LCR Import** — Copy calling data from LCR API endpoints and import via file upload
- **Member List Import** — Import a ward member list so you can select members when assigning callings
- **Demo Mode** — Launch with realistic sample data to explore the app without any LCR access

### Scenario Planning
- **Assign / Change / Release** — Full calling lifecycle management with a member-selection modal
- **Presidency Cascade Releases** — Releasing a Bishop or presidency president automatically releases their counselors
- **Custom Callings** — Add callings that don't exist in the standard LCR template for any organization
- **"Considering" Column** — Mark a member as being considered for a calling before making it official
- **Undo** — Revert any change with full snapshot-based undo history
- **Session Persistence** — Your work is auto-saved to `localStorage`; a resume prompt appears on return

### Display & Filtering
- **Search** — Find callings or members across all organizations
- **Column Visibility** — Show/hide columns (Member, Active Date, Set Apart, Considering, Gender, Age, Time in Calling)
- **Column Reorder** — Drag columns into your preferred order
- **Calling Visibility** — Hide callings that don't apply to your ward
- **Gender & Age Filters** — Filter the member-selection modal by gender and age range
- **Calling Count Badges** — Each organization header shows filled/total calling counts
- **Vacant Calling Links** — Click a vacant count to jump directly to open positions

### Print & Export
- **Print Report** — A formatted change summary grouped by action type (Assignments, Releases, Stake-Authority Releases) with date
- **JSON Export** — Export the full scenario as a `.json` file for backup or sharing
- **JSON Import** — Re-import a previously exported scenario to continue planning

## Getting Started

1. Open the app in a browser (or visit [callingmanager.org](https://callingmanager.org))
2. Choose **Launch Demo** to explore, or **Import Data** to load your ward's LCR data
3. Plan your changes — assign, release, reorganize
4. Print a change summary or export your scenario

### Importing from LCR

1. Log into [LCR](https://lcr.churchofjesuschrist.org/)
2. Visit the calling-data API endpoint shown on the home page
3. Save the JSON response as a file
4. Click **Import Data** and select the file

Optionally import a member list the same way for richer member selection.

## Data Privacy

- **No server.** The app is static HTML/CSS/JS hosted on GitHub Pages.
- **No network requests.** Zero `fetch`, `XMLHttpRequest`, or any outbound calls exist in the code.
- **Browser-only storage.** All data lives in `localStorage`, scoped to your browser. Nothing is transmitted.
- **Clear anytime.** Clear your browser's site data to remove everything.

## Project Structure

```
index.html    — Single-page HTML shell + all modals
styles.css    — All styling (Unity Design System / Eden theme)
app.js        — Complete application logic (~4,200 lines)
```

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — no frameworks, no build step, no dependencies
- [Unity Design System (Eden)](https://news-unity.churchofjesuschrist.org/) for Church-consistent styling
- Ensign fonts from the Church Foundry CDN

## License

This is an unofficial tool and is not affiliated with or endorsed by The Church of Jesus Christ of Latter-day Saints.

---

Built by members, for members. Inspired by [callingmanager.com](https://callingmanager.com).
