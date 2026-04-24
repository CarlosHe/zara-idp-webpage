import type { ComponentType, SVGProps } from 'react';

export type GoldenPathCategory =
  | 'database'
  | 'application'
  | 'infrastructure'
  | 'observability'
  | 'cicd'
  | 'organization';

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
