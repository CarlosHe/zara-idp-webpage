import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('boots vitest with jsdom + jest-dom matchers', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    document.body.append(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('hello');
  });

  it('has a non-opaque origin (localStorage works)', () => {
    expect(window.location.href).toContain('localhost');
    localStorage.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
  });
});
