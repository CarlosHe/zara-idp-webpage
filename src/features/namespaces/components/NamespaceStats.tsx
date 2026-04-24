import { CheckCircle2, Database, FolderTree, HardDrive } from 'lucide-react';
import { StatCard } from '@/shared/components/feedback';

interface NamespaceStatsProps {
  total: number;
  active: number;
  totalDatabases: number;
  totalStorage: number;
}

export function NamespaceStats({
  total,
  active,
  totalDatabases,
  totalStorage,
}: NamespaceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        label="Total Namespaces"
        value={total}
        icon={<FolderTree className="h-4 w-4 text-blue-400" />}
        iconBgColor="bg-blue-500/20"
      />
      <StatCard
        label="Active"
        value={active}
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        iconBgColor="bg-emerald-500/20"
      />
      <StatCard
        label="Total Databases"
        value={totalDatabases}
        icon={<Database className="h-4 w-4 text-purple-400" />}
        iconBgColor="bg-purple-500/20"
      />
      <StatCard
        label="Total Storage"
        value={`${totalStorage} GB`}
        icon={<HardDrive className="h-4 w-4 text-orange-400" />}
        iconBgColor="bg-orange-500/20"
      />
    </div>
  );
}
