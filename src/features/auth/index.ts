// Public surface of the auth feature. Following the Zara feature-barrel
// convention, every other feature imports from this file only.

export { useGetMeQuery } from './services/authApi';
export type { Principal } from './services/authApi';
export { LoginPage } from './components/LoginPage';
export {
  principalHasScope,
  principalHasAllScopes,
  principalHasAnyScope,
} from './lib/scopes';
export type { Scope } from './lib/scopes';
