import type { Namespace } from '@/shared/types';
import { NamespaceQuotaBar } from './NamespaceQuotaBar';

interface NamespaceQuotaGridProps {
  namespace: Namespace;
}

export function NamespaceQuotaGrid({ namespace }: NamespaceQuotaGridProps) {
  if (!namespace.usage) return null;

  const { usage, quotas } = namespace;

  return (
    <div className="grid grid-cols-5 gap-4 pt-4 border-t border-slate-700/50">
      <NamespaceQuotaBar label="Databases" used={usage.databases} quota={quotas.databases} />
      <NamespaceQuotaBar label="Roles" used={usage.roles} quota={quotas.roles} />
      <NamespaceQuotaBar label="Schemas" used={usage.schemas} quota={quotas.schemas} />
      <NamespaceQuotaBar label="Storage (GB)" used={usage.storageGB} quota={quotas.storageGB} />
      <NamespaceQuotaBar
        label="Connections"
        used={usage.connections}
        quota={quotas.maxConnections}
      />
    </div>
  );
}
