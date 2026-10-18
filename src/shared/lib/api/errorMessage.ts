// Normalises the two error shapes RTK Query can emit into a single
// string for ErrorState / toasts / inline banners. Prefer this over
// `String(error)` — `FetchBaseQueryError.status` is a number in the
// success path and the string `'FETCH_ERROR'` in transport failures,
// so naive stringification is misleading.
export function errorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error !== 'object') return typeof error === 'string' ? error : 'Unexpected error.';
  if ('status' in error) {
    if (typeof error.status === 'number') {
      return readFromBody('data' in error ? error.data : undefined) || `Request failed with status ${error.status}.`;
    }
    if (error.status === 'FETCH_ERROR') return 'Network error. Check your connection and try again.';
    if (error.status === 'PARSING_ERROR') return 'The server returned an invalid response.';
    if (error.status === 'TIMEOUT_ERROR') return 'The request timed out.';
    if (error.status === 'CUSTOM_ERROR') return (error as { error?: string }).error ?? 'Request failed.';
    return 'Request failed.';
  }
  return 'message' in error && typeof error.message === 'string' ? error.message : 'Unexpected error.';
}

function readFromBody(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
    if (body.error && typeof body.error === 'object' && 'message' in body.error && typeof body.error.message === 'string') return body.error.message;
  }
  return null;
}
