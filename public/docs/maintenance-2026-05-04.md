# Maintenance Log - 2026-05-04

## Scope
- Complete the Claude/Anthropic cleanup follow-up work.
- Remove remaining frontend build and local-search noise.
- Keep Markdown documentation current with the OpenAI-based AI analysis runtime.

## Frontend Changes
- Site title and favicon/logo use stock dashboard branding.
- AI analysis copy no longer references Claude.
- OpenAI-related wording is documented as backend-owned; no OpenAI key belongs in frontend `VITE_*` variables.
- WebSocket hooks now keep callback references fresh without forcing avoidable reconnects.
- Vite vendor chunking is package-aware, preventing all dependencies from collapsing into `vendor-react`.
- Documentation-only Mermaid rendering stays lazy-loaded through the `/docs` route.
- Vite chunk warning threshold is set to account for the lazy Mermaid documentation renderer while keeping app feature chunks split.

## Verification
- `npm run lint`
- `npm run test:run`
- `npm run build`
- Frontend Auto Deploy must complete successfully after pushing to `main`.

## Production Notes
- `VITE_API_BASE_URL`, `VITE_WS_URL`, and `VITE_PORTONE_IMP_KEY` are public build-time values.
- Do not put server-side secrets, OpenAI keys, OAuth client secrets, JWT secrets, AWS keys, or payment secrets in frontend env files.
- Local IDE metadata is ignored and should not be used as project history.
