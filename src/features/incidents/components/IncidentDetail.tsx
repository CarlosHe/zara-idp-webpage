import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import { LoadingState } from '@/shared/components/feedback';
import {
  useAcknowledgeIncidentMutation,
  useAppendIncidentTimelineMutation,
  useGetIncidentQuery,
  useMitigateIncidentMutation,
  useResolveIncidentMutation,
} from '../services/incidentsApi';
import {
  EVENT_LABEL,
  SEVERITY_TONE,
  STATE_LABEL,
  STATE_TONE,
} from './IncidentUtils';
import type { Incident } from '../types/incidents';

interface IncidentDetailProps {
  id: string;
}

// Sprint-25 / L-2507 — incident timeline + transition surface. Every
// transition routes through the application service; the component
// never mutates anything client-side.
export function IncidentDetail({ id }: IncidentDetailProps) {
  const { data, isFetching } = useGetIncidentQuery(id);
  const [ack] = useAcknowledgeIncidentMutation();
  const [mitigate] = useMitigateIncidentMutation();
  const [resolve] = useResolveIncidentMutation();
  const [appendTimeline, { isLoading: appending }] =
    useAppendIncidentTimelineMutation();
  const [note, setNote] = useState('');
  const [changeSetID, setChangeSetID] = useState('');

  if (isFetching && !data) {
    return <LoadingState message="Loading incident..." />;
  }
  if (!data) {
    return null;
  }
  const inc: Incident = data;

  return (
    <div className="space-y-4" aria-label="Incident detail" data-testid={`incident-detail-${inc.id}`}>
      <Card role="region" aria-label={`Incident ${inc.title}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs uppercase ${SEVERITY_TONE[inc.severity]}`}
            >
              {inc.severity}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${STATE_TONE[inc.state]}`}
            >
              {STATE_LABEL[inc.state]}
            </span>
            <span className="text-base">{inc.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inc.summary ? (
            <p className="text-sm text-slate-300">{inc.summary}</p>
          ) : null}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Source" value={inc.source} />
            <Stat label="Opened" value={inc.openedAt} />
            <Stat label="Acknowledged" value={inc.acknowledgedAt ?? '—'} />
            <Stat label="Mitigated" value={inc.mitigatedAt ?? '—'} />
            <Stat label="Resolved" value={inc.resolvedAt ?? '—'} />
            <Stat
              label="MTTR"
              value={
                inc.mttrSeconds ? formatSeconds(inc.mttrSeconds) : '—'
              }
            />
          </dl>
          {inc.affected.length > 0 ? (
            <section className="mt-3" aria-label="Affected services">
              <h3 className="text-xs uppercase tracking-wide text-slate-400">
                Affected
              </h3>
              <ul className="mt-1 flex flex-wrap gap-2">
                {inc.affected.map((a) => (
                  <li key={a.name}>
                    <Badge variant="outline">
                      {a.name}
                      {a.namespace ? ` (${a.namespace})` : ''}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {inc.runbooks.length > 0 ? (
            <section className="mt-3" aria-label="Runbooks">
              <h3 className="text-xs uppercase tracking-wide text-slate-400">
                Runbooks
              </h3>
              <ul className="mt-1 flex flex-wrap gap-2">
                {inc.runbooks.map((r) => (
                  <li key={r}>
                    <Badge variant="outline">{r}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {inc.linkedChangeSets.length > 0 ? (
            <section className="mt-3" aria-label="Linked ChangeSets">
              <h3 className="text-xs uppercase tracking-wide text-slate-400">
                ChangeSets
              </h3>
              <ul className="mt-1 flex flex-wrap gap-2">
                {inc.linkedChangeSets.map((c) => (
                  <li key={c}>
                    <Badge variant="outline">{c}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {inc.state === 'open' ? (
              <Button
                type="button"
                onClick={() => void ack(inc.id)}
                data-testid="incident-ack"
              >
                Acknowledge
              </Button>
            ) : null}
            {inc.state !== 'mitigated' && inc.state !== 'resolved' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void mitigate({ id: inc.id })}
                data-testid="incident-mitigate"
              >
                Mitigate
              </Button>
            ) : null}
            {inc.state !== 'resolved' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void resolve({ id: inc.id })}
                data-testid="incident-resolve"
              >
                Resolve
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card role="region" aria-label="Timeline">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {inc.timeline.map((e) => (
              <li
                key={e.sequence}
                className="rounded-md border border-slate-700/40 bg-slate-800/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Badge variant="outline">{EVENT_LABEL[e.kind]}</Badge>
                  <span>#{e.sequence}</span>
                  <span className="ml-auto">{e.occurredAt}</span>
                </div>
                <div className="mt-1 text-sm text-slate-100">{e.title}</div>
                {e.message ? (
                  <p className="mt-1 text-xs text-slate-400">{e.message}</p>
                ) : null}
                {e.actor ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    by {e.actor}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (note.trim()) {
                void appendTimeline({
                  id: inc.id,
                  kind: 'note',
                  message: note,
                });
                setNote('');
              }
              if (changeSetID.trim()) {
                void appendTimeline({
                  id: inc.id,
                  kind: 'changeset',
                  references: { changeset: changeSetID },
                });
                setChangeSetID('');
              }
            }}
          >
            <label className="flex flex-col gap-1 text-xs">
              <span>Add note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
                aria-label="Incident note"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Link ChangeSet</span>
              <input
                value={changeSetID}
                onChange={(e) => setChangeSetID(e.target.value)}
                placeholder="cs-128"
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
                aria-label="ChangeSet ID"
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={appending} data-testid="incident-append-timeline">
                {appending ? 'Saving...' : 'Append'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
