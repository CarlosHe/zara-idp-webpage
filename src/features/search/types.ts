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
