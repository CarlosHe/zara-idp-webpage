import { GoldenPathMarketplace } from './GoldenPathMarketplace';

// Sprint-19 / L-1908 — the Golden Paths route now points at the
// registry-driven marketplace. The legacy local-template builder
// (`GoldenPathBuilder` + hardcoded fixtures) remains in this folder
// as a development scaffold and is no longer wired to the page so
// users always see the live registry contract.
export function GoldenPathsPage() {
  return <GoldenPathMarketplace />;
}
