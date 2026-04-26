import { useEffect, useState } from 'react';
import { Badge, Button } from '@/shared/components/ui';
import type { TechDoc } from '../types';

// OpenAPIViewer is the Sprint-20 / L-2005 rich viewer. It does the
// minimum the contract calls for without pulling Redoc into the
// critical-path bundle: shows a version selector, an owner badge, and a
// per-tag operation list with method colour chips. The raw spec is
// fetched lazily when the user clicks "View raw spec" so the heavy
// payload stays out of the initial render.
export function OpenAPIViewer({ doc }: { doc: TechDoc }) {
  const [tab, setTab] = useState<'paths' | 'raw'>('paths');
  const path = doc.openApiPath ?? '';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>OpenAPI</Badge>
        {doc.owner ? <Badge variant="info">{doc.owner}</Badge> : null}
        {doc.version ? <Badge variant="outline">v{doc.version}</Badge> : null}
        {doc.openApiPath ? <code className="text-xs text-amber-300">{path}</code> : null}
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant={tab === 'paths' ? 'primary' : 'secondary'}
            onClick={() => setTab('paths')}
            aria-label="Show paths"
          >
            Paths
          </Button>
          <Button
            type="button"
            variant={tab === 'raw' ? 'primary' : 'secondary'}
            onClick={() => setTab('raw')}
            aria-label="View raw spec"
          >
            Raw
          </Button>
        </div>
      </div>
      {tab === 'paths' ? <PathsPanel path={path} /> : <RawPanel path={path} />}
    </div>
  );
}

interface SpecOperation {
  path: string;
  method: string;
  summary?: string;
  tag?: string;
}

function PathsPanel({ path }: { path: string }) {
  const ops = useSpecOperations(path);
  if (ops === null) {
    return <p className="text-sm text-slate-400">Loading operations…</p>;
  }
  if (ops.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-4 text-sm text-slate-400">
        No operations parsed. Inspect the raw spec for details.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-800 rounded-lg border border-slate-700/60 bg-slate-950">
      {ops.map((op) => (
        <li key={`${op.method}-${op.path}`} className="flex items-center gap-3 px-3 py-2 text-sm">
          <Badge variant="outline" className="uppercase">{op.method}</Badge>
          <code className="font-mono text-slate-200">{op.path}</code>
          {op.summary ? <span className="text-slate-400 truncate">{op.summary}</span> : null}
          {op.tag ? <Badge variant="info" className="ml-auto">{op.tag}</Badge> : null}
        </li>
      ))}
    </ul>
  );
}

function RawPanel({ path }: { path: string }) {
  const [body, setBody] = useState<string | null>(() => (path ? null : ''));
  useEffect(() => {
    if (!path) return undefined;
    let mounted = true;
    fetch(path)
      .then((r) => r.text())
      .then((text) => {
        if (mounted) setBody(text);
      })
      .catch(() => {
        if (mounted) setBody('Failed to load OpenAPI spec.');
      });
    return () => {
      mounted = false;
    };
  }, [path]);
  if (body === null) return <p className="text-sm text-slate-400">Fetching {path}…</p>;
  return (
    <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-200 whitespace-pre-wrap">
      {body}
    </pre>
  );
}

// useSpecOperations is a tiny hook that fetches the spec at `path`,
// parses it as YAML or JSON via a minimal pass-through, and projects
// the (path, method) tuples for the operations list. The parser is
// intentionally restricted to JSON for now because pulling a YAML
// dependency would inflate the bundle; the backend's openapi.yaml
// endpoint also serves application/json by default.
function useSpecOperations(path: string): SpecOperation[] | null {
  const [ops, setOps] = useState<SpecOperation[] | null>(() => (path ? null : []));
  useEffect(() => {
    if (!path) return undefined;
    let mounted = true;
    fetch(path, { headers: { Accept: 'application/json,application/yaml;q=0.5' } })
      .then((r) => r.text())
      .then((text) => {
        if (!mounted) return;
        const parsed = tryParseSpec(text);
        if (!parsed) {
          setOps([]);
          return;
        }
        const out: SpecOperation[] = [];
        const paths = parsed['paths'];
        if (paths && typeof paths === 'object') {
          for (const [p, val] of Object.entries(paths as Record<string, unknown>)) {
            if (!val || typeof val !== 'object') continue;
            for (const m of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']) {
              const op = (val as Record<string, unknown>)[m];
              if (!op || typeof op !== 'object') continue;
              const opObj = op as { summary?: string; tags?: string[] };
              out.push({
                path: p,
                method: m,
                summary: opObj.summary,
                tag: opObj.tags?.[0],
              });
            }
          }
        }
        out.sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)));
        setOps(out);
      })
      .catch(() => {
        if (mounted) setOps([]);
      });
    return () => {
      mounted = false;
    };
  }, [path]);
  return ops;
}

// tryParseSpec accepts JSON only for now; for YAML the page falls back
// to "no operations parsed" so the user can still hit the Raw tab.
function tryParseSpec(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const trimmed = text.trimStart();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}
