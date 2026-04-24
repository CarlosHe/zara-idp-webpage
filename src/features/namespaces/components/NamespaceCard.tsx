import { Pencil, Tag, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, CardContent } from '@/shared/components/ui';
import type { Namespace } from '@/shared/types';
import { getStatusBadgeColor, getTierBadgeColor } from './namespaceStyles';
import { NamespaceQuotaGrid } from './NamespaceQuotaGrid';

interface NamespaceCardProps {
  namespace: Namespace;
  onEdit: (namespace: Namespace) => void;
  onDelete: (namespace: Namespace) => void;
}

export function NamespaceCard({ namespace, onEdit, onDelete }: NamespaceCardProps) {
  return (
    <Card className="hover:border-blue-500/50 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{namespace.name}</h3>
                <Badge className={getTierBadgeColor(namespace.context.tier)}>
                  {namespace.context.tier}
                </Badge>
                <Badge className={getStatusBadgeColor(namespace.status)}>{namespace.status}</Badge>
              </div>
              <p className="text-sm text-slate-400 mb-3">{namespace.description}</p>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {namespace.owner.team}
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  {namespace.context.domain}
                </div>
                {namespace.context.costCenter && (
                  <div>Cost Center: {namespace.context.costCenter}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => onEdit(namespace)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onDelete(namespace)}>
                <Trash2 className="h-3 w-3 text-red-400" />
              </Button>
            </div>
          </div>

          <NamespaceQuotaGrid namespace={namespace} />
        </div>
      </CardContent>
    </Card>
  );
}
