import { describe, expect, it, vi } from 'vitest';
import {
  buildManifest,
  createHostClient,
  defineSlot,
  PluginManifestError,
  validateManifest,
  type PluginManifest,
} from '../index';

const validInput = {
  metadata: {
    name: 'plugin-x',
    version: '1.0.0',
    displayName: 'Plugin X',
  },
  spec: {
    runtime: {
      kind: 'frontend' as const,
      entrypoint: '/plugins/plugin-x',
      timeoutSeconds: 5,
      resources: { cpuMilli: 100, memoryMiB: 128 },
    },
    provider: {
      frontend: {
        remoteEntry: 'https://example.com/remoteEntry.js',
        exposedModule: './X',
        slot: 'catalog.tab' as const,
      },
    },
    permissions: { scopes: ['catalog.read'] },
    signing: {
      digest: 'sha256:abc',
      signatureRef: 'oci://x.sig',
      sbomRef: 'oci://x.sbom',
    },
  },
};

describe('buildManifest', () => {
  it('returns the validated manifest with apiVersion and kind injected', () => {
    const manifest = buildManifest(validInput);
    expect(manifest.apiVersion).toBe('plugin.zara.dev/v1alpha1');
    expect(manifest.kind).toBe('ZaraPlugin');
    expect(manifest.metadata.name).toBe('plugin-x');
  });

  it('throws PluginManifestError for an invalid name', () => {
    expect(() =>
      buildManifest({ ...validInput, metadata: { ...validInput.metadata, name: 'X-Invalid' } }),
    ).toThrow(PluginManifestError);
  });

  it('throws when timeoutSeconds is out of range', () => {
    expect(() =>
      buildManifest({
        ...validInput,
        spec: { ...validInput.spec, runtime: { ...validInput.spec.runtime, timeoutSeconds: 100 } },
      }),
    ).toThrow(PluginManifestError);
  });

  it('throws when frontend kind is missing remoteEntry', () => {
    expect(() =>
      buildManifest({
        ...validInput,
        spec: {
          ...validInput.spec,
          provider: {
            frontend: { remoteEntry: '', exposedModule: './X', slot: 'catalog.tab' as const },
          },
        },
      }),
    ).toThrow(PluginManifestError);
  });

  it('throws when grpc plugin lacks endpoint', () => {
    expect(() =>
      buildManifest({
        ...validInput,
        spec: {
          ...validInput.spec,
          runtime: { ...validInput.spec.runtime, kind: 'grpc' as const },
          provider: {},
        },
      }),
    ).toThrow(PluginManifestError);
  });

  it('throws when sbomRef is missing', () => {
    expect(() =>
      buildManifest({
        ...validInput,
        spec: {
          ...validInput.spec,
          signing: { ...validInput.spec.signing, sbomRef: '' },
        },
      }),
    ).toThrow(PluginManifestError);
  });
});

describe('validateManifest', () => {
  it('rejects manifests with no scopes and no resource grants', () => {
    const m = buildManifest(validInput);
    const broken: PluginManifest = {
      ...m,
      spec: { ...m.spec, permissions: { scopes: [] } },
    };
    expect(() => validateManifest(broken)).toThrow(PluginManifestError);
  });
});

describe('defineSlot', () => {
  it('returns the same component reference (typed helper)', () => {
    const component = (props: { pluginName: string }) => `hello ${props.pluginName}`;
    const slot = defineSlot(component);
    expect(slot({ pluginName: 'p1' })).toBe('hello p1');
  });
});

describe('createHostClient', () => {
  beforeEach(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn();
  });

  it('attaches the X-Plugin header to every request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    const client = createHostClient('https://api.example/api/v1', { pluginName: 'p1', correlationId: 'corr-1' });
    await client.get<{ ok: boolean }>('/catalog');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({ 'X-Plugin': 'p1', 'X-Correlation-ID': 'corr-1' });
  });

  it('serialises POST bodies as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    const client = createHostClient('https://api.example/api/v1/', { pluginName: 'p1' });
    await client.post('/catalog', { name: 'x' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'x' });
  });

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }));
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    const client = createHostClient('https://api.example/api/v1', { pluginName: 'p1' });
    await expect(client.get('/catalog')).rejects.toThrow('plugin host call failed: 500 boom');
  });

  it('rejects without a pluginName', () => {
    expect(() => createHostClient('https://api.example', { pluginName: '' })).toThrow();
  });
});
