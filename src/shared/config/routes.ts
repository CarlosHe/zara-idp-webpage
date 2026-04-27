// Typed route constants. Every <Link> / useNavigate site must use
// one of these — no inline string paths. Dynamic routes expose a
// builder function whose argument is positional so call sites stay
// grep-able (e.g. ROUTES.TEAMS.DETAIL('platform')).
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  // Sprint-24 / L-2403 — the personalised platform home (role-aware
  // landing page with approvals, alerts, recommendations, recent
  // activity, services owned, and quick links).
  PERSONAL_HOME: '/home',
  LOGIN: '/login',

  RESOURCES: {
    LIST: '/resources',
    DETAIL: (kind: string, namespace: string, name: string) =>
      `/resources/${kind}/${namespace}/${name}` as const,
  },

  CATALOG: {
    LIST: '/catalog',
    DETAIL: (kind: string, namespace: string, name: string) =>
      `/catalog/${kind}/${namespace}/${name}` as const,
    SOURCES: '/catalog/sources',
  },

  TEAMS: {
    LIST: '/teams',
    DETAIL: (teamName: string) => `/teams/${teamName}` as const,
  },

  APPROVALS: {
    LIST: '/approvals',
    DETAIL: (id: string) => `/approvals/${id}` as const,
  },

  AUDIT: {
    LIST: '/audit',
    DETAIL: (id: string) => `/audit/${id}` as const,
  },

  FREEZES: {
    LIST: '/freezes',
    DETAIL: (id: string) => `/freezes/${id}` as const,
  },

  POLICIES: {
    LIST: '/policies',
    DETAIL: (namespace: string, name: string) =>
      `/policies/${namespace}/${name}` as const,
  },

  GOLDEN_PATHS: '/golden-paths',
  CALENDAR: '/calendar',
  BUSINESS_DOMAINS: '/domains',
  CLUSTERS: '/clusters',
  NAMESPACES: '/namespaces',
  ANALYTICS: '/analytics',
  PLUGINS: '/plugins',
  SEARCH: '/search',
  DOCS: '/docs',
  APIS: '/apis',
  RUNTIME: '/runtime',
  SCORECARDS: '/scorecards',
} as const;
