# ADR 0001 — Raise the critical-path bundle budget by 555 bytes gz to take the React Router security patch

- **Status:** Accepted
- **Date:** 2026-08-09
- **Loop:** Sprint 37 / L-3706
- **Supersedes:** nothing
- **Affects:** `scripts/bundle-budget.json` (`criticalPathGz`, `routeChunkMaxGz`)

## Context

`scripts/bundle-budget.mjs` enforces the critical-path budget as a
**ratchet**: the measured size becomes the new ceiling and the ceiling
only ever moves down. Per `.claude/docs/34-RALPH-LOOPS.md` §3, raising a
ratchet baseline requires an ADR. This is that ADR.

The Sprint 37 opening audit found `npm run audit:prod` red with 7
production advisories (1 low, 1 moderate, 5 high). Two of them are
runtime-reachable in this application:

- **`dompurify` ≤ 3.4.12** — ten advisories, several of them `IN_PLACE`
  sanitization bypasses that leave executable markup intact. This app
  renders untrusted documentation content through DOMPurify (see
  `.claude/docs/front/15-CONTENT-SECURITY.md`), so these are directly on
  our XSS surface.
- **`react-router` 6.0.0 – 7.18.1** — seven advisories: CSRF via
  PUT/PATCH/DELETE document requests, open redirect via backslash in
  `<Link>` / `useNavigate` (a CVE-2025-68470 bypass), unauthenticated DoS
  via inefficient route matching, XSS via `RSCErrorHandler` missing
  protocol validation, and arbitrary constructor injection in
  `deserializeErrors()`.

The remainder (`vite`, `esbuild`, `postcss`, `nanoid`) are toolchain
packages that `--omit=dev` still surfaces.

Every remediation was available inside the existing semver ranges, so
`npm audit fix` resolved all seven with **no `package.json` change** —
only `package-lock.json` moved:

| package | before | after |
| --- | --- | --- |
| `dompurify` | 3.4.1 | 3.4.13 |
| `react-router` / `react-router-dom` | 7.14.2 | 7.18.2 |
| `vite` | 7.3.2 | 7.3.6 |
| `esbuild` | 0.27.7 | 0.28.2 |
| `postcss` | 8.5.6 | 8.5.26 |

`npm audit --omit=dev --audit-level=high` now reports **0
vulnerabilities**.

## Problem

The React Router minor bump (7.14.2 → 7.18.2) grew the critical path:

```
[bundle-budget] critical path = 203.0 KB gz (baseline 202.5 KB gz)
[bundle-budget] FAIL critical-path-gz grew: 207903 > baseline 207348 (+555 bytes)
[bundle-budget] FAIL route-chunk-max-gz grew: index 6115 > baseline 6113 (+2 bytes)
```

`react-router` is in the `vendor-core` chunk (`vite.config.ts`), so its
growth lands squarely on the critical path.

## Options considered

1. **Import from `react-router` instead of the `react-router-dom` shim.**
   Investigated and rejected: in v7 `react-router-dom` is a re-export
   shim whose entire dist is **384 bytes uncompressed**, so it cannot
   account for 555 bytes gz. It is also not a safe blind rewrite —
   `RouterProvider` and `HydratedRouter` come from `react-router/dom`,
   not `react-router`, so a mechanical find-and-replace across the 38
   import sites would break the router bootstrap. No meaningful saving,
   real regression risk.

2. **Pin `react-router` at 7.14.2 and waive the advisories.** Rejected.
   The open-redirect and CSRF advisories are directly exploitable
   against an authenticated IDP console that performs privileged
   mutations. 555 bytes gz is not a defensible price for keeping seven
   known vulnerabilities, five of them high.

3. **Trim 555 bytes elsewhere to stay under the ceiling.** Rejected *for
   this loop*. There is no trim available that is both safe and
   mechanical; the only real lever left on `vendor-core` is the
   long-deferred `preact-compat` experiment, which needs the full
   Playwright + a11y matrix as a regression net and is its own A-loop.
   Coupling a security patch to a speculative renderer swap would block
   the patch on an experiment.

4. **Raise the ratchet by exactly the measured delta, with this ADR.**
   Chosen.

## Decision

Raise the baseline to the measured post-patch size:

- `criticalPathGz`: 207348 → **207903** (+555 bytes, 202.5 → 203.0 KB gz)
- `routeChunkMaxGz`: 6113 → **6115** (+2 bytes)

The raise is exactly the measured delta — not rounded up, and no
headroom granted. The ratchet resumes its downward-only behaviour from
the new number immediately.

The product target in `scripts/bundle-budget.json` is **unchanged** at
`184320` (180 KB gz). This ADR moves the ceiling, not the goal; the gap
to target widens from 22.5 KB gz to 23.0 KB gz.

## Consequences

- `npm run verify` is green again and `audit:prod` reports 0
  vulnerabilities.
- The 180 KB gz product target is 23.0 KB gz away and still owned by the
  deferred `preact-compat` A-loop.
- **Precedent, deliberately narrow:** a ratchet raise is acceptable when
  (a) it pays for a security remediation with no in-range alternative,
  (b) the raise equals the measured delta with no headroom, and (c) the
  product target is left untouched. A raise to accommodate a *feature*
  does not qualify and still needs its own ADR arguing its own case.
- Requeued for Sprint 38: re-measure after the `preact-compat`
  experiment, and audit whether `vendor-core` should split
  `react-router` out of the critical path now that it is the chunk's
  fastest-growing member.

## Verification

```
npm run verify        # typecheck, typecheck:test, lint:ratchet, test, build, bundle:budget, audit:prod
npm run test:e2e      # journeys + a11y matrix — regression net for the router bump
```
