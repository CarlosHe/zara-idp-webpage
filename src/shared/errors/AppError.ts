// AppError is the single class the UI reaches for when it has to raise
// an error the user will see. Every adapter-layer error (FetchBaseQuery,
// SerializedError, DOMException, thrown primitive) is translated into
// one of these via `AppError.from()`. Keeping the hierarchy narrow and
// discriminant-based lets ErrorBoundary and toast dispatchers render a
// different treatment per kind without a long `if/else` chain.
//
// Kinds map 1:1 onto the HTTP statuses the control-plane emits so the
// boundary between the wire and the app is a single translation layer.

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export type AppErrorKind =
  | 'validation'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'server'
  | 'network'
  | 'unknown';

export interface AppErrorInit {
  kind: AppErrorKind;
  message: string;
  status?: number;
  correlationId?: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status?: number;
  readonly correlationId?: string;
  readonly details?: unknown;

  constructor(init: AppErrorInit) {
    super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = 'AppError';
    this.kind = init.kind;
    this.status = init.status;
    this.correlationId = init.correlationId;
    this.details = init.details;
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (isFetchBaseQueryError(error)) return fromFetchBaseQueryError(error);
    if (isSerializedError(error)) {
      return new AppError({
        kind: 'unknown',
        message: error.message ?? 'Unexpected error.',
        cause: error,
      });
    }
    if (error instanceof Error) {
      return new AppError({ kind: 'unknown', message: error.message, cause: error });
    }
    if (typeof error === 'string') {
      return new AppError({ kind: 'unknown', message: error });
    }
    return new AppError({ kind: 'unknown', message: 'Unexpected error.', cause: error });
  }
}

export class ValidationError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'validation' });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'not_found' });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'unauthorized' });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'forbidden' });
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'conflict' });
    this.name = 'ConflictError';
  }
}

export class ServerError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'server' });
    this.name = 'ServerError';
  }
}

export class NetworkError extends AppError {
  constructor(init: Omit<AppErrorInit, 'kind'>) {
    super({ ...init, kind: 'network' });
    this.name = 'NetworkError';
  }
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'name' in error || 'code' in error) &&
    !('status' in error)
  );
}

function fromFetchBaseQueryError(error: FetchBaseQueryError): AppError {
  const status = error.status;
  const bodyMessage = extractBodyMessage(error);
  const correlationId = extractCorrelationId(error);

  if (typeof status === 'number') {
    const message = bodyMessage ?? `Request failed with status ${status}.`;
    const init = { message, status, correlationId, details: error.data, cause: error };
    if (status === 400 || status === 422) return new ValidationError(init);
    if (status === 401) return new UnauthorizedError(init);
    if (status === 403) return new ForbiddenError(init);
    if (status === 404) return new NotFoundError(init);
    if (status === 409) return new ConflictError(init);
    if (status >= 500) return new ServerError(init);
    return new AppError({ ...init, kind: 'unknown' });
  }

  if (status === 'FETCH_ERROR') {
    return new NetworkError({
      message: 'Network error. Check your connection and try again.',
      cause: error,
    });
  }
  if (status === 'TIMEOUT_ERROR') {
    return new NetworkError({ message: 'The request timed out.', cause: error });
  }
  if (status === 'PARSING_ERROR') {
    return new AppError({
      kind: 'unknown',
      message: 'The server returned an invalid response.',
      cause: error,
    });
  }
  return new AppError({ kind: 'unknown', message: 'Request failed.', cause: error });
}

function extractBodyMessage(error: FetchBaseQueryError): string | undefined {
  const data = (error as { data?: unknown }).data;
  if (!data) return undefined;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
  }
  return undefined;
}

function extractCorrelationId(error: FetchBaseQueryError): string | undefined {
  const data = (error as { data?: unknown }).data;
  if (data && typeof data === 'object' && 'correlationId' in data) {
    const value = (data as { correlationId?: unknown }).correlationId;
    if (typeof value === 'string') return value;
  }
  return undefined;
}
