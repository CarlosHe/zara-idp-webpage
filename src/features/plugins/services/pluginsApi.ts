// Sprint-23 / L-2309 — plugin marketplace endpoints.
//
// `listPlugins` returns the marketplace projection (installed plugins with
// status / health / canary / resource quotas) emitted by the new server-side
// `/api/v1/plugins` endpoint shipped in L-2302. `listPluginSlots` keeps the
// Module Federation projection consumed by `<PluginSlotHost>`.
//
// The marketplace UI calls `installPlugin`, `uninstallPlugin`, and
// `probePluginHealth` for the lifecycle actions; the underlying handlers
// gate every mutation through ChangeSets and the policy/risk pipeline.

import { baseApi, unwrapItems } from '@/shared/lib/api';
import type { PluginRecord, PluginSlot } from '../types/plugins';

interface InstallArgs {
  manifest: string;
  artifactDigest?: string;
  allowUnsigned?: boolean;
}

interface InstallResponse {
  plugin: PluginRecord;
  changesetId: string;
}

export const pluginsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPlugins: build.query<PluginRecord[], { includeUninstalled?: boolean } | void>({
      query: (args) => {
        const includeUninstalled = args && args.includeUninstalled ? 'true' : 'false';
        return { url: `/plugins?includeUninstalled=${includeUninstalled}` };
      },
      transformResponse: (raw: unknown) => unwrapItems<PluginRecord>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map((plugin) => ({ type: 'Plugin' as const, id: plugin.name })),
              { type: 'Plugin' as const, id: 'LIST' },
            ]
          : [{ type: 'Plugin' as const, id: 'LIST' }],
    }),
    listPluginSlots: build.query<PluginSlot[], void>({
      query: () => ({ url: '/plugins/slots' }),
      transformResponse: (raw: unknown) => unwrapItems<PluginSlot>(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.map((slot) => ({ type: 'Plugin' as const, id: slot.id })),
              { type: 'Plugin' as const, id: 'SLOTS' },
            ]
          : [{ type: 'Plugin' as const, id: 'SLOTS' }],
    }),
    getPlugin: build.query<PluginRecord, string>({
      query: (name) => ({ url: `/plugins/${name}` }),
      providesTags: (_result, _error, name) => [{ type: 'Plugin' as const, id: name }],
    }),
    installPlugin: build.mutation<InstallResponse, InstallArgs>({
      query: (body) => ({ url: '/plugins/install', method: 'POST', body }),
      invalidatesTags: [{ type: 'Plugin', id: 'LIST' }, { type: 'Plugin', id: 'SLOTS' }],
    }),
    uninstallPlugin: build.mutation<{ changesetId: string }, string>({
      query: (name) => ({ url: `/plugins/${name}/uninstall`, method: 'POST' }),
      invalidatesTags: (_result, _error, name) => [
        { type: 'Plugin' as const, id: name },
        { type: 'Plugin' as const, id: 'LIST' },
        { type: 'Plugin' as const, id: 'SLOTS' },
      ],
    }),
    probePluginHealth: build.mutation<PluginRecord['health'], string>({
      query: (name) => ({ url: `/plugins/${name}/health`, method: 'POST' }),
      invalidatesTags: (_result, _error, name) => [{ type: 'Plugin' as const, id: name }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPluginsQuery,
  useListPluginSlotsQuery,
  useGetPluginQuery,
  useInstallPluginMutation,
  useUninstallPluginMutation,
  useProbePluginHealthMutation,
} = pluginsApi;
