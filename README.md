# DevTrack — Developer Ticket & Performance Tracker (Frontend)

A responsive React + TypeScript frontend prototype for the Developer Ticket & Performance Tracker BRD.

## Included functionality

- Overview dashboard plus separate Daily, Weekly and Monthly dashboards
- Ticket listing, search, stage filter, create-ticket modal and ticket detail drawer
- Five-stage lifecycle: Discussion → Development → QA → Deployment → Sign-off
- Mandatory transition comments
- QA defect register with Critical / Minor / Cosmetic severity
- Defect attribution (Development, Requirement, Environment, Third-party)
- Deployment checklist and required deployment notes
- Performance score explanation (40% ETA + 60% QA quality)
- Blocked time and complexity fields
- CSV report export
- Demo data persisted in browser localStorage
- Responsive desktop and mobile layout

## Requirements

- Node.js 18+ (Node.js 20 LTS recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

## Demo behavior and limitations

This is a frontend-only prototype. It uses localStorage for persistence and seeded demo records. It does not include:
- A Spring Boot backend or MySQL database
- Real login/authentication or role enforcement
- Multi-user synchronization
- Server-side audit guarantees
- Email/Slack notifications
- Real deployment integrations

The demo name and sample records are fictionalized demonstration content. Replace them with your own project data.

## Important workflow notes

The UI blocks movement into Deployment when required checklist items are incomplete, a critical defect is unresolved/unaccepted, or deployment notes are missing. The next-stage transition comment is mandatory.

The performance model is illustrative:
- ETA adherence weight: 40%
- QA quality weight: 60%
- Critical defect penalty: 30
- Minor defect penalty: 10
- Cosmetic defect penalty: 3

Only bugs attributed to Development are included in the demo quality penalty. Before production use, define ETA completion milestone, business-hour rules, approved blocked time, defect appeal process, reopened bug handling and ticket complexity weighting with stakeholders.

## Suggested next step

Connect the UI to Spring Boot REST APIs, replace localStorage with API state, and enforce all workflow and scoring rules on the backend. Frontend checks are for user experience only and are not a security boundary.
