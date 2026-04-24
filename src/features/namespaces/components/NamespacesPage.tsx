import { useState, useMemo, useEffect } from 'react';
import {
  FolderTree,
  Users,
  CheckCircle2,
  Search,
  Database,
  HardDrive,
  Plus,
  Pencil,
  Trash2,
  Tag,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  ConfirmModal,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, StatCard, LoadingState } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { fetchNamespaces, createNamespace as createNamespaceAction, updateNamespace as updateNamespaceAction, deleteNamespace as deleteNamespaceAction } from '@/features/namespaces/store/namespacesSlice';
import type { Namespace } from '@/shared/types';

// Namespace Form Modal
interface NamespaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespace?: Namespace | null;
  onSubmit: (data: any) => Promise<void>;
}

function NamespaceFormModal({ isOpen, onClose, namespace, onSubmit }: NamespaceFormModalProps) {
  const [formData, setFormData] = useState({
    id: namespace?.id || '',
    name: namespace?.name || '',
    description: namespace?.description || '',
    ownerTeam: namespace?.owner?.team || '',
    ownerContact: namespace?.owner?.contact || '',
    ownerSlack: namespace?.owner?.slack || '',
    ownerOncall: namespace?.owner?.oncall || '',
    contextDomain: namespace?.context?.domain || '',
    contextTier: namespace?.context?.tier || 'development',
    contextEnvironment: namespace?.context?.environment || '',
    contextCostCenter: namespace?.context?.costCenter || '',
    quotaDatabases: namespace?.quotas?.databases || 10,
    quotaRoles: namespace?.quotas?.roles || 50,
    quotaSchemas: namespace?.quotas?.schemas || 20,
    quotaApplications: namespace?.quotas?.applications || 10,
    quotaSecrets: namespace?.quotas?.secrets || 100,
    quotaStorageGB: namespace?.quotas?.storageGB || 100,
    quotaMaxConnections: namespace?.quotas?.maxConnections || 100,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const namespaceData = {
        name: formData.name,
        description: formData.description,
        owner: {
          team: formData.ownerTeam,
          contact: formData.ownerContact,
          slack: formData.ownerSlack,
          oncall: formData.ownerOncall,
        },
        context: {
          domain: formData.contextDomain,
          tier: formData.contextTier as 'production' | 'staging' | 'development',
          environment: formData.contextEnvironment,
          costCenter: formData.contextCostCenter,
          tags: {},
        },
        quotas: {
          databases: formData.quotaDatabases,
          roles: formData.quotaRoles,
          schemas: formData.quotaSchemas,
          applications: formData.quotaApplications,
          secrets: formData.quotaSecrets,
          storageGB: formData.quotaStorageGB,
          maxConnections: formData.quotaMaxConnections,
        },
      };

      await onSubmit(namespaceData);
      onClose();
    } catch (error) {
      console.error('Error submitting namespace:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={namespace ? 'Edit Namespace' : 'Create Namespace'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="production"
            required
            disabled={!!namespace}
          />
          <p className="text-xs text-slate-400 mt-1">Namespace identifier (immutable after creation)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 min-h-[60px]"
            placeholder="Purpose and usage of this namespace..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Owner Team</label>
            <Input
              value={formData.ownerTeam}
              onChange={(e) => setFormData({ ...formData, ownerTeam: e.target.value })}
              placeholder="Platform Engineering"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Owner Contact</label>
            <Input
              value={formData.ownerContact}
              onChange={(e) => setFormData({ ...formData, ownerContact: e.target.value })}
              placeholder="team@company.com"
              type="email"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Slack Channel</label>
            <Input
              value={formData.ownerSlack}
              onChange={(e) => setFormData({ ...formData, ownerSlack: e.target.value })}
              placeholder="#platform-eng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">On-Call</label>
            <Input
              value={formData.ownerOncall}
              onChange={(e) => setFormData({ ...formData, ownerOncall: e.target.value })}
              placeholder="platform-oncall"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tier</label>
            <select
              value={formData.contextTier}
              onChange={(e) => setFormData({ ...formData, contextTier: e.target.value as 'production' | 'staging' | 'development' })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Environment</label>
            <Input
              value={formData.contextEnvironment}
              onChange={(e) => setFormData({ ...formData, contextEnvironment: e.target.value })}
              placeholder="prod"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Domain</label>
            <Input
              value={formData.contextDomain}
              onChange={(e) => setFormData({ ...formData, contextDomain: e.target.value })}
              placeholder="core"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cost Center</label>
            <Input
              value={formData.contextCostCenter}
              onChange={(e) => setFormData({ ...formData, contextCostCenter: e.target.value })}
              placeholder="CC-001"
            />
          </div>
        </div>

        {/* Quotas */}
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Resource Quotas</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Databases</label>
              <Input
                type="number"
                value={formData.quotaDatabases}
                onChange={(e) => setFormData({ ...formData, quotaDatabases: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Roles</label>
              <Input
                type="number"
                value={formData.quotaRoles}
                onChange={(e) => setFormData({ ...formData, quotaRoles: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Schemas</label>
              <Input
                type="number"
                value={formData.quotaSchemas}
                onChange={(e) => setFormData({ ...formData, quotaSchemas: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Applications</label>
              <Input
                type="number"
                value={formData.quotaApplications}
                onChange={(e) => setFormData({ ...formData, quotaApplications: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Secrets</label>
              <Input
                type="number"
                value={formData.quotaSecrets}
                onChange={(e) => setFormData({ ...formData, quotaSecrets: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Storage (GB)</label>
              <Input
                type="number"
                value={formData.quotaStorageGB}
                onChange={(e) => setFormData({ ...formData, quotaStorageGB: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Connections</label>
              <Input
                type="number"
                value={formData.quotaMaxConnections}
                onChange={(e) => setFormData({ ...formData, quotaMaxConnections: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : namespace ? 'Update Namespace' : 'Create Namespace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Main Page Component
export function NamespacesPage() {
  const dispatch = useAppDispatch();
  const { items: namespaces, loading, error } = useAppSelector((state) => state.namespaces);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<Namespace | null>(null);
  const [deletingNamespace, setDeletingNamespace] = useState<Namespace | null>(null);

  // Fetch namespaces on mount
  useEffect(() => {
    dispatch(fetchNamespaces());
  }, [dispatch]);

  // Filter namespaces
  const filteredNamespaces = useMemo(() => {
    return namespaces.filter((ns) => {
      const matchesSearch =
        ns.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ns.owner.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ns.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = selectedTier === 'all' || ns.context.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [namespaces, searchQuery, selectedTier]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = namespaces.length;
    const active = namespaces.filter((ns) => ns.status === 'active').length;
    const totalDatabases = namespaces.reduce((acc, ns) => acc + (ns.usage?.databases || 0), 0);
    const totalStorage = namespaces.reduce((acc, ns) => acc + (ns.usage?.storageGB || 0), 0);

    return { total, active, totalDatabases, totalStorage };
  }, [namespaces]);

  const handleCreateNamespace = async (data: any) => {
    await dispatch(createNamespaceAction(data));
    setIsCreateModalOpen(false);
  };

  const handleUpdateNamespace = async (data: any) => {
    if (editingNamespace) {
      await dispatch(updateNamespaceAction({ id: editingNamespace.id, data }));
      setEditingNamespace(null);
    }
  };

  const handleDeleteNamespace = async () => {
    if (deletingNamespace) {
      await dispatch(deleteNamespaceAction(deletingNamespace.id));
      setDeletingNamespace(null);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'production':
        return 'bg-red-500/20 text-red-400';
      case 'staging':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'development':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'suspended':
        return 'bg-orange-500/20 text-orange-400';
      case 'archived':
        return 'bg-slate-500/20 text-slate-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getQuotaPercentage = (used: number = 0, quota: number) => {
    return (used / quota) * 100;
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  if (loading) {
    return <LoadingState message="Loading namespaces..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading namespaces: {error}</p>
          <Button onClick={() => dispatch(fetchNamespaces())}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Namespaces"
        description="Manage multi-tenant namespaces with resource quotas and ownership"
        icon={<FolderTree className="h-6 w-6" />}
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Namespace
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Namespaces"
          value={stats.total}
          icon={<FolderTree className="h-4 w-4 text-blue-400" />}
          iconBgColor="bg-blue-500/20"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          iconBgColor="bg-emerald-500/20"
        />
        <StatCard
          label="Total Databases"
          value={stats.totalDatabases}
          icon={<Database className="h-4 w-4 text-purple-400" />}
          iconBgColor="bg-purple-500/20"
        />
        <StatCard
          label="Total Storage"
          value={`${stats.totalStorage} GB`}
          icon={<HardDrive className="h-4 w-4 text-orange-400" />}
          iconBgColor="bg-orange-500/20"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search namespaces by name, team, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="all">All Tiers</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Namespaces Grid */}
      {filteredNamespaces.length === 0 ? (
        <DataEmptyState
          title="No namespaces found"
          description="Create your first namespace to get started with multi-tenancy"
          icon={<FolderTree className="h-12 w-12" />}
          action={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Namespace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNamespaces.map((ns) => (
            <Card key={ns.id} className="hover:border-blue-500/50 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{ns.name}</h3>
                        <Badge className={getTierBadgeColor(ns.context.tier)}>
                          {ns.context.tier}
                        </Badge>
                        <Badge className={getStatusBadgeColor(ns.status)}>
                          {ns.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{ns.description}</p>
                      <div className="flex items-center gap-6 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {ns.owner.team}
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {ns.context.domain}
                        </div>
                        {ns.context.costCenter && (
                          <div>Cost Center: {ns.context.costCenter}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingNamespace(ns)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeletingNamespace(ns)}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Quotas Grid */}
                  {ns.usage && (
                    <div className="grid grid-cols-5 gap-4 pt-4 border-t border-slate-700/50">
                      {/* Databases */}
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Databases</div>
                        <div className={cn('text-sm font-medium', getQuotaColor(getQuotaPercentage(ns.usage.databases, ns.quotas.databases)))}>
                          {ns.usage.databases} / {ns.quotas.databases}
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
                          <div
                            className={cn('h-1 rounded-full', 
                              getQuotaPercentage(ns.usage.databases, ns.quotas.databases) >= 90 ? 'bg-red-500' :
                              getQuotaPercentage(ns.usage.databases, ns.quotas.databases) >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(getQuotaPercentage(ns.usage.databases, ns.quotas.databases), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Roles */}
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Roles</div>
                        <div className={cn('text-sm font-medium', getQuotaColor(getQuotaPercentage(ns.usage.roles, ns.quotas.roles)))}>
                          {ns.usage.roles} / {ns.quotas.roles}
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
                          <div
                            className={cn('h-1 rounded-full',
                              getQuotaPercentage(ns.usage.roles, ns.quotas.roles) >= 90 ? 'bg-red-500' :
                              getQuotaPercentage(ns.usage.roles, ns.quotas.roles) >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(getQuotaPercentage(ns.usage.roles, ns.quotas.roles), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Schemas */}
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Schemas</div>
                        <div className={cn('text-sm font-medium', getQuotaColor(getQuotaPercentage(ns.usage.schemas, ns.quotas.schemas)))}>
                          {ns.usage.schemas} / {ns.quotas.schemas}
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
                          <div
                            className={cn('h-1 rounded-full',
                              getQuotaPercentage(ns.usage.schemas, ns.quotas.schemas) >= 90 ? 'bg-red-500' :
                              getQuotaPercentage(ns.usage.schemas, ns.quotas.schemas) >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(getQuotaPercentage(ns.usage.schemas, ns.quotas.schemas), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Storage */}
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Storage (GB)</div>
                        <div className={cn('text-sm font-medium', getQuotaColor(getQuotaPercentage(ns.usage.storageGB, ns.quotas.storageGB)))}>
                          {ns.usage.storageGB} / {ns.quotas.storageGB}
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
                          <div
                            className={cn('h-1 rounded-full',
                              getQuotaPercentage(ns.usage.storageGB, ns.quotas.storageGB) >= 90 ? 'bg-red-500' :
                              getQuotaPercentage(ns.usage.storageGB, ns.quotas.storageGB) >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(getQuotaPercentage(ns.usage.storageGB, ns.quotas.storageGB), 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Connections */}
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Connections</div>
                        <div className={cn('text-sm font-medium', getQuotaColor(getQuotaPercentage(ns.usage.connections, ns.quotas.maxConnections)))}>
                          {ns.usage.connections} / {ns.quotas.maxConnections}
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
                          <div
                            className={cn('h-1 rounded-full',
                              getQuotaPercentage(ns.usage.connections, ns.quotas.maxConnections) >= 90 ? 'bg-red-500' :
                              getQuotaPercentage(ns.usage.connections, ns.quotas.maxConnections) >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(getQuotaPercentage(ns.usage.connections, ns.quotas.maxConnections), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <NamespaceFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNamespace}
      />

      {editingNamespace && (
        <NamespaceFormModal
          isOpen={true}
          onClose={() => setEditingNamespace(null)}
          namespace={editingNamespace}
          onSubmit={handleUpdateNamespace}
        />
      )}

      {deletingNamespace && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeletingNamespace(null)}
          onConfirm={handleDeleteNamespace}
          title="Delete Namespace"
          message={`Are you sure you want to delete the namespace "${deletingNamespace.name}"? This action cannot be undone and will affect all resources in this namespace.`}
          confirmText="Delete Namespace"
          variant="danger"
        />
      )}
    </div>
  );
}
