# Playwright E2E — Zara IDP

End-to-end specs that boot a real Chromium against a running instance of
the webpage. Not part of `npm run verify` — these are intended for CI
after the preview stack (webpage + control-plane + a seeded DB) is up.

## Running

```bash
# Against a local preview (default) — requires the backend on :8080.
npm run test:e2e

# Against an arbitrary URL (staging, preview env):
E2E_BASE_URL=https://zara.staging npm run test:e2e

# Debug mode:
npm run test:e2e:ui
```

## Journeys

| File                              | Covers                                         |
| --------------------------------- | ---------------------------------------------- |
| `journeys/login.spec.ts`          | Auth redirect + successful login               |
| `journeys/create-resource.spec.ts`| Resources page → new resource modal → list     |
| `journeys/approve-changeset.spec.ts` | Approvals page → approve mutation           |
| `journeys/audit-view.spec.ts`     | Audit table renders + basic filter             |
| `journeys/freeze-window.spec.ts`  | Create a freeze window + verify it appears     |

## Conventions

- Specs are written against the **user-visible contract** — `getByRole`,
  `getByLabel`, `getByText`. Avoid brittle CSS selectors.
- Authentication seeded via `localStorage.setItem('zara.authToken', …)`
  in `context.addInitScript`. Real auth flow covered only in
  `login.spec.ts`.
- Each test reads `E2E_USER` / `E2E_PASS` from env. Defaults work
  against `make preview` + `make seed`.
