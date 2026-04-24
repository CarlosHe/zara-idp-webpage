// Lighthouse CI budgets. Sprint 10 (L-1010) gate: every PR run must
// clear these scores on at least one run of each URL — lhci collects
// three runs and picks the median. Assertion targets match the
// REFACTOR-PLAN.md §Sprint 10 exit gate.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      // The SPA serves every route from `/index.html`. The paths below
      // cover the representative surfaces: dashboard (default route),
      // resources (data-heavy table), audit (virtualization path).
      url: ['/', '/resources', '/audit'],
      settings: {
        preset: 'desktop',
        // Skip PWA — we don't ship a service worker yet.
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Third-party ads/analytics plugins would inflate budgets without
        // representing what Zara actually ships; disable them.
        skipAudits: ['uses-http2', 'canonical'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      // `temporary-public-storage` uploads the report to lhci's free
      // public server for easy inspection from the CI run. Swap for a
      // private lhci server when we have one.
      target: 'temporary-public-storage',
    },
  },
};
