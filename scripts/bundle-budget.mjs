#!/usr/bin/env node
// Sprint-32 / L-3205 — frontend performance budget enforcement.
//
// Two budgets, both enforced as ratchets (current size becomes the
// new ceiling; the budget tightens, never relaxes):
//
//   - **critical-path-gzip**: the sum of the entry-script gzipped
//     size + every <link rel="modulepreload"> gzipped chunk in
//     `dist/index.html`. This is what the browser must parse before
//     the SPA hydrates. The Sprint-32 product target is <180 KB gz;
//     the actual baseline at sprint cut may be higher (see
//     `scripts/bundle-budget.json`). The ratchet stops regression
//     while the team chips away at vendor-core.
//
//   - **route-chunk-gzip-max**: the largest non-vendor / non-entry
//     code-split chunk under `dist/assets/`. The product target is
//     <60 KB gz per route chunk, which gives a comfortable interactive
//     budget on a 3G connection.
//
// Usage:
//   node scripts/bundle-budget.mjs            # check
//   node scripts/bundle-budget.mjs --update   # update baseline
//
// `npm run verify` runs this script after `npm run build`.
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const distDir = resolve(repoRoot, 'dist');
const indexHtml = resolve(distDir, 'index.html');
const baselinePath = resolve(__dirname, 'bundle-budget.json');

if (!existsSync(indexHtml)) {
  console.error(
    `[bundle-budget] dist/index.html not found — run \`npm run build\` first.`,
  );
  process.exit(2);
}

const html = readFileSync(indexHtml, 'utf8');
const entryMatch = html.match(/<script[^>]*\bsrc="([^"]+)"/);
const preloadMatches = [
  ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
];

if (!entryMatch) {
  console.error('[bundle-budget] could not locate <script src="..."> in index.html');
  process.exit(2);
}

const criticalAssets = [entryMatch[1], ...preloadMatches.map((m) => m[1])]
  .map((href) => href.replace(/^\//, ''))
  .map((href) => resolve(distDir, href));

let critGz = 0;
for (const path of criticalAssets) {
  if (!existsSync(path)) {
    console.error(`[bundle-budget] referenced asset missing: ${path}`);
    process.exit(2);
  }
  critGz += gzipSync(readFileSync(path)).length;
}

// Walk dist/assets/* for route chunks. Exclude vendor-* chunks (they
// are the cost of doing business; tracked separately) and the entry
// script. The largest remaining chunk is our route-chunk metric.
const assetsDir = resolve(distDir, 'assets');
const allAssets = readdirSync(assetsDir).filter((n) => n.endsWith('.js'));
const entryName = basename(entryMatch[1]);
const VENDOR_PREFIXES = ['vendor-', 'sentry-', 'baseApi-'];
const routeChunks = allAssets
  .filter((n) => n !== entryName)
  .filter((n) => !VENDOR_PREFIXES.some((p) => n.startsWith(p)))
  .map((name) => {
    const buf = readFileSync(resolve(assetsDir, name));
    return { name, gz: gzipSync(buf).length };
  })
  .sort((a, b) => b.gz - a.gz);

const routeMaxGz = routeChunks[0]?.gz ?? 0;
const routeMaxName = routeChunks[0]?.name ?? '(none)';

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : { criticalPathGz: 0, routeChunkMaxGz: 0, routeChunkMaxName: '' };

const update = process.argv.includes('--update');

console.log(
  `[bundle-budget] critical path = ${(critGz / 1024).toFixed(1)} KB gz` +
    ` (baseline ${(baseline.criticalPathGz / 1024).toFixed(1)} KB gz)`,
);
console.log(
  `[bundle-budget] largest route chunk = ${routeMaxName} ` +
    `${(routeMaxGz / 1024).toFixed(1)} KB gz` +
    ` (baseline ${(baseline.routeChunkMaxGz / 1024).toFixed(1)} KB gz)`,
);

if (update) {
  writeFileSync(
    baselinePath,
    JSON.stringify(
      {
        criticalPathGz: critGz,
        routeChunkMaxGz: routeMaxGz,
        routeChunkMaxName: routeMaxName,
        updatedAt: new Date().toISOString().slice(0, 10),
        targets: {
          criticalPathGz: 180 * 1024,
          routeChunkMaxGz: 60 * 1024,
        },
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`[bundle-budget] baseline updated → ${baselinePath}`);
  process.exit(0);
}

let failed = false;
if (critGz > baseline.criticalPathGz) {
  console.error(
    `[bundle-budget] FAIL critical-path-gz grew: ` +
      `${critGz} > baseline ${baseline.criticalPathGz} ` +
      `(+${critGz - baseline.criticalPathGz} bytes)`,
  );
  failed = true;
}
if (routeMaxGz > baseline.routeChunkMaxGz) {
  console.error(
    `[bundle-budget] FAIL route-chunk-max-gz grew: ` +
      `${routeMaxName} ${routeMaxGz} > baseline ${baseline.routeChunkMaxGz}`,
  );
  failed = true;
}
if (failed) {
  console.error(
    `[bundle-budget] ratchet only tightens. Trim the bundle or run ` +
      `\`node scripts/bundle-budget.mjs --update\` after a deliberate trim.`,
  );
  process.exit(1);
}

console.log('[bundle-budget] ✓ ratchet held');
