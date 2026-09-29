# Shift Ledger

A mobile-friendly work-hours tracker. Clock in/out, track breaks, see hours per workplace with charts, calculate pay (hourly or monthly + transport), and sync to Google Sheets. No build step, no dependencies.

## Files
| File | Purpose |
|---|---|
| `index.html` | The whole app |
| `manifest.json`, `icon.svg`, `sw.js` | Install-to-home-screen and offline support |
| `Code.gs` | Google Apps Script that saves to your Sheet (not hosted on GitHub Pages) |

## Publish on GitHub Pages
1. Create a repo and upload `index.html`, `manifest.json`, `icon.svg`, `sw.js`, `README.md`.
2. **Settings → Pages → Deploy from a branch → `main` / root → Save.**
3. Open `https://<your-name>.github.io/<repo>/`.

## Connect Google Sheets
1. Create a Google Sheet → **Extensions → Apps Script**, paste `Code.gs`.
2. Change `PASSCODE` at the top of `Code.gs` to your own secret.
3. **Deploy → New deployment → Web app** → Execute as *Me*, access *Anyone* → copy the URL.
4. In the app: **Sync** tab → paste the URL and your passcode. Data uploads automatically after each change; use *Download from Sheets* to restore on another device.

Keep the web app URL private: anyone with it can read and write your sheet data.

## Use on your phone
- iPhone: Safari → Share → **Add to Home Screen**.
- Android: Chrome menu → **Install app**.

Data is stored on the device first (`localStorage`), so it works offline. Use **Sync → Save JSON** for backups.

## Monthly salary and history
- **Pay tab** shows the *final salary* for the selected month: hourly wages + monthly salaries + transport, the average price per hour (final salary ÷ hours worked), a per-workplace breakdown, a daily table with a running total, and every previous month below.
- The app opens on the current month and switches automatically when a new month starts (Log, Stats and Pay all start fresh). Use ‹ › or **Now** to browse other months; nothing is deleted.
- Rates are frozen per month: changing an hourly rate, salary or transport amount only affects the current and future months, never past ones.

## Monthly records in Google Sheets
Every month gets its own tab (e.g. `2026-09`) with daily rows, daily totals, per-workplace totals with price per hour, the month total and the average earned per hour. After updating `Code.gs`, redeploy it (Deploy → Manage deployments → Edit → New version). `Workplaces` and `Entries` hold the master data the app syncs with; do not edit them by hand.
