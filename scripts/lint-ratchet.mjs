#!/usr/bin/env node
// Lint ratchet: fails if the current ESLint error count exceeds the baseline.
// Baseline lives in scripts/lint-baseline.json and is intentionally versioned.
// The ratchet only tightens: when you reduce errors, update the baseline downward.
// Policy: never bump the baseline upward. Fix the errors instead.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const baselinePath = resolve(__dirname, "lint-baseline.json");

const result = spawnSync("npx", ["eslint", ".", "--format", "json"], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

if (result.error) {
  console.error(`[lint-ratchet] failed to run eslint: ${result.error.message}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (e) {
  console.error("[lint-ratchet] could not parse eslint JSON output");
  console.error(result.stdout.slice(0, 500));
  process.exit(2);
}

const errorCount = report.reduce((sum, file) => sum + file.errorCount, 0);
const warningCount = report.reduce((sum, file) => sum + file.warningCount, 0);

const updateMode = process.argv.includes("--update");
if (updateMode) {
  writeFileSync(
    baselinePath,
    JSON.stringify({ errorCount, warningCount, updatedAt: new Date().toISOString().slice(0, 10) }, null, 2) + "\n",
    "utf8",
  );
  console.log(`[lint-ratchet] baseline updated: errors=${errorCount} warnings=${warningCount}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error("[lint-ratchet] no baseline found. Run: npm run lint:ratchet -- --update");
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

if (errorCount > baseline.errorCount) {
  console.error(
    `[lint-ratchet] FAILED: errors=${errorCount} exceeds baseline=${baseline.errorCount}. ` +
      `Fix new violations. Do not raise the baseline.`,
  );
  process.exit(1);
}

if (warningCount > baseline.warningCount) {
  console.error(
    `[lint-ratchet] FAILED: warnings=${warningCount} exceeds baseline=${baseline.warningCount}. ` +
      `Fix new warnings or document the rule exception. Do not raise the baseline.`,
  );
  process.exit(1);
}

if (errorCount < baseline.errorCount) {
  console.log(
    `[lint-ratchet] improvement: errors=${errorCount} < baseline=${baseline.errorCount}. ` +
      `Tighten with: npm run lint:ratchet -- --update`,
  );
}

if (warningCount < baseline.warningCount) {
  console.log(
    `[lint-ratchet] improvement: warnings=${warningCount} < baseline=${baseline.warningCount}. ` +
      `Tighten with: npm run lint:ratchet -- --update`,
  );
}

console.log(
  `[lint-ratchet] OK: errors=${errorCount} (baseline=${baseline.errorCount}), warnings=${warningCount} (baseline=${baseline.warningCount})`,
);
process.exit(0);
