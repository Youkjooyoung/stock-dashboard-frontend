# Codex Guide - Frontend

## Project
- React 19 + Vite frontend for the stock dashboard.
- Uses Zustand, React Query, Axios, React Router, Chart.js, lightweight-charts, STOMP/SockJS, and CSS Modules.
- API calls should go through `src/api/axiosInstance.js`.

## Local Commands
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Lint: `npm run lint`
- Test: `npm run test:run`
- Build: `npm run build`

## Configuration
- Keep real credentials out of tracked files.
- Use `.env.example` as the public Vite environment checklist.
- `VITE_*` values are bundled into frontend code; do not put server-side secrets there.
- AI analysis is served by the backend `/api/ai/analyze` endpoint.

## Coding Rules
- Use CSS Modules for component styling and existing design tokens from `src/styles/global.css`.
- Keep auth state in `authStore` and notification state in `alertStore`.
- Use React Query for server state and invalidate affected query keys after mutations.
- Keep user-facing Korean text readable and avoid mojibake.
- Do not expose backend API keys, OAuth client secrets, JWT secrets, payment secrets, or AWS keys in frontend code.

## Deployment Notes
- Production is served through AWS/Nginx.
- Run `npm run build` before deployment.
- After completing frontend work, commit and push the changes, then verify the frontend GitHub Actions deployment result.
- Verify `VITE_API_BASE_URL`, `VITE_WS_URL`, and `VITE_PORTONE_IMP_KEY` before uploading the built assets.

## Latest Verified State
- Date: 2026-05-04
- Site logo/title, AI wording, and OpenAI documentation are current.
- WebSocket hooks are stabilized for callback freshness and reconnect behavior.
- Vite vendor chunking is package-aware; the docs-only Mermaid chunk is lazy-loaded through `/docs`.
- Required final checks before handoff: `npm run lint`, `npm run test:run`, `npm run build`, GitHub Actions deploy success.
