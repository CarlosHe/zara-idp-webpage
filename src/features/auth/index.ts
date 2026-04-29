// Public surface of the auth feature. Following the Zara feature-barrel
// convention, every other feature imports from this file only.
//
// `LoginPage` is intentionally NOT re-exported here. The router is its
// only consumer and imports it via the explicit sub-path
// (`@/features/auth/components/LoginPage`); a barrel re-export would
// tag the component as statically reachable through `<ProtectedRoute>`
// (which imports `useGetMeQuery` from this barrel) and force the
// LoginPage chunk onto the entry's modulepreload list — see
// Sprint-33/L-3301.

export { useGetMeQuery } from './services/authApi';
export type { Principal } from './services/authApi';
export {
  principalHasScope,
  principalHasAllScopes,
  principalHasAnyScope,
} from './lib/scopes';
export type { Scope } from './lib/scopes';
