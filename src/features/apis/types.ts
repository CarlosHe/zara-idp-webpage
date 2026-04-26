export type APILifecycle = 'experimental' | 'production' | 'deprecated' | 'retired';
export type APIType = 'rest' | 'grpc' | 'asyncapi' | 'graphql';
export type APIVersionStatus = 'planned' | 'active' | 'deprecated' | 'retired';

export interface APIConsumerRef {
  kind: string;
  namespace?: string;
  name: string;
}

export interface APIVersion {
  semver: string;
  specDigest: string;
  status: APIVersionStatus;
  publishedAt?: string;
  deprecatedAt?: string;
  docSetSlug?: string;
}

export interface APIDeprecation {
  sunsetAt?: string;
  replacementRef?: string;
  migrationNotes?: string;
}

export interface APISummary {
  id: string;
  namespace: string;
  name: string;
  owner: string;
  type: APIType;
  lifecycle: APILifecycle;
  system?: string;
  description?: string;
  latestSemver?: string;
  versionsCount: number;
  consumersCount: number;
  deprecation: APIDeprecation;
}

export interface APIEntry extends APISummary {
  versions: APIVersion[];
  consumers: APIConsumerRef[];
}

export interface APIDiffDelta {
  path: string;
  impact: 'NO_OP' | 'COMPATIBLE' | 'RISKY' | 'BREAKING';
  summary: string;
  breaking: boolean;
}

export interface APIDiffResult {
  semver: string;
  previousSemver?: string;
  impact: 'NO_OP' | 'COMPATIBLE' | 'RISKY' | 'BREAKING';
  breaking: boolean;
  requiresApproval: boolean;
  consumerImpact: number;
  deltas: APIDiffDelta[];
}
