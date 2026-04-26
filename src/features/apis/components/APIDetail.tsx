import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useDiffAPIEntryMutation } from '../services/apisApi';
import type { APIDiffResult, APIEntry, APIVersion } from '../types';

const LIFECYCLE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  experimental: 'warning',
  production: 'success',
  deprecated: 'warning',
  retired: 'danger',
};

export function APIDetail({ entry }: { entry: APIEntry }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>
              {entry.namespace}/{entry.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{entry.type}</Badge>
              <Badge variant={LIFECYCLE_TONE[entry.lifecycle] ?? 'default'}>
                {entry.lifecycle}
              </Badge>
              <Badge variant="outline">{entry.consumersCount} consumers</Badge>
            </div>
          </div>
          {entry.description ? (
            <p className="text-sm text-slate-400 mt-1">{entry.description}</p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Owner" value={entry.owner} />
          <Row label="System" value={entry.system || '—'} />
          {entry.deprecation?.replacementRef ? (
            <Row label="Replacement" value={entry.deprecation.replacementRef} />
          ) : null}
          {entry.deprecation?.sunsetAt ? (
            <Row label="Sunset" value={entry.deprecation.sunsetAt} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versions ({entry.versions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-800">
            {entry.versions.length === 0 ? (
              <li className="text-sm text-slate-400">No versions registered yet.</li>
            ) : (
              entry.versions.map((v) => <VersionRow key={v.semver} v={v} />)
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consumers</CardTitle>
        </CardHeader>
        <CardContent>
          {entry.consumers.length === 0 ? (
            <p className="text-sm text-slate-400">No consumers wired in the catalog.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {entry.consumers.map((c) => (
                <li key={`${c.kind}/${c.namespace}/${c.name}`} className="font-mono">
                  {c.kind}/{c.namespace || '—'}/{c.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DiffPanel entry={entry} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <span className="text-slate-500 uppercase text-xs">{label}</span>
      <span className="text-slate-200 truncate">{value}</span>
    </div>
  );
}

function VersionRow({ v }: { v: APIVersion }) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <Badge variant="outline" className="font-mono">v{v.semver}</Badge>
      <Badge variant={v.status === 'active' ? 'success' : v.status === 'deprecated' ? 'warning' : 'default'}>
        {v.status}
      </Badge>
      <code className="text-xs text-slate-500 truncate" title={v.specDigest}>
        {v.specDigest.slice(0, 12)}…
      </code>
      {v.docSetSlug ? <Badge variant="info">docs: {v.docSetSlug}</Badge> : null}
      {v.publishedAt ? <span className="ml-auto text-slate-400 text-xs">{v.publishedAt}</span> : null}
    </li>
  );
}

// DiffPanel runs the OpenAPI diff against the candidate payload the user
// supplies. The Sprint-20 contract requires the FE to handoff to a
// ChangeSet workflow when the result is BREAKING/RISKY — the panel
// surfaces the typed `requiresApproval` flag so the user knows what
// happens next.
function DiffPanel({ entry }: { entry: APIEntry }) {
  const [semver, setSemver] = useState('');
  const [specDigest, setSpecDigest] = useState('');
  const [specYAML, setSpecYAML] = useState('');
  const [previousYAML, setPreviousYAML] = useState('');
  const [diff, setDiff] = useState<APIDiffResult | null>(null);
  const [diffAPI, { isLoading, error }] = useDiffAPIEntryMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propose new version</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs uppercase text-slate-400">
            Semver
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
              value={semver}
              onChange={(e) => setSemver(e.target.value)}
              placeholder="e.g. 1.1.0"
            />
          </label>
          <label className="text-xs uppercase text-slate-400">
            Spec digest
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100"
              value={specDigest}
              onChange={(e) => setSpecDigest(e.target.value)}
              placeholder="sha256 hex"
            />
          </label>
        </div>
        <label className="block text-xs uppercase text-slate-400">
          Candidate spec (YAML/JSON)
          <textarea
            className="mt-1 w-full h-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono text-slate-100"
            value={specYAML}
            onChange={(e) => setSpecYAML(e.target.value)}
          />
        </label>
        <label className="block text-xs uppercase text-slate-400">
          Previous active spec (optional)
          <textarea
            className="mt-1 w-full h-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-mono text-slate-100"
            value={previousYAML}
            onChange={(e) => setPreviousYAML(e.target.value)}
          />
        </label>
        <Button
          type="button"
          loading={isLoading}
          disabled={!semver || !specDigest}
          onClick={async () => {
            try {
              const result = await diffAPI({
                namespace: entry.namespace,
                name: entry.name,
                semver,
                specDigest,
                specYAML,
                previousSpecYAML: previousYAML,
              }).unwrap();
              setDiff(result);
            } catch {
              setDiff(null);
            }
          }}
        >
          Run diff
        </Button>
        {error ? (
          <p className="text-sm text-red-400">{errorMessage(error) || 'Diff failed'}</p>
        ) : null}
        {diff ? <DiffResultPanel diff={diff} /> : null}
      </CardContent>
    </Card>
  );
}

function DiffResultPanel({ diff }: { diff: APIDiffResult }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950 p-3 text-sm space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={impactTone(diff.impact)}>{diff.impact}</Badge>
        {diff.requiresApproval ? <Badge variant="warning">requires approval</Badge> : null}
        <Badge variant="outline">consumers: {diff.consumerImpact}</Badge>
        {diff.previousSemver ? (
          <span className="text-xs text-slate-400">vs v{diff.previousSemver}</span>
        ) : (
          <span className="text-xs text-slate-400">first published version</span>
        )}
      </div>
      {diff.deltas.length === 0 ? (
        <p className="text-slate-400 text-xs">No structural deltas detected.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {diff.deltas.map((d) => (
            <li key={`${d.path}-${d.summary}`} className="flex items-center gap-2 py-1 text-xs">
              <Badge variant={impactTone(d.impact)}>{d.impact}</Badge>
              <code className="text-amber-300">{d.path}</code>
              <span className="text-slate-300">{d.summary}</span>
            </li>
          ))}
        </ul>
      )}
      {diff.requiresApproval ? (
        <p className="text-xs text-slate-400">
          A reviewer must approve the resulting ChangeSet before this version can be published.
        </p>
      ) : null}
    </div>
  );
}

function impactTone(impact: APIDiffResult['impact']): 'default' | 'success' | 'warning' | 'danger' {
  switch (impact) {
    case 'BREAKING':
      return 'danger';
    case 'RISKY':
      return 'warning';
    case 'COMPATIBLE':
      return 'success';
    default:
      return 'default';
  }
}
