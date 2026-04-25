import { useMemo, useState } from 'react';
import { Puzzle } from 'lucide-react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useListPluginSlotsQuery } from '../services/pluginsApi';
import { PluginSlotHost } from './PluginSlotHost';

export function PluginsPage() {
  // Sprint-16 / L-1613: the page is now fed by the real plugin
  // registry endpoint. The previous `demoSlots` constant pointed at
  // `https://plugins.zara.dev/...` URLs that did not exist and would
  // break Module Federation in any environment that did not happen to
  // own that domain.
  const { data: slots, isLoading, isError, error } = useListPluginSlotsQuery();
  const [activeSlotId, setActiveSlotId] = useState('');

  const orderedSlots = useMemo(() => slots ?? [], [slots]);
  const activeSlot = useMemo(
    () => orderedSlots.find((slot) => slot.id === activeSlotId) ?? orderedSlots[0],
    [activeSlotId, orderedSlots],
  );

  return (
    <main className="space-y-6 p-6">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Extensibility</p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Plugin Registry</h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Signed, typed, runtime-pluggable extensions render into Zara slots without sharing the host process.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Dynamic plugin tabs</CardTitle>
          <CardDescription>These slots come from the plugin registry manifest contract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <LoadingState message="Loading plugin registry..." />
          ) : isError ? (
            <DataEmptyState
              icon={<Puzzle className="h-12 w-12 text-slate-400" aria-hidden="true" />}
              title="Plugin registry unavailable"
              description={errorMessage(error)}
            />
          ) : orderedSlots.length === 0 ? (
            <DataEmptyState
              icon={<Puzzle className="h-12 w-12 text-slate-400" aria-hidden="true" />}
              title="No plugins installed"
              description="Install a signed plugin via zaractl to surface its slots in this registry."
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plugin slots">
                {orderedSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    role="tab"
                    aria-selected={slot.id === (activeSlot?.id ?? '')}
                    onClick={() => setActiveSlotId(slot.id)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-700 aria-selected:border-primary-600 aria-selected:bg-primary-600 aria-selected:text-white dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-400"
                  >
                    {slot.title}
                  </button>
                ))}
              </div>

              {activeSlot ? (
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{activeSlot.slot}</Badge>
                    <Badge variant="outline">{activeSlot.exposedModule}</Badge>
                  </div>
                  <PluginSlotHost slots={orderedSlots} activeSlotId={activeSlot.id} resourceRef="catalog/default/api" />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
