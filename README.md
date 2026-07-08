# TestHub — Enterprise Test Platform

A fully client-side test and assessment platform built with vanilla JavaScript. Employees can take timed tests with instant feedback, admins can manage tests and monitor results — all data persisted in localStorage, ready to scale to a real backend.

## Features

### Employee
- Self-registration with name, email, department
- Browse available tests with question count, time limit, pass percentage
- Timed quizzes with shuffle questions and options
- Instant feedback per question with category progress pills
- Detailed results with category breakdown charts (bar chart)
- Score ring visualization (signature element)
- Full answer review with correct/wrong labeling
- Retry missed questions
- Printable certificate on passing
- Personal history with score trend sparkline

### Admin
- Password-gated admin panel
- Dashboard KPIs with score rings (employees, tests, attempts, pass rate)
- Pass rate by test bar chart
- Test CRUD (create/edit/delete from question banks)
- View all question banks (131 questions across 4 categories)
- Results table with test filter, click-through to detailed view
- CSV export of all results
- Employee list with attempt counts and average scores
- Settings (org name, change password, full data reset)

## Getting Started

1. **Open in browser**: Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari)
2. **Default admin password**: `admin123`
3. **Employee login**: Enter any name and email to self-register
4. **Question banks**: 131 questions seeded automatically on first load:
   - Excel & VBA (50 questions)
   - SQL (30 questions)
   - JavaScript (30 questions)
   - Workplace Essentials (21 questions)
5. **Default tests**: One quick test per bank created automatically

## File Structure

```
├── index.html              # All screens (SPA)
├── css/
│   └── style.css           # Enterprise design system
├── js/
│   ├── db.js               # Data layer (localStorage adapter)
│   ├── charts.js           # SVG chart helpers (no deps)
│   └── app.js              # Application controller
├── data/
│   ├── questions-excel-vba.json    # 50 questions
│   ├── questions-sql.json          # 30 questions
│   ├── questions-javascript.json   # 30 questions
│   └── questions-workplace.json    # 21 questions
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deploy
├── README.md
└── LICENSE
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#101A33` | Headers, dark text, sidebar |
| `--slate` | `#4A5578` | Secondary text, borders |
| `--paper` | `#F5F6F9` | Page background |
| `--signal` | `#2F5DE3` | Primary actions/links |
| `--verdant` | `#1F9D6B` | Pass/success |
| `--amber` | `#E8A33D` | Warning/needs review |
| `--crimson` | `#D64545` | Fail/danger |
| `--ring-track` | `#E4E7F0` | Track behind score rings |

Typography: Space Grotesk (headings), IBM Plex Sans (body), IBM Plex Mono (scores/numbers). All loaded via Google Fonts with fallback stacks.

## Scaling Up

This app is designed for easy backend migration. All data goes through `js/db.js`. To swap to Firebase, Supabase, or your own API:

1. Open `js/db.js`
2. Rewrite the function bodies (e.g. `loadDB()`, `saveDB()`, `saveAttempt()`) to call your backend instead of localStorage
3. Nothing else in the app needs to change — the rest of the code calls the same functions

You can deploy as a static site on GitHub Pages, Netlify, Vercel, or any static host.

## Deploy to GitHub Pages

Push to `main` branch — the included GitHub Actions workflow auto-deploys to GitHub Pages.

Manual deploy: `git push origin main`

## License

MIT
