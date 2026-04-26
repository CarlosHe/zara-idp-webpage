export type SearchScope = 'catalog' | 'docs' | 'audit';

export interface SearchQuery {
  text: string;
  scopes: SearchScope[];
  filters?: Record<string, string>;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  scope: SearchScope;
  entityKey: string;
  title: string;
  body: string;
  tags: string[];
  attributes: Record<string, string>;
  score: number;
  correlationId: string;
  version: number;
  indexedAt: string;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
  traceId: string;
  latencyMs: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  owner: string;
  text: string;
  scopes: SearchScope[];
  filters: Record<string, string>;
  createdAt: string;
}

export interface SavedSearchInput {
  name: string;
  text: string;
  scopes: SearchScope[];
  filters: Record<string, string>;
}

export interface SearchClickInput {
  scope: string;
  queryText: string;
  rank: number;
}
