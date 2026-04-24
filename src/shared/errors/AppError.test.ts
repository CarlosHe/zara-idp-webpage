import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from './AppError';

describe('AppError subclasses', () => {
  it('each subclass sets its own kind + name', () => {
    expect(new ValidationError({ message: 'bad' }).kind).toBe('validation');
    expect(new ValidationError({ message: 'bad' }).name).toBe('ValidationError');
    expect(new NotFoundError({ message: 'nf' }).kind).toBe('not_found');
    expect(new UnauthorizedError({ message: 'u' }).kind).toBe('unauthorized');
    expect(new ForbiddenError({ message: 'f' }).kind).toBe('forbidden');
    expect(new ConflictError({ message: 'c' }).kind).toBe('conflict');
    expect(new ServerError({ message: 's' }).kind).toBe('server');
    expect(new NetworkError({ message: 'n' }).kind).toBe('network');
  });

  it('carries correlation id, status and details when set', () => {
    const err = new AppError({
      kind: 'server',
      message: 'boom',
      status: 500,
      correlationId: 'abc-123',
      details: { failing: 'stage' },
    });
    expect(err.status).toBe(500);
    expect(err.correlationId).toBe('abc-123');
    expect(err.details).toEqual({ failing: 'stage' });
  });
});

describe('AppError.from — FetchBaseQueryError', () => {
  it('maps 400/422 to ValidationError with body message', () => {
    const err = AppError.from({
      status: 400,
      data: { message: 'name is required', correlationId: 'v-1' },
    });
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toBe('name is required');
    expect(err.correlationId).toBe('v-1');

    const err422 = AppError.from({ status: 422, data: { error: 'invalid yaml' } });
    expect(err422).toBeInstanceOf(ValidationError);
    expect(err422.message).toBe('invalid yaml');
  });

  it('maps 401 → Unauthorized, 403 → Forbidden, 404 → NotFound, 409 → Conflict', () => {
    expect(AppError.from({ status: 401, data: { message: 'login' } })).toBeInstanceOf(
      UnauthorizedError,
    );
    expect(AppError.from({ status: 403, data: { message: 'denied' } })).toBeInstanceOf(
      ForbiddenError,
    );
    expect(AppError.from({ status: 404, data: { message: 'missing' } })).toBeInstanceOf(
      NotFoundError,
    );
    expect(AppError.from({ status: 409, data: { message: 'conflict' } })).toBeInstanceOf(
      ConflictError,
    );
  });

  it('maps any 5xx to ServerError', () => {
    expect(AppError.from({ status: 502 })).toBeInstanceOf(ServerError);
    expect(AppError.from({ status: 503 })).toBeInstanceOf(ServerError);
  });

  it('uses the status-based fallback message when body lacks message/error', () => {
    const err = AppError.from({ status: 500, data: null });
    expect(err.message).toBe('Request failed with status 500.');
  });

  it('maps FETCH_ERROR / TIMEOUT_ERROR to NetworkError', () => {
    expect(AppError.from({ status: 'FETCH_ERROR', error: 'ETIMEDOUT' })).toBeInstanceOf(
      NetworkError,
    );
    expect(AppError.from({ status: 'TIMEOUT_ERROR', error: 'timeout' })).toBeInstanceOf(
      NetworkError,
    );
  });

  it('maps PARSING_ERROR to generic AppError with explanatory message', () => {
    const err = AppError.from({ status: 'PARSING_ERROR', originalStatus: 200, data: 'html' });
    expect(err.kind).toBe('unknown');
    expect(err.message).toContain('invalid response');
  });
});

describe('AppError.from — other inputs', () => {
  it('passes through existing AppError instances', () => {
    const original = new ConflictError({ message: 'dup', status: 409 });
    expect(AppError.from(original)).toBe(original);
  });

  it('wraps native Errors', () => {
    const err = AppError.from(new TypeError('bad type'));
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('bad type');
    expect(err.kind).toBe('unknown');
  });

  it('wraps bare strings', () => {
    const err = AppError.from('plain text error');
    expect(err.message).toBe('plain text error');
    expect(err.kind).toBe('unknown');
  });

  it('wraps serialized errors', () => {
    const err = AppError.from({ message: 'ser', name: 'X', code: '42' });
    expect(err.kind).toBe('unknown');
    expect(err.message).toBe('ser');
  });

  it('wraps unknown values with a fallback message', () => {
    const err = AppError.from({ totally: 'opaque' });
    expect(err.message).toBe('Unexpected error.');
  });
});
