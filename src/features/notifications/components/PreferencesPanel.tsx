import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import {
  useGetNotificationPreferencesQuery,
  useSaveNotificationPreferencesMutation,
} from '../services/notificationsApi';
import type {
  NotificationChannel,
  NotificationSeverity,
  PreferenceRule,
} from '../types/notifications';
import {
  ALL_CHANNELS,
  CHANNEL_LABEL,
  NOTIFICATION_SOURCES,
  SEVERITY_LABEL,
} from './NotificationUtils';

// Sprint-25 / L-2504 — preference editor. The user can declare per
// (source, minSeverity) channel rules. The save mutation invalidates
// the inbox so the next fan-out picks up the new rules.
export function PreferencesPanel() {
  const { data, isFetching } = useGetNotificationPreferencesQuery();
  const [save, { isLoading: saving }] =
    useSaveNotificationPreferencesMutation();
  // Mirror the server-side `updatedAt` into a tracker so we re-derive
  // local state whenever the backend ships a fresh snapshot — matches
  // the React docs "derived state" pattern (compare prev value during
  // render, then `setState` to reset).
  const [trackedUpdatedAt, setTrackedUpdatedAt] = useState<string | null>(
    null,
  );
  const [rules, setRules] = useState<PreferenceRule[]>(() =>
    data ? (data.rules.length > 0 ? data.rules : defaultRule()) : [],
  );
  if (data && data.updatedAt !== trackedUpdatedAt) {
    setTrackedUpdatedAt(data.updatedAt);
    setRules(data.rules.length > 0 ? data.rules : defaultRule());
  }

  const onAddRule = () => {
    setRules((rs) => [
      ...rs,
      { source: '*', minSeverity: 'info', channels: ['in_app'] },
    ]);
  };

  const onRemove = (index: number) => {
    setRules((rs) => rs.filter((_, i) => i !== index));
  };

  const onUpdate = (index: number, patch: Partial<PreferenceRule>) => {
    setRules((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const onSave = () => {
    if (!data) return;
    void save({ ...data, rules });
  };

  if (isFetching && !data) {
    return null;
  }

  return (
    <Card
      role="region"
      aria-label="Notification preferences"
      data-testid="notification-preferences"
    >
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-slate-400">
          Each rule selects channels for a (source, minimum severity) pair. The
          inbox is always on so the home alert feed stays useful.
        </p>
        <ul className="space-y-3" data-testid="preferences-rules">
          {rules.map((rule, idx) => (
            <li
              key={idx}
              className="rounded-md border border-slate-700/60 bg-slate-800/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="flex items-center gap-1">
                  Source
                  <select
                    value={rule.source}
                    onChange={(e) =>
                      onUpdate(idx, { source: e.target.value })
                    }
                    aria-label={`Rule ${idx + 1} source`}
                    className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
                  >
                    {NOTIFICATION_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  Min severity
                  <select
                    value={rule.minSeverity ?? ''}
                    onChange={(e) =>
                      onUpdate(idx, {
                        minSeverity: (e.target.value ||
                          '') as NotificationSeverity | '',
                      })
                    }
                    aria-label={`Rule ${idx + 1} minimum severity`}
                    className="rounded border border-slate-600 bg-slate-900 px-2 py-1"
                  >
                    <option value="">any</option>
                    {(['info', 'warning', 'critical'] as NotificationSeverity[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {SEVERITY_LABEL[s]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={rule.mute ?? false}
                    onChange={(e) =>
                      onUpdate(idx, { mute: e.target.checked })
                    }
                  />
                  Mute
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRemove(idx)}
                  aria-label={`Remove rule ${idx + 1}`}
                >
                  Remove
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CHANNELS.map((c) => {
                  const enabled = rule.channels.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      aria-pressed={enabled}
                      onClick={() =>
                        onUpdate(idx, {
                          channels: toggleChannel(rule.channels, c),
                        })
                      }
                      className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide transition ${
                        enabled
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-slate-600 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {CHANNEL_LABEL[c]}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onAddRule}
            data-testid="add-preference-rule"
          >
            + Add rule
          </Button>
          <div className="flex items-center gap-2">
            {data?.updatedAt ? (
              <Badge variant="outline" aria-label="Last updated">
                {data.updatedAt}
              </Badge>
            ) : null}
            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              data-testid="save-preferences"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function toggleChannel(
  current: NotificationChannel[],
  channel: NotificationChannel,
): NotificationChannel[] {
  if (current.includes(channel)) {
    return current.filter((c) => c !== channel);
  }
  return [...current, channel];
}

function defaultRule(): PreferenceRule[] {
  return [
    { source: '*', minSeverity: 'info', channels: ['in_app'] },
  ];
}
