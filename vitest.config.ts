import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// `import.meta.env.*` entries are baked in at build time — vitest does
// not inject them via `test.env`. We map them explicitly here so both
// `webVitals.ts` (reads VITE_ANALYTICS_ENDPOINT) and `baseQuery.ts`
// (reads VITE_API_BASE_URL) resolve the right values at test time.
const VITE_ENV: Record<string, string> = {
  'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:3000/api/v1'),
  'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(''),
  'import.meta.env.VITE_ANALYTICS_ENDPOINT': JSON.stringify(''),
  'import.meta.env.MODE': JSON.stringify('test'),
};

// Vitest config intentionally forked from vite.config.ts — we don't want
// the Tailwind plugin (no CSS compilation needed in jsdom) or the proxy
// (MSW intercepts all fetches). Shared: the React plugin + the `@/`
// alias so import paths in tests match runtime.
export default defineConfig({
  plugins: [react()],
  define: VITE_ENV,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // jsdom 29 forbids localStorage on opaque origins ("about:blank"). MSW's
    // cookieStore touches localStorage at import time, so we give jsdom a
    // real origin so it hands back an in-memory Storage implementation.
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000/' },
    },
    setupFiles: ['./tests/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/shared/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/app/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/main.tsx',
        'src/app/router.tsx',
        'src/app/App.tsx',
        // Route layouts are structural glue — covered by E2E.
        'src/app/layouts/**',
        'src/app/routes/**',
        // CVA-only barrels don't expose behaviour.
        'src/shared/components/ui/index.ts',
        'src/shared/components/feedback/index.ts',
      ],
    },
  },
});
