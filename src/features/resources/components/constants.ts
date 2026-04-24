import {
  Box,
  Database,
  Folder,
  KeyRound,
  FileJson,
  Network,
  Globe,
} from 'lucide-react';

export const kindIcons: Record<string, typeof Box> = {
  Application: Box,
  PostgresDatabase: Database,
  PostgresSchema: Folder,
  PostgresRole: KeyRound,
  Namespace: Folder,
  Secret: KeyRound,
  Policy: FileJson,
  RuntimePolicy: FileJson,
  BusinessDomain: Network,
  Cluster: Globe,
  Team: Box,
};

export const kindOptions = [
  { value: '', label: 'All Kinds' },
  { value: 'Application', label: 'Application' },
  { value: 'PostgresDatabase', label: 'Postgres Database' },
  { value: 'PostgresSchema', label: 'Postgres Schema' },
  { value: 'PostgresRole', label: 'Postgres Role' },
  { value: 'Namespace', label: 'Namespace' },
  { value: 'Secret', label: 'Secret' },
  { value: 'Policy', label: 'Policy' },
  { value: 'RuntimePolicy', label: 'Runtime Policy' },
  { value: 'BusinessDomain', label: 'Business Domain' },
  { value: 'Cluster', label: 'Cluster' },
  { value: 'Team', label: 'Team' },
];
