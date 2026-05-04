# Stock Dashboard Frontend

React frontend for the stock dashboard portfolio project.

## Stack
- React 19
- Vite
- React Router
- Zustand
- React Query
- Axios
- Chart.js / lightweight-charts
- STOMP / SockJS
- CSS Modules

## Local Setup
1. Install dependencies:

```bash
npm install
```

2. Create local environment values from `.env.example`.

Required Vite variables:
- `VITE_API_BASE_URL`
- `VITE_WS_URL`
- `VITE_PORTONE_IMP_KEY`

3. Start the dev server:

```bash
npm run dev
```

## Test And Build
```bash
npm run lint
npm run test:run
npm run build
```

## Current Maintenance Status
- Last updated: 2026-05-04
- Site title and logo use the stock dashboard branding.
- AI analysis UI now uses generic/OpenAI-based AI wording; backend keeps provider secrets.
- WebSocket hooks use stable callback references to avoid stale handlers and unnecessary reconnect churn.
- Vite chunking is package-aware so common vendor code does not collapse into one oversized `vendor-react` bundle.
- Documentation rendering dependencies are lazy-loaded behind the `/docs` route.
- Deployment flow: push to `main` triggers Frontend Auto Deploy through GitHub Actions.
- Verification before latest deployment:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`

## AI Analysis
The frontend calls the backend `/api/ai/analyze` endpoint. API keys must stay on the backend; do not add OpenAI, AWS, OAuth, JWT, payment, or email secrets to `VITE_*` variables.

## Deployment
Production is served through AWS and Nginx. Verify `VITE_API_BASE_URL` and `VITE_WS_URL` before building and uploading assets.
