import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

type RtkError = FetchBaseQueryError | SerializedError | undefined | null;

// Normalises the two error shapes RTK Query can emit into a single
// string for ErrorState / toasts / inline banners. Prefer this over
// `String(error)` — `FetchBaseQueryError.status` is a number in the
// success path and the string `'FETCH_ERROR'` in transport failures,
// so naive stringification is misleading.
export function errorMessage(error: RtkError): string {
  if (!error) return '';
  if ('status' in error) {
    if (typeof error.status === 'number') {
      return readFromBody(error.data) || `Request failed with status ${error.status}.`;
    }
    if (error.status === 'FETCH_ERROR') return 'Network error. Check your connection and try again.';
    if (error.status === 'PARSING_ERROR') return 'The server returned an invalid response.';
    if (error.status === 'TIMEOUT_ERROR') return 'The request timed out.';
    if (error.status === 'CUSTOM_ERROR') return (error as { error?: string }).error ?? 'Request failed.';
    return 'Request failed.';
  }
  return error.message ?? 'Unexpected error.';
}

function readFromBody(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
  }
  return null;
}
