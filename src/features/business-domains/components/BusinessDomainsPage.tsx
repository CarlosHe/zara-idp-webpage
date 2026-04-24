import { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Users,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight,
  Globe,
  Database,
  Shield,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  ConfirmModal,
  Alert,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState, StatCard } from '@/shared/components/feedback';
import { cn } from '@/shared/utils';
import {
  useListBusinessDomainsQuery,
  useCreateBusinessDomainMutation,
  useUpdateBusinessDomainMutation,
  useDeleteBusinessDomainMutation,
} from '@/features/business-domains/services/businessDomainsApi';
import type { BusinessDomain as DomainType } from '@/features/business-domains/store/businessDomainTypes';
import { errorMessage } from '@/shared/lib/api';

interface BusinessDomain {
  id: string;
  name: string;
  displayName: string;
  description: string;
  owner: string;
  team: string;
  teams: string[];
  resourceCount: number;
  healthySummary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  tier: 1 | 2 | 3;
  tags: string[];
  dependencies: string[];
  createdAt: string;
}

// Domain Form Modal
interface DomainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: BusinessDomain | null;
}

function DomainFormModal({ isOpen, onClose, domain }: DomainFormModalProps) {
  const [createDomain, createState] = useCreateBusinessDomainMutation();
  const [updateDomain, updateState] = useUpdateBusinessDomainMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const saveError =
    errorMessage(createState.error) || errorMessage(updateState.error) || null;
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    team: '',
  });

  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        displayName: domain.displayName || '',
        description: domain.description || '',
        team: domain.team || domain.owner || '',
      });
    } else {
      setFormData({ name: '', displayName: '', description: '', team: '' });
    }
  }, [domain, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (domain?.id) {
        await updateDomain({
          id: domain.id,
          data: {
            displayName: formData.displayName,
            description: formData.description,
            team: formData.team,
          },
        }).unwrap();
      } else {
        await createDomain({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          team: formData.team,
        }).unwrap();
      }
      onClose();
    } catch {
      // Error surfaces via derived `saveError` above.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={domain ? 'Edit Domain' : 'Create Domain'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {saveError && (
          <Alert type="error" title="Error">
            {saveError}
          </Alert>
        )}
        
        <Input
          id="name"
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="payments"
          required
          disabled={!!domain}
        />
        
        <Input
          id="displayName"
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          placeholder="Payments Domain"
        />

        <Input
          id="description"
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Handles all payment processing"
        />

        <Input
          id="team"
          label="Owner Team"
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          placeholder="payments-team"
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {domain ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BusinessDomainsPage() {
  const {
    data: reduxDomains = [],
    isLoading: loading,
    error,
    refetch,
  } = useListBusinessDomainsQuery();
  const [deleteDomain, deleteState] = useDeleteBusinessDomainMutation();
  const saving = deleteState.isLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<BusinessDomain | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<BusinessDomain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<BusinessDomain | null>(null);

  // Map Redux state to local BusinessDomain interface
  const domains: BusinessDomain[] = useMemo(() => {
    return (reduxDomains || []).map((d: DomainType) => ({
      id: d.id || d.metadata?.name || d.name || '',
      name: d.metadata?.name || d.name || '',
      displayName: d.spec?.displayName || d.displayName || d.metadata?.name || d.name || '',
      description: d.spec?.description || d.description || '',
      owner: d.spec?.ownership?.team || d.team || 'unknown',
      team: d.spec?.ownership?.team || d.team || '',
      teams: [],
      resourceCount: d.status?.resourceCount || 0,
      healthySummary: d.status?.healthSummary || { healthy: 0, degraded: 0, unhealthy: 0 },
      tier: 3 as const,
      tags: d.spec?.tags || [],
      dependencies: d.spec?.dependencies?.map(dep => dep.domain) || [],
      createdAt: d.createdAt || new Date().toISOString(),
    }));
  }, [reduxDomains]);

  const loadDomains = useCallback(() => {
    dispatch(fetchDomains());
  }, [dispatch]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleCreate = () => {
    setEditingDomain(null);
    dispatch(clearSaveError());
    setIsFormOpen(true);
  };

  const handleEdit = (domain: BusinessDomain) => {
    setEditingDomain(domain);
    dispatch(clearSaveError());
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingDomain?.id) {
      await dispatch(deleteDomain(deletingDomain.id));
      setDeletingDomain(null);
      if (selectedDomain?.id === deletingDomain.id) {
        setSelectedDomain(null);
      }
    }
  };

  const filteredDomains = useMemo(() => {
    return domains.filter((domain) => {
      const matchesSearch =
        !searchQuery ||
        domain.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = selectedTier === null || domain.tier === selectedTier;

      return matchesSearch && matchesTier;
    });
  }, [searchQuery, selectedTier, domains]);

  const stats = useMemo(() => {
    const totalResources = domains.reduce((sum, d) => sum + d.resourceCount, 0);
    const totalHealthy = domains.reduce((sum, d) => sum + d.healthySummary.healthy, 0);
    const totalTeams = new Set(domains.flatMap((d) => d.teams)).size;
    const tier1Count = domains.filter((d) => d.tier === 1).length;

    return { totalResources, totalHealthy, totalTeams, tier1Count };
  }, [domains]);

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 2:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 3:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getHealthPercentage = (domain: BusinessDomain) => {
    const total = domain.healthySummary.healthy + domain.healthySummary.degraded + domain.healthySummary.unhealthy;
    return total > 0 ? Math.round((domain.healthySummary.healthy / total) * 100) : 100;
  };

  if (loading) {
    return <LoadingState message="Loading business domains..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDomains} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<Building2 className="h-6 w-6" />}
        iconClassName="text-purple-400"
        title="Business Domains"
        description="Organize and manage resources by business capability"
        onRefresh={loadDomains}
        refreshLabel="Refresh"
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Domain
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-purple-400" />}
          iconBgColor="bg-purple-500/20"
          value={domains.length}
          label="Business Domains"
        />
        <StatCard
          icon={<Boxes className="h-5 w-5 text-blue-400" />}
          iconBgColor="bg-blue-500/20"
          value={stats.totalResources}
          label="Total Resources"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-400" />}
          iconBgColor="bg-emerald-500/20"
          value={stats.totalTeams}
          label="Teams"
        />
        <StatCard
          icon={<Shield className="h-5 w-5 text-red-400" />}
          iconBgColor="bg-red-500/20"
          value={stats.tier1Count}
          label="Tier 1 (Critical)"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search domains by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTier === null ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTier(null)}
          >
            All Tiers
          </Button>
          <Button
            variant={selectedTier === 1 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTier(1)}
          >
            Tier 1
          </Button>
          <Button
            variant={selectedTier === 2 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTier(2)}
          >
            Tier 2
          </Button>
          <Button
            variant={selectedTier === 3 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTier(3)}
          >
            Tier 3
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredDomains.length === 0 ? (
            <DataEmptyState
              icon={<Building2 className="h-8 w-8 text-slate-500" />}
              title="No business domains found"
              description="No domains match your current filters."
            />
          ) : (
            filteredDomains.map((domain) => (
              <div key={domain.id} className="relative" onClick={() => setSelectedDomain(domain)}>
                <Card
                  className={cn(
                    'transition-all cursor-pointer hover:bg-slate-700/50',
                    selectedDomain?.id === domain.id && 'ring-2 ring-purple-500'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{domain.displayName}</h3>
                          <Badge className={getTierColor(domain.tier)}>Tier {domain.tier}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{domain.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {domain.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-6 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {domain.teams.length} teams
                          </span>
                          <span className="flex items-center gap-1">
                            <Boxes className="h-3 w-3" />
                            {domain.resourceCount} resources
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {domain.dependencies.length} dependencies
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'text-lg font-bold',
                              getHealthPercentage(domain) >= 90
                                ? 'text-emerald-400'
                                : getHealthPercentage(domain) >= 70
                                ? 'text-amber-400'
                                : 'text-red-400'
                            )}
                          >
                            {getHealthPercentage(domain)}%
                          </span>
                          <span className="text-xs text-slate-500">health</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {domain.healthySummary.healthy}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {domain.healthySummary.degraded}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-red-400">
                            <XCircle className="h-3 w-3" />
                            {domain.healthySummary.unhealthy}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(domain); }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-colors bg-slate-800/80"
                    title="Edit domain"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingDomain(domain); }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors bg-slate-800/80"
                    title="Delete domain"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Domain Details */}
        <div className="space-y-4">
          {selectedDomain ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    {selectedDomain.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Owner Team</label>
                    <p className="text-white mt-1">{selectedDomain.owner}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Service Level</label>
                    <div className="mt-1">
                      <Badge className={getTierColor(selectedDomain.tier)}>
                        Tier {selectedDomain.tier} - {selectedDomain.tier === 1 ? 'Critical' : selectedDomain.tier === 2 ? 'Important' : 'Standard'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase">Health Overview</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Healthy</span>
                        <span className="text-sm font-medium text-emerald-400">
                          {selectedDomain.healthySummary.healthy}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Degraded</span>
                        <span className="text-sm font-medium text-amber-400">
                          {selectedDomain.healthySummary.degraded}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Unhealthy</span>
                        <span className="text-sm font-medium text-red-400">
                          {selectedDomain.healthySummary.unhealthy}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Teams ({selectedDomain.teams.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDomain.teams.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDomain.teams.map((team) => (
                        <div
                          key={team}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50"
                        >
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-200">{team}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No teams assigned</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dependencies ({selectedDomain.dependencies.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDomain.dependencies.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDomain.dependencies.map((dep) => {
                        const depDomain = domains.find((d) => d.id === dep);
                        return (
                          <button
                            key={dep}
                            onClick={() => {
                              const found = domains.find((d) => d.id === dep);
                              if (found) setSelectedDomain(found);
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                          >
                            <Database className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-slate-200">
                              {depDomain?.displayName || dep}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No dependencies</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a domain to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <DomainFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        domain={editingDomain}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingDomain}
        onClose={() => setDeletingDomain(null)}
        onConfirm={handleDelete}
        title="Delete Business Domain"
        message={`Are you sure you want to delete the domain "${deletingDomain?.displayName || deletingDomain?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
