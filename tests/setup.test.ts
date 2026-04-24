import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('boots vitest with jsdom + jest-dom matchers', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    document.body.append(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('hello');
  });

  it('provides an in-memory localStorage on the jsdom origin', () => {
    localStorage.setItem('foo', 'bar');
    expect(localStorage.getItem('foo')).toBe('bar');
    localStorage.clear();
  });
});
