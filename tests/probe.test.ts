import { describe, expect, it } from 'vitest';
describe('probe', () => {
  it('works', () => {
    expect(window.location.href).toBe('http://localhost:3000/');
    localStorage.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
  });
});
