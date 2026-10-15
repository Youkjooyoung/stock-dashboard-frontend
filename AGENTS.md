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

## Security Rules
These rules come from the 2026-10-15 security review.
- Never put access or refresh tokens in URLs. Social account linking calls POST `/auth/link/{provider}/start`, redirects to the returned URL, and finishes with POST `/auth/link/callback` (`code`, `state`).
- WebSocket clients set headers in `beforeConnect` with `authConnectHeaders()` so every reconnect sends the latest token. Personal alerts subscribe to `/user/queue/alert`; publish only to `/app/**`.
- Do not send identity fields (nickname, email, user ID) in chat or other messages; the server decides who the sender is.
- Identify "my" items with public IDs (`senderId`, `userId`), never by comparing email addresses from shared responses.
- Show the server's `message` field for errors (`err.response?.data?.message`); it is safe to display.
- Keep API paths relative to the axios `baseURL` (`/api` is already included). Delete unused API modules instead of keeping stale copies.
- Before release, run `npm audit --omit=dev`. Remaining dev-only advisories come from vitest 2 and are tracked for a vitest upgrade.
- Components rendered in tests import `React` explicitly, because vitest 2 does not apply the automatic JSX runtime used by Vite 8.

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
