export interface TechDocSummary {
  slug: string;
  title: string;
  description: string;
  format: 'mdx' | 'openapi';
  openApiPath?: string;
}

export interface TechDoc extends TechDocSummary {
  markdown: string;
}
