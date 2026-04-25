import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { securityHeadersPlugin } from './scripts/security-headers';

// Bundle visualizer output lives at dist/stats.html. CI uploads it as a
// per-PR artifact so we can eyeball regressions. `ANALYZE=true npm run
// build` also pops it open locally.
const analyze = process.env.ANALYZE === 'true';

// Group vendor chunks by purpose so the initial-JS budget (≤150 KB
// gzipped per REFACTOR-PLAN §Sprint 10) stays honest. Feature routes
// already code-split via React.lazy (see src/app/router.tsx). React +
// Redux + Router are co-located in a single `vendor-core` chunk on
// purpose: they form a dependency cycle at the module level and
// splitting them causes rollup "circular chunk" warnings.
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (
    id.includes('/react-dom/') ||
    id.includes('/react/') ||
    id.includes('/scheduler/') ||
    id.includes('/react-router') ||
    id.includes('/@remix-run/') ||
    id.includes('/@reduxjs/') ||
    id.includes('/react-redux/') ||
    id.includes('/redux/') ||
    id.includes('/reselect/') ||
    id.includes('/immer/')
  ) {
    return 'vendor-core';
  }
  if (id.includes('/@sentry/') || id.includes('/@sentry-internal/')) {
    return 'vendor-sentry';
  }
  if (id.includes('/date-fns/')) return 'vendor-datefns';
  if (id.includes('/lucide-react/')) return 'vendor-icons';
  if (id.includes('/msw/')) return 'vendor-msw';
  if (id.includes('/web-vitals/')) return 'vendor-webvitals';
  if (
    id.includes('/clsx/') ||
    id.includes('/tailwind-merge/') ||
    id.includes('/class-variance-authority/')
  ) {
    return 'vendor-style';
  }
  return 'vendor-misc';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Sprint 11 / L-1105: CSP + COOP/COEP + nosniff + referrer policy
    // injected into the built index.html and applied to every
    // dev/preview HTTP response. Source of truth: scripts/security-headers.ts.
    securityHeadersPlugin(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
      open: analyze,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Keep observability chunks (Sentry SDK, Web Vitals) out of the
    // initial modulepreload fan — they're loaded deliberately after
    // first paint via requestIdleCallback. Preloading them negates
    // the whole reason they're dynamic-imported.
    modulePreload: {
      resolveDependencies: (_file, deps) =>
        deps.filter((dep) => !/vendor-(sentry|webvitals)/.test(dep)),
    },
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
