import { describe, expect, it } from 'vitest';

import {
  principalHasAllScopes,
  principalHasAnyScope,
  principalHasScope,
} from './scopes';
import type { Principal } from '../services/authApi';

function principal(over: Partial<Principal> = {}): Principal {
  return {
    username: 'alice',
    subject: 'sub-1',
    roles: [],
    isAdmin: false,
    namespaces: [],
    currentNamespace: 'default',
    authenticated: true,
    ...over,
  };
}

describe('principalHasScope', () => {
  it('returns false for null/undefined principal', () => {
    expect(principalHasScope(null, 'admin')).toBe(false);
    expect(principalHasScope(undefined, 'admin')).toBe(false);
  });

  it('returns false when principal not authenticated', () => {
    expect(
      principalHasScope(principal({ authenticated: false, isAdmin: true }), 'admin'),
    ).toBe(false);
  });

  it('returns true when isAdmin', () => {
    expect(principalHasScope(principal({ isAdmin: true }), 'developer')).toBe(true);
    expect(principalHasScope(principal({ isAdmin: true }), 'governance.write')).toBe(true);
  });

  it('matches bare role exactly', () => {
    expect(principalHasScope(principal({ roles: ['developer'] }), 'developer')).toBe(true);
    expect(principalHasScope(principal({ roles: ['developer'] }), 'owner')).toBe(false);
  });

  it('matches bare scope against namespace-scoped role', () => {
    expect(
      principalHasScope(principal({ roles: ['developer@frontend'] }), 'developer'),
    ).toBe(true);
  });

  it('namespace-scoped query requires exact match', () => {
    expect(
      principalHasScope(principal({ roles: ['developer@frontend'] }), 'developer@backend'),
    ).toBe(false);
    expect(
      principalHasScope(principal({ roles: ['developer@frontend'] }), 'developer@frontend'),
    ).toBe(true);
  });
});

describe('principalHasAllScopes', () => {
  it('empty list always passes', () => {
    expect(principalHasAllScopes(null, [])).toBe(true);
  });

  it('all required must match', () => {
    const p = principal({ roles: ['viewer', 'developer'] });
    expect(principalHasAllScopes(p, ['viewer', 'developer'])).toBe(true);
    expect(principalHasAllScopes(p, ['viewer', 'owner'])).toBe(false);
  });
});

describe('principalHasAnyScope', () => {
  it('empty list always passes', () => {
    expect(principalHasAnyScope(null, [])).toBe(true);
  });

  it('any-of match', () => {
    const p = principal({ roles: ['viewer'] });
    expect(principalHasAnyScope(p, ['owner', 'maintainer', 'viewer'])).toBe(true);
    expect(principalHasAnyScope(p, ['owner', 'maintainer'])).toBe(false);
  });
});
