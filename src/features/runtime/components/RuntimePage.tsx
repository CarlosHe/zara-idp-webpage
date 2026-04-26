import { useMemo, useState } from 'react';
import { Server } from 'lucide-react';
import { PageHeader, LoadingState, ErrorState } from '@/shared/components/feedback';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Select } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import {
  useGetRuntimeInventoryQuery,
  useListRuntimeClustersQuery,
  useListRuntimeDeploysQuery,
} from '../services/runtimeApi';
import type { RuntimeWorkload } from '../types';
import { WorkloadList } from './WorkloadList';
import { PodList } from './PodList';
import { EventList } from './EventList';
import { RuntimeActionsPanel } from './RuntimeActionsPanel';
import { DeployHistory } from './DeployHistory';

// `RuntimePage` is the cluster/workload/pod operational view. It binds
// L-2102's read model (inventory, deploys, logs/events) to L-2104..2106
// governed actions through the RuntimeActionsPanel. The page is aware
// that every mutating action is a proposed ChangeSet — never a direct
// cluster mutation.
export function RuntimePage() {
  const clusters = useListRuntimeClustersQuery();
  const [clusterId, setClusterId] = useState<string>('');

  const activeCluster = clusterId || clusters.data?.[0] || '';
  const inventory = useGetRuntimeInventoryQuery(
    { clusterId: activeCluster },
    { skip: !activeCluster },
  );

  const [namespaceFilter, setNamespaceFilter] = useState<string>('');
  const [selectedWorkload, setSelectedWorkload] = useState<RuntimeWorkload | null>(null);

  const filteredWorkloads = useMemo(() => {
    if (!inventory.data) return [];
    if (!namespaceFilter) return inventory.data.workloads;
    return inventory.data.workloads.filter((w) => w.namespace === namespaceFilter);
  }, [inventory.data, namespaceFilter]);

  const podsForSelected = useMemo(() => {
    if (!inventory.data || !selectedWorkload) return [];
    return inventory.data.pods.filter(
      (p) =>
        p.namespace === selectedWorkload.namespace &&
        p.workload === selectedWorkload.name,
    );
  }, [inventory.data, selectedWorkload]);

  const eventsForSelected = useMemo(() => {
    if (!inventory.data || !selectedWorkload) return [];
    return inventory.data.events.filter(
      (e) => e.namespace === selectedWorkload.namespace && e.involvedId === selectedWorkload.name,
    );
  }, [inventory.data, selectedWorkload]);

  const deploys = useListRuntimeDeploysQuery(
    selectedWorkload
      ? {
          clusterId: selectedWorkload.clusterId,
          namespace: selectedWorkload.namespace,
          workloadName: selectedWorkload.name,
        }
      : { clusterId: '', namespace: '', workloadName: '' },
    { skip: !selectedWorkload },
  );

  if (clusters.isLoading) {
    return <LoadingState message="Loading clusters..." />;
  }

  if (clusters.error) {
    return (
      <ErrorState
        message={errorMessage(clusters.error) || 'Failed to load runtime clusters'}
        onRetry={clusters.refetch}
      />
    );
  }

  if (!clusters.data || clusters.data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={<Server className="h-6 w-6" />}
          iconClassName="text-cyan-400"
          title="Runtime"
          description="Live cluster state and governed runtime actions"
        />
        <EmptyState
          title="No runtime clusters wired"
          description="The control plane is not configured with a runtime adapter yet. Wire one in bootstrap to populate this view."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Server className="h-6 w-6" />}
        iconClassName="text-cyan-400"
        title="Runtime"
        description="Live cluster state and governed runtime actions"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="cluster" className="text-xs uppercase tracking-wide text-slate-400 block">
            Cluster
          </label>
          <Select
            id="cluster"
            value={activeCluster}
            onChange={(e) => {
              setClusterId(e.target.value);
              setNamespaceFilter('');
              setSelectedWorkload(null);
            }}
          >
            {clusters.data.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="namespace" className="text-xs uppercase tracking-wide text-slate-400 block">
            Namespace
          </label>
          <Select
            id="namespace"
            value={namespaceFilter}
            onChange={(e) => {
              setNamespaceFilter(e.target.value);
              setSelectedWorkload(null);
            }}
          >
            <option value="">All namespaces</option>
            {(inventory.data?.namespaces ?? []).map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {inventory.isLoading ? (
        <LoadingState message="Loading runtime inventory..." />
      ) : inventory.error ? (
        <ErrorState
          message={errorMessage(inventory.error) || 'Failed to load inventory'}
          onRetry={inventory.refetch}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <WorkloadList
              workloads={filteredWorkloads}
              selected={selectedWorkload}
              onSelect={setSelectedWorkload}
            />
            <PodList pods={podsForSelected} />
            <EventList events={eventsForSelected} />
          </div>
          <div className="space-y-4">
            {selectedWorkload ? (
              <>
                <RuntimeActionsPanel workload={selectedWorkload} />
                <DeployHistory
                  deploys={deploys.data ?? []}
                  loading={deploys.isLoading}
                />
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Workload details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">
                    Select a workload to view pods, events, deploy history, and propose
                    governed actions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
