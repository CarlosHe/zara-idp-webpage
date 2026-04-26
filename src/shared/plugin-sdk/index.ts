// Sprint-23 / L-2308 — TypeScript SDK for Zara plugins.
//
// The SDK gives plugin authors a typed, framework-neutral surface for:
//   1. Building manifest objects that match the Go contract (the host
//      validates the YAML; this SDK guarantees the typed shape upfront).
//   2. Defining frontend Module Federation slot components with the slot
//      props the host injects (`PluginSlotProps`).
//   3. Wrapping a fetch-style host call so plugin frontends don't need to
//      duplicate the correlation-ID / auth-header dance every call.
//
// The SDK ships as a side-effect-free module — no React imports — so plugin
// authors can use it from any TS framework. The marketplace's
// `<PluginSlotHost>` consumes the same types so the contract is enforced on
// both sides.

export type PluginRuntimeKind = 'grpc' | 'rest' | 'frontend' | 'mixed';

export type PluginSlotKind = 'catalog.tab' | 'resource.tab' | 'dashboard.card' | 'settings.panel';

export interface PluginManifestMetadata {
  name: string;
  version: string;
  displayName: string;
  description?: string;
  vendor?: string;
}

export interface PluginResourceQuotaSpec {
  cpuMilli: number;
  memoryMiB: number;
}

export interface PluginRuntimeSpec {
  kind: PluginRuntimeKind;
  entrypoint: string;
  healthCheckPath?: string;
  timeoutSeconds: number;
  resources: PluginResourceQuotaSpec;
}

export interface PluginGRPCProviderSpec {
  endpoint: string;
  protoPackage?: string;
  service: string;
}

export interface PluginRESTHook {
  name: string;
  method: string;
  path: string;
}

export interface PluginRESTProviderSpec {
  basePath: string;
  hooks: PluginRESTHook[];
}

export interface PluginFrontendProviderSpec {
  remoteEntry: string;
  exposedModule: string;
  route?: string;
  slot: PluginSlotKind;
}

export interface PluginProviderSpec {
  grpc?: PluginGRPCProviderSpec;
  rest?: PluginRESTProviderSpec;
  frontend?: PluginFrontendProviderSpec;
}

export interface PluginResourcePermission {
  kind: string;
  verbs: string[];
}

export interface PluginPermissionSpec {
  scopes: string[];
  outboundHosts?: string[];
  resources?: PluginResourcePermission[];
}

export interface PluginSigningSpec {
  digest: string;
  signatureRef: string;
  sbomRef: string;
}

export interface PluginManifest {
  apiVersion: 'plugin.zara.dev/v1alpha1';
  kind: 'ZaraPlugin';
  metadata: PluginManifestMetadata;
  spec: {
    runtime: PluginRuntimeSpec;
    provider: PluginProviderSpec;
    permissions: PluginPermissionSpec;
    signing: PluginSigningSpec;
    annotations?: Record<string, string>;
  };
}

const KEBAB_NAME = /^[a-z0-9][a-z0-9-]{1,62}$/;

/**
 * BuildManifestInput is the typed shape SDK consumers fill in.
 */
export type BuildManifestInput = Omit<PluginManifest, 'apiVersion' | 'kind'> & {
  apiVersion?: PluginManifest['apiVersion'];
  kind?: PluginManifest['kind'];
};

/**
 * BuildManifest validates and returns a plugin manifest. Throws a typed
 * `PluginManifestError` when the manifest is incomplete — symmetrical to the
 * Go `PluginManifest.Validate` rules so server-side rejections never surprise
 * plugin authors.
 */
export function buildManifest(input: BuildManifestInput): PluginManifest {
  const manifest: PluginManifest = {
    apiVersion: 'plugin.zara.dev/v1alpha1',
    kind: 'ZaraPlugin',
    metadata: input.metadata,
    spec: input.spec,
  };
  validateManifest(manifest);
  return manifest;
}

/**
 * PluginManifestError carries the user-facing reason a manifest was rejected.
 */
export class PluginManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginManifestError';
  }
}

/**
 * validateManifest enforces the same invariants the Go domain enforces.
 */
