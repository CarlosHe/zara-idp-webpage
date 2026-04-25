import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips <script> tags', () => {
    const dirty = '<p>hi</p><script>alert(1)</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('hi');
  });

  it('strips inline event handlers', () => {
    const dirty = '<a href="https://example.com" onclick="evil()">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('https://example.com');
  });

  it('strips javascript: URLs', () => {
    const dirty = '<a href="javascript:alert(1)">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });

  it('strips iframe / object / embed', () => {
    expect(sanitizeHtml('<iframe src="evil"></iframe>')).not.toContain('iframe');
    expect(sanitizeHtml('<object data="evil"></object>')).not.toContain('object');
    expect(sanitizeHtml('<embed src="evil"/>')).not.toContain('embed');
  });

  it('strips style attributes', () => {
    const dirty = '<p style="background:url(javascript:alert(1))">x</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('style=');
  });

  it('inlineOnly drops block-level elements', () => {
    const dirty = '<div><p>hi</p><b>bold</b></div>';
    const clean = sanitizeHtml(dirty, { inlineOnly: true });
    expect(clean).not.toContain('<div>');
    expect(clean).not.toContain('<p>');
    expect(clean).toContain('<b>bold</b>');
  });

  it('preserves benign markup', () => {
    const dirty = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeHtml(dirty)).toBe('<p>Hello <strong>world</strong></p>');
  });
});
