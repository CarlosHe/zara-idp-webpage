import { useMemo, useState } from 'react';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui';
import { PluginSlotHost } from './PluginSlotHost';
import type { PluginSlot } from '../types/plugins';

const demoSlots: PluginSlot[] = [
  {
    id: 'github-catalog-tab',
    pluginName: 'plugin-github',
    title: 'GitHub Catalog',
    slot: 'catalog.tab',
    remoteEntry: 'https://plugins.zara.dev/github/remoteEntry.js',
    exposedModule: './PluginTab',
    route: '/plugins/github',
  },
  {
    id: 'pagerduty-dashboard-card',
    pluginName: 'plugin-pagerduty',
    title: 'PagerDuty Incidents',
    slot: 'dashboard.card',
    remoteEntry: 'https://plugins.zara.dev/pagerduty/remoteEntry.js',
    exposedModule: './DashboardCard',
    route: '/plugins/pagerduty',
  },
  {
    id: 'opslevel-migrator-tab',
    pluginName: 'plugin-opslevel-migrator',
    title: 'OpsLevel Migrator',
    slot: 'settings.panel',
    remoteEntry: 'https://plugins.zara.dev/opslevel/remoteEntry.js',
    exposedModule: './MigratorPanel',
    route: '/plugins/opslevel-migrator',
  },
];

export function PluginsPage() {
  const [activeSlotId, setActiveSlotId] = useState(demoSlots[0]?.id ?? '');
  const activeSlot = useMemo(
    () => demoSlots.find((slot) => slot.id === activeSlotId) ?? demoSlots[0],
    [activeSlotId],
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
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Plugin slots">
            {demoSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                role="tab"
                aria-selected={slot.id === activeSlotId}
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
              <PluginSlotHost slots={demoSlots} activeSlotId={activeSlot.id} resourceRef="catalog/default/api" />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
