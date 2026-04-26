export type TechDocFormat = 'mdx' | 'openapi';

export interface DocFinding {
  kind: string;
  message: string;
}

export interface DocPage {
  slug: string;
  kind: 'markdown' | 'adr' | 'runbook' | 'openapi' | 'diagram';
  title: string;
  sourcePath: string;
  sizeBytes?: number;
  contentSha?: string;
}

export interface TechDocSummary {
  slug: string;
  title: string;
  description: string;
  format: TechDocFormat;
  openApiPath?: string;
  source?: 'built-in' | 'docset';
  owner?: string;
  version?: string;
  buildState?: 'pending' | 'building' | 'ready' | 'failed' | 'stale';
  lastBuiltAt?: string;
  lastDiscoveredAt?: string;
  findings?: DocFinding[];
  sourceProvider?: string;
  entityRef?: string;
}

export interface TechDoc extends TechDocSummary {
  markdown: string;
  pages?: DocPage[];
  buildMessage?: string;
}