export function validateManifest(manifest: PluginManifest): void {
  if (manifest.apiVersion !== 'plugin.zara.dev/v1alpha1') {
    throw new PluginManifestError('plugin apiVersion must be plugin.zara.dev/v1alpha1');
  }
  if (manifest.kind !== 'ZaraPlugin') {
    throw new PluginManifestError('plugin kind must be ZaraPlugin');
  }
  const md = manifest.metadata;
  if (!md || !md.name || !KEBAB_NAME.test(md.name)) {
    throw new PluginManifestError('plugin metadata.name must be kebab-case and 2-63 characters');
  }
  if (!md.version) {
    throw new PluginManifestError('plugin metadata.version is required');
  }
  if (!md.displayName) {
    throw new PluginManifestError('plugin metadata.displayName is required');
  }
  const spec = manifest.spec;
  if (!spec || !spec.runtime) {
    throw new PluginManifestError('plugin spec.runtime is required');
  }
  if (!['grpc', 'rest', 'frontend', 'mixed'].includes(spec.runtime.kind)) {
    throw new PluginManifestError('plugin runtime.kind must be grpc, rest, frontend, or mixed');
  }
  if (!spec.runtime.entrypoint) {
    throw new PluginManifestError('plugin runtime.entrypoint is required');
  }
  if (!spec.runtime.timeoutSeconds || spec.runtime.timeoutSeconds < 1 || spec.runtime.timeoutSeconds > 30) {
    throw new PluginManifestError('plugin runtime.timeoutSeconds must be between 1 and 30');
  }
  if (!spec.runtime.resources || spec.runtime.resources.cpuMilli <= 0 || spec.runtime.resources.memoryMiB <= 0) {
    throw new PluginManifestError('plugin runtime.resources must set positive cpu and memory quotas');
  }
  const perms = spec.permissions ?? { scopes: [] };
  if ((!perms.scopes || perms.scopes.length === 0) && (!perms.resources || perms.resources.length === 0)) {
    throw new PluginManifestError('plugin permissions must declare at least one scope or resource grant');
  }
  if (!spec.signing?.digest?.startsWith('sha256:')) {
    throw new PluginManifestError('plugin signing.digest must be a sha256 digest');
  }
  if (!spec.signing.signatureRef) {
    throw new PluginManifestError('plugin signing.signatureRef is required');
  }
  if (!spec.signing.sbomRef) {
    throw new PluginManifestError('plugin signing.sbomRef is required');
  }
  const provider = spec.provider ?? {};
  if ((spec.runtime.kind === 'grpc' || spec.runtime.kind === 'mixed') && (!provider.grpc?.endpoint || !provider.grpc?.service)) {
    throw new PluginManifestError('grpc plugins must declare provider.grpc endpoint and service');
  }
  if ((spec.runtime.kind === 'rest' || spec.runtime.kind === 'mixed') && (!provider.rest?.basePath || !provider.rest?.hooks?.length)) {
    throw new PluginManifestError('rest plugins must declare provider.rest basePath and hooks');
  }
  if (
    (spec.runtime.kind === 'frontend' || spec.runtime.kind === 'mixed') &&
    (!provider.frontend?.remoteEntry || !provider.frontend?.exposedModule || !provider.frontend?.slot)
  ) {
    throw new PluginManifestError('frontend plugins must declare module federation remoteEntry, exposedModule, and slot');
  }
}

/**
 * PluginSlotProps are the props the host injects into the slot component.
 */
export interface PluginSlotProps {
  pluginName: string;
  resourceRef?: string;
  correlationId?: string;
}

/**
 * SlotComponent is the contract the host expects from a frontend plugin.
 * Authors export `default` from their entry module that satisfies this shape.
 */
export type SlotComponent<P extends PluginSlotProps = PluginSlotProps> = (props: P) => unknown;

/**
 * defineSlot is a typed helper to declare the default export.
 */
export function defineSlot<P extends PluginSlotProps>(component: SlotComponent<P>): SlotComponent<P> {
  return component;
}

/**
 * HostFetchOptions carry the metadata the host adds to every plugin → host
 * call. The host's `baseQuery` consumes `X-Correlation-ID` and `X-Plugin`.
 */
export interface HostFetchOptions {
  pluginName: string;
  correlationId?: string;
  signal?: AbortSignal;
}

/**
 * createHostClient returns a typed fetch wrapper that automatically attaches
 * the plugin identifier + correlation id to every host call.
 */
export function createHostClient(baseURL: string, options: HostFetchOptions) {
  if (!options.pluginName) {
    throw new Error('plugin sdk: pluginName is required');
  }
  const headers: Record<string, string> = {
    'X-Plugin': options.pluginName,
  };
  if (options.correlationId) {
    headers['X-Correlation-ID'] = options.correlationId;
  }
  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetch(joinURL(baseURL, path), { method: 'GET', headers, signal: options.signal });
      return parseResponse<T>(res);
    },
    async post<T, B = unknown>(path: string, body: B): Promise<T> {
      const res = await fetch(joinURL(baseURL, path), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal,
      });
      return parseResponse<T>(res);
    },
  };
}

function joinURL(base: string, path: string): string {
  if (!base.endsWith('/') && !path.startsWith('/')) {
    return `${base}/${path}`;
  }
  if (base.endsWith('/') && path.startsWith('/')) {
    return base + path.slice(1);
  }
  return base + path;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`plugin host call failed: ${res.status} ${text}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
