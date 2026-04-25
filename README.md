# Nusava Creator Intelligence Platform

Multi-agency TikTok Shop affiliate performance dashboard for tracking creator GMV, ROI, and performance across all managed agencies.

## Agencies Tracked
- **Creator Circle (Creatify)** — Primary managed agency, 7 months of data
- **THC** — 4 months of data
- **Elle Media** — 3 months of data
- **Internal Retainers** — Direct retainer creators, no agency fee

## Local Setup
1. Clone or download this repository
2. Open `index.html` directly in any modern browser (`file://` protocol supported — no local server needed)
3. All data is embedded in the `/data/` JavaScript files

## GitHub Pages Deployment
1. Push all files to a GitHub repository
2. In repository Settings → Pages → Source: select the branch containing your files (e.g. `gh-pages` or `main`)
3. GitHub Pages will serve `index.html` at `https://yourusername.github.io/repo-name/`
4. No build step required — the platform is pure HTML/CSS/JS

To deploy to `gh-pages` branch:
```bash
git checkout -b gh-pages
git push origin gh-pages
```
Then enable Pages in repo Settings → Pages.

## Updating Data
All data lives in the `/data/` folder. Each agency has its own file:

| File | Agency |
|------|--------|
| `data/creatify.js` | Creator Circle (Creatify) |
| `data/thc.js` | THC |
| `data/elle-media.js` | Elle Media |
| `data/internal-retainers.js` | Internal Retainers |

Each file exports a `window.DATA_*` object with the following structure:
```javascript
window.DATA_CREATIFY = {
  months: [
    {
      label: 'M1', period: 'Apr 8–Jun 9',
      fees: 11000, targetVids: 300, delivered: 497,
      views: 3702343, creators: 10, performing: 6, gmv: 115842.00,
      sampleCosts: null
    },
    // ... more months
  ],
  topCreatorsByMonth: { M1: [...], M2: [...] },
  recurringCreators: [...],
  creatorEvaluation: [...]
};
```

To add a new month: append a new object to the `months` array and add corresponding entries in `topCreatorsByMonth` and `creatorEvaluation`.

## Creator Evaluation Rules
The platform applies the following rules (configurable in `js/config.js`):

| Criterion | Threshold | Rule |
|-----------|-----------|------|
| Minimum videos | ≥ 20 shoppable videos in current month | Required for ADVANCE |
| Minimum GMV (monthly) | ≥ $100 current month | One of two GMV conditions |
| Minimum GMV (rolling 3-month) | ≥ $500 over last 3 months | Alternative GMV condition |

**ADVANCE** — Videos ≥ 20 AND (GMV current month ≥ $100 OR rolling 3-month GMV ≥ $500)
**REVIEW** — Meets GMV but not video count, OR meets video count but not GMV
**DROP** — Meets neither video count nor GMV thresholds

## Cruva API Integration
When the Cruva API becomes available, update `js/config.js`:
```javascript
CRUVA_API_KEY: 'your-api-key-here',
CRUVA_BASE_URL: 'https://api.cruva.com/v1',
```

Then implement the fetch functions in `js/app.js` at the marked `// CRUVA INTEGRATION POINT` comment blocks. The platform is structured so all data-loading functions can be swapped from static file data to API responses without changing any view or chart code.

## Tech Stack
- Vanilla JavaScript (no framework, no build step)
- Chart.js 4.4.0 (loaded via CDN)
- Pure CSS with CSS custom properties
- Works offline, works on `file://` protocol
