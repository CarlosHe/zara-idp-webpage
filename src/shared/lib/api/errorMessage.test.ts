import { describe, expect, it } from 'vitest';
import { errorMessage } from './errorMessage';

describe('errorMessage', () => {
  it('returns empty string for null / undefined', () => {
    expect(errorMessage(null)).toBe('');
    expect(errorMessage(undefined)).toBe('');
  });

  it('uses body.message when available on a numeric-status error', () => {
    expect(
      errorMessage({ status: 400, data: { message: 'name is required' } }),
    ).toBe('name is required');
  });

  it('uses body.error as a fallback on a numeric-status error', () => {
    expect(errorMessage({ status: 500, data: { error: 'boom' } })).toBe('boom');
  });

  it('falls back to "Request failed with status N" when body has no message/error', () => {
    expect(errorMessage({ status: 500, data: null })).toBe(
      'Request failed with status 500.',
    );
  });

  it('renders transport-level fetchBaseQuery errors', () => {
    expect(errorMessage({ status: 'FETCH_ERROR', error: 'ECONNRESET' })).toContain(
      'Network error',
    );
    expect(
      errorMessage({ status: 'PARSING_ERROR', originalStatus: 200, data: '<html>', error: 'bad' }),
    ).toContain('invalid response');
    expect(errorMessage({ status: 'TIMEOUT_ERROR', error: 'timeout' })).toBe(
      'The request timed out.',
    );
    expect(errorMessage({ status: 'CUSTOM_ERROR', error: 'nope' })).toBe('nope');
  });

  it('renders SerializedError using the message field', () => {
    expect(errorMessage({ name: 'Error', message: 'serialized boom' })).toBe(
      'serialized boom',
    );
  });
});
