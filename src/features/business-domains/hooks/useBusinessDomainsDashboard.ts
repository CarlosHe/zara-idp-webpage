import { useMemo, useState } from 'react';
import {
  useDeleteBusinessDomainMutation,
  useListBusinessDomainsQuery,
} from '@/features/business-domains/services/businessDomainsApi';
import type { BusinessDomain as DomainType } from '@/features/business-domains/store/businessDomainTypes';
import type { BusinessDomain } from '@/features/business-domains/components/types';

export interface BusinessDomainsDashboardStats {
  totalResources: number;
  totalHealthy: number;
  totalTeams: number;
  tier1Count: number;
}

export interface BusinessDomainsDashboard {
  domains: BusinessDomain[];
  filteredDomains: BusinessDomain[];
  stats: BusinessDomainsDashboardStats;
  loading: boolean;
  error: unknown;
  saving: boolean;
  refetch: () => void;

  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedTier: number | null;
  setSelectedTier: (value: number | null) => void;

  selectedDomain: BusinessDomain | null;
  setSelectedDomain: (domain: BusinessDomain | null) => void;

  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingDomain: BusinessDomain | null;
  setEditingDomain: (domain: BusinessDomain | null) => void;
  deletingDomain: BusinessDomain | null;
  setDeletingDomain: (domain: BusinessDomain | null) => void;

  handleCreate: () => void;
  handleEdit: (domain: BusinessDomain) => void;
  handleDelete: () => Promise<void>;
}

function mapReduxDomains(reduxDomains: DomainType[]): BusinessDomain[] {
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
    dependencies: d.spec?.dependencies?.map((dep) => dep.domain) || [],
    createdAt: d.createdAt || new Date().toISOString(),
  }));
}

export function useBusinessDomainsDashboard(): BusinessDomainsDashboard {
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

  const domains: BusinessDomain[] = useMemo(
    () => mapReduxDomains(reduxDomains as DomainType[]),
    [reduxDomains],
  );

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

  const stats = useMemo<BusinessDomainsDashboardStats>(() => {
    const totalResources = domains.reduce((sum, d) => sum + d.resourceCount, 0);
    const totalHealthy = domains.reduce((sum, d) => sum + d.healthySummary.healthy, 0);
    const totalTeams = new Set(domains.flatMap((d) => d.teams)).size;
    const tier1Count = domains.filter((d) => d.tier === 1).length;

    return { totalResources, totalHealthy, totalTeams, tier1Count };
  }, [domains]);

  const handleCreate = () => {
    setEditingDomain(null);
    setIsFormOpen(true);
  };

  const handleEdit = (domain: BusinessDomain) => {
    setEditingDomain(domain);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingDomain?.id) {
      await deleteDomain(deletingDomain.id).unwrap().catch(() => undefined);
      setDeletingDomain(null);
      if (selectedDomain?.id === deletingDomain.id) {
        setSelectedDomain(null);
      }
    }
  };

  return {
    domains,
    filteredDomains,
    stats,
    loading,
    error,
    saving,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedTier,
    setSelectedTier,
    selectedDomain,
    setSelectedDomain,
    isFormOpen,
    setIsFormOpen,
    editingDomain,
    setEditingDomain,
    deletingDomain,
    setDeletingDomain,
    handleCreate,
    handleEdit,
    handleDelete,
  };
}
