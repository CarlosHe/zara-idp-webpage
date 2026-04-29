// Sprint-32 / L-3204 — sanity tests for the in-tree a11y auditor.
// These guard the auditor itself; the page-level a11y tests live next
// to each feature.
import { describe, it, expect } from 'vitest';
import { audit, auditPage } from './audit';

function makeFragment(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('a11y audit', () => {
  it('returns no violations for a clean page', () => {
    const root = makeFragment(`
      <main>
        <h1>Home</h1>
        <h2>Services</h2>
        <button type="button">Refresh</button>
        <a href="/docs">Docs</a>
        <img src="logo.svg" alt="zara" />
      </main>
    `);
    expect(auditPage(root)).toEqual([]);
  });

  it('flags a missing accessible name on a button', () => {
    const root = makeFragment('<main><h1>P</h1><button type="button"></button></main>');
    const v = auditPage(root);
    expect(v.some((x) => x.id === 'interactive-name')).toBe(true);
  });

  it('flags an out-of-order heading sequence', () => {
    const root = makeFragment('<main><h1>P</h1><h3>skip</h3></main>');
    const v = auditPage(root);
    expect(v.some((x) => x.id === 'heading-order')).toBe(true);
  });

  it('flags a positive tabindex', () => {
    const root = makeFragment(
      '<main><h1>P</h1><div role="button" tabindex="3" aria-label="x"></div></main>',
    );
    const v = auditPage(root);
    expect(v.some((x) => x.id === 'positive-tabindex')).toBe(true);
  });

  it('flags a missing main landmark on page-level subtrees', () => {
    const root = makeFragment('<div><h1>Hi</h1></div>');
    const v = auditPage(root);
    expect(v.some((x) => x.id === 'landmark-one-main')).toBe(true);
  });

  it('flags an unknown aria role', () => {
    const root = makeFragment(
      '<main><h1>P</h1><div role="not-a-role">x</div></main>',
    );
    const v = auditPage(root);
    expect(v.some((x) => x.id === 'aria-role-known')).toBe(true);
  });

  it('does not raise the moderate-only inputs to critical', () => {
    const root = makeFragment('<main><h1>P</h1></main>');
    expect(audit(root).filter((x) => x.severity === 'moderate')).toEqual([]);
  });
});
