// Security headers shared between Vite (dev/preview) and the
// production Nginx front-door. The deployment surface lives outside
// this repo, but the canonical header set is checked in here so
// .claude/docs/front/15-CONTENT-SECURITY.md and
// .claude/docs/front/08-BUILD-DEPLOY.md can quote one source of truth.
//
// Sprint 11 / L-1105.

import type { Plugin } from 'vite';

/**
 * The strict CSP shipped to production. Notes:
 * - `script-src 'self'` — no inline `<script>`, no eval, no remote
 *   scripts. Vite's dev server normally injects an inline runtime; we
 *   relax that ONLY in development via {@link relaxedDevCsp}.
 * - `style-src 'self' 'unsafe-inline'` — Tailwind generates style tags
 *   at runtime in dev; in prod the bundler emits a single CSS file but
 *   `'unsafe-inline'` is kept because lucide icons inject minor inline
 *   styles. Tighten further once we audit every `<style>` callsite.
 * - `connect-src 'self'` — API requests are same-origin (Nginx proxy
 *   in prod, Vite dev proxy in dev). Sentry/analytics endpoints are
 *   added per-environment via VITE_SENTRY_DSN_HOST / VITE_ANALYTICS_HOST
 *   when present.
 * - `frame-ancestors 'none'` — replaces X-Frame-Options: DENY.
 * - `base-uri 'self'` — kills `<base>` tag-based redirector tricks.
 */
export function buildCsp(env: Record<string, string | undefined> = {}): string {
  const connectExtras: string[] = [];
  if (env.VITE_SENTRY_DSN_HOST) connectExtras.push(env.VITE_SENTRY_DSN_HOST);
  if (env.VITE_ANALYTICS_HOST) connectExtras.push(env.VITE_ANALYTICS_HOST);

  return [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${connectExtras.join(' ')}`.trim(),
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ].join('; ');
}

/**
 * Dev/Preview-time CSP. Vite injects an inline runtime (`@vite/client`)
 * and HMR boot scripts that the strict prod CSP would block. We allow
 * `'unsafe-inline'` and `'unsafe-eval'` for `script-src` only in dev.
 * The production CSP is unchanged.
 */
export function relaxedDevCsp(env: Record<string, string | undefined> = {}): string {
  const prod = buildCsp(env);
  return prod
    .replace(`script-src 'self'`, `script-src 'self' 'unsafe-inline' 'unsafe-eval'`)
    .replace(`connect-src 'self'`, `connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*`);
}

/**
 * Common security headers — same shape for dev and prod. CSP is
 * passed in so the caller picks strict vs relaxed.
 */
export function securityHeaders(csp: string): Record<string, string> {
  return {
    'Content-Security-Policy': csp,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };
}

/**
 * Vite plugin that:
 *   1. Injects the prod CSP as a `<meta http-equiv>` into index.html so
 *      the static build carries the policy even when the deploy
 *      surface forgets to add the header.
 *   2. Adds the same headers to the dev/preview HTTP response so
 *      pages built with `vite` + `vite preview` behave identically to
 *      production for local QA.
 *
 * The Nginx front-door is still the canonical source of these headers
 * in production — the meta tag is a defence-in-depth fallback when
 * caches strip headers (some CDNs do).
 */
export function securityHeadersPlugin(): Plugin {
  return {
    name: 'zara:security-headers',
    transformIndexHtml(html, ctx) {
      // ctx.bundle exists at build time; absent during dev `transform`.
      const isBuild = Boolean(ctx.bundle);
      const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
        string,
        string | undefined
      >;
      const csp = isBuild ? buildCsp(env) : relaxedDevCsp(env);
      const tags = [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' as const },
        { tag: 'meta', attrs: { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' }, injectTo: 'head-prepend' as const },
        { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' as const },
      ];
      return { html, tags };
    },
    configureServer(server) {
      // Apply security headers on every dev response.
      server.middlewares.use((_req, res, next) => {
        const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
          string,
          string | undefined
        >;
        const headers = securityHeaders(relaxedDevCsp(env));
        for (const [k, v] of Object.entries(headers)) {
          // HSTS is meaningless on http://localhost — skip.
          if (k === 'Strict-Transport-Security') continue;
          res.setHeader(k, v);
        }
        next();
      });
    },
    configurePreviewServer(server) {
      // `vite preview` simulates the production deploy surface for QA.
      server.middlewares.use((_req, res, next) => {
        const env = (typeof process !== 'undefined' ? process.env : {}) as Record<
          string,
          string | undefined
        >;
        const headers = securityHeaders(buildCsp(env));
        for (const [k, v] of Object.entries(headers)) {
          if (k === 'Strict-Transport-Security') continue;
          res.setHeader(k, v);
        }
        next();
      });
    },
  };
}
