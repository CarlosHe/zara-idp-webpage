import { Building2, Plus } from 'lucide-react';
import { Button, ConfirmModal } from '@/shared/components/ui';
import { ErrorState, LoadingState, PageHeader } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useBusinessDomainsDashboard } from '@/features/business-domains/hooks/useBusinessDomainsDashboard';
import { BusinessDomainDetailPanel } from './BusinessDomainDetailPanel';
import { BusinessDomainFormModal } from './BusinessDomainFormModal';
import { BusinessDomainListView } from './BusinessDomainListView';
import { BusinessDomainsStats } from './BusinessDomainsStats';

export function BusinessDomainsPage() {
  const dashboard = useBusinessDomainsDashboard();

  if (dashboard.loading) {
    return <LoadingState message="Loading business domains..." />;
  }

  if (dashboard.error) {
    return (
      <ErrorState
        message={errorMessage(dashboard.error) || 'Failed to load domains'}
        onRetry={dashboard.refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Building2 className="h-6 w-6" />}
        iconClassName="text-purple-400"
        title="Business Domains"
        description="Organize and manage resources by business capability"
        onRefresh={dashboard.refetch}
        refreshLabel="Refresh"
        actions={
          <Button size="sm" onClick={dashboard.handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Domain
          </Button>
        }
      />

      <BusinessDomainsStats domainCount={dashboard.domains.length} stats={dashboard.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BusinessDomainListView
            domains={dashboard.filteredDomains}
            searchQuery={dashboard.searchQuery}
            onSearchChange={dashboard.setSearchQuery}
            selectedTier={dashboard.selectedTier}
            onTierChange={dashboard.setSelectedTier}
            selectedDomain={dashboard.selectedDomain}
            onSelect={dashboard.setSelectedDomain}
            onEdit={dashboard.handleEdit}
            onDelete={dashboard.setDeletingDomain}
          />
        </div>

        <div className="space-y-4">
          <BusinessDomainDetailPanel
            domain={dashboard.selectedDomain}
            domains={dashboard.domains}
            onSelect={dashboard.setSelectedDomain}
          />
        </div>
      </div>

      {/* Form Modal — re-keyed on domain change so it remounts with a
          fresh form state instead of syncing via useEffect. */}
      <BusinessDomainFormModal
        key={dashboard.editingDomain?.id ?? 'new'}
        isOpen={dashboard.isFormOpen}
        onClose={() => dashboard.setIsFormOpen(false)}
        domain={dashboard.editingDomain}
      />

      <ConfirmModal
        isOpen={!!dashboard.deletingDomain}
        onClose={() => dashboard.setDeletingDomain(null)}
        onConfirm={dashboard.handleDelete}
        title="Delete Business Domain"
        message={`Are you sure you want to delete the domain "${
          dashboard.deletingDomain?.displayName || dashboard.deletingDomain?.name
        }"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={dashboard.saving}
      />
    </div>
  );
}
