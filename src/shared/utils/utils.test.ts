import { describe, expect, it, vi } from 'vitest';
import {
  capitalize,
  cn,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  pluralize,
  truncate,
} from './utils';

describe('cn', () => {
  it('joins truthy classes and drops falsey ones', () => {
    expect(cn('a', false && 'b', 'c', null, undefined, 0 && 'd')).toBe('a c');
  });

  it('merges conflicting Tailwind utilities so the last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-slate-500', 'text-red-500')).toBe('text-red-500');
  });
});

describe('date formatters', () => {
  it('renders N/A when the input is empty or invalid', () => {
    expect(formatDate(undefined)).toBe('N/A');
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate('not-a-date')).toBe('N/A');
    expect(formatDateTime(null)).toBe('N/A');
    expect(formatRelativeTime(null)).toBe('N/A');
  });

  it('formats an ISO string as Month day, year', () => {
    expect(formatDate('2026-04-24T12:00:00Z')).toMatch(/Apr.*24.*2026/);
    expect(formatDate(new Date('2026-04-24T12:00:00Z'))).toMatch(/Apr.*24.*2026/);
  });

  it('includes the time component in formatDateTime', () => {
    expect(formatDateTime('2026-04-24T12:30:00Z')).toMatch(/Apr.*24.*2026/);
  });

  it('returns relative phrases for close-by dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-24T12:00:00Z'));
    try {
      expect(formatRelativeTime('2026-04-24T11:59:50Z')).toBe('just now');
      expect(formatRelativeTime('2026-04-24T11:50:00Z')).toBe('10m ago');
      expect(formatRelativeTime('2026-04-24T09:00:00Z')).toBe('3h ago');
      expect(formatRelativeTime('2026-04-22T12:00:00Z')).toBe('2d ago');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('truncate', () => {
  it('returns the string untouched if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('slices and appends an ellipsis when over the limit', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });
});

describe('capitalize', () => {
  it('uppercases the first character and lowercases the rest', () => {
    expect(capitalize('zara')).toBe('Zara');
    expect(capitalize('ALL CAPS')).toBe('All caps');
  });
});

describe('pluralize', () => {
  it('returns singular for exactly 1', () => {
    expect(pluralize(1, 'resource')).toBe('resource');
  });

  it('appends s by default', () => {
    expect(pluralize(2, 'resource')).toBe('resources');
  });

  it('uses the custom plural when provided', () => {
    expect(pluralize(3, 'policy', 'policies')).toBe('policies');
  });
});
