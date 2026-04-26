import type { ComponentType, SVGProps } from 'react';

// Sprint-19 / L-1908 — types for the marketplace surface.
//
// `GoldenPath` is the legacy local fixture (bundled as a fallback
// when the backend registry is unreachable). `GoldenPathSummary` is
// the registry payload returned by `/api/v1/golden-paths`.

export type GoldenPathCategory =
  | 'database'
  | 'application'
  | 'infrastructure'
  | 'observability'
  | 'cicd'
  | 'organization'
  | 'service';

export interface PathParameter {
  name: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  required: boolean;
  default?: string;
  placeholder?: string;
}

export interface GoldenPath {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  category: GoldenPathCategory;
  parameters: PathParameter[];
  template: string;
}

export interface ApplyResultDetail {
  resource: string;
  status: 'success' | 'error';
  message?: string;
}

export type ApplyStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string; details?: ApplyResultDetail[] }
  | { type: 'error'; message: string; details?: ApplyResultDetail[] };

// --- Registry types -------------------------------------------------------

export interface GoldenPathSummaryParameter {
  name: string;
  label: string;
  description?: string;
  type: 'string' | 'int' | 'bool' | 'select';
  required: boolean;
  default?: unknown;
  pattern?: string;
  options?: string[];
  example?: string;
}

export interface GoldenPathSummaryAction {
  id: string;
  kind: string;
  dependsOn?: string[];
  secrets?: string[];
  outputs?: string[];
  irreversible?: boolean;
}

export interface GoldenPathSecretDeclaration {
  name: string;
  provider: string;
  description?: string;
}

export interface GoldenPathOutput {
  name: string;
  from: 'params' | 'outputs';
  path: string;
}

export interface GoldenPathSummary {
  id: string;
  name: string;
  description: string;
  version: string;
  category?: string;
  labels?: Record<string, string>;
  parameters: GoldenPathSummaryParameter[];
  actions: GoldenPathSummaryAction[];
  secrets?: GoldenPathSecretDeclaration[];
  outputs?: GoldenPathOutput[];
  policy?: { previewBeforeExecute?: boolean };
  risk?: { baselineRisk?: string };
  hasDSL: boolean;
  hasRollbackPlan: boolean;
}

export interface GoldenPathExecuteRequest {
  id: string;
  parameters: Record<string, string>;
  dryRun?: boolean;
  requestedBy?: string;
}

export interface GoldenPathActionPlanEntry {
  ID: string;
  Kind: string;
  DependsOn?: string[];
  Inputs?: Record<string, string>;
  Secrets?: string[];
  Outputs?: string[];
  Irreversible?: boolean;
}

export interface GoldenPathRollbackPlanEntry {
  ActionID: string;
  Kind: string;
  Irreversible?: boolean;
  Reason?: string;
  Inputs?: Record<string, string>;
}

export interface GoldenPathPolicyPreview {
  Decision: 'allowed' | 'blocked';
  Risk?: string;
  Findings?: string[];
}

export interface GoldenPathExecuteResponse {
  resourcesYaml: string;
  message: string;
  nextSteps: string;
  executionId?: string;
  changeSet?: {
    id?: string;
    approvalStatus?: string;
    requiresApproval?: boolean;
    totalRisk?: string;
    changeCount?: number;
    version?: number;
  } | null;
  actionPlan?: GoldenPathActionPlanEntry[];
  rollbackPlan?: GoldenPathRollbackPlanEntry[];
  declaredSecrets?: string[];
  policyPreview?: GoldenPathPolicyPreview;
}
