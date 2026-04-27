// Sprint-25 / L-2507 — presentation helpers for the incident console.

import type {
  IncidentEventKind,
  IncidentSeverity,
  IncidentState,
} from '../types/incidents';

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  sev1: 'SEV1',
  sev2: 'SEV2',
  sev3: 'SEV3',
  sev4: 'SEV4',
};

export const SEVERITY_TONE: Record<IncidentSeverity, string> = {
  sev1: 'border-red-500/40 bg-red-500/10 text-red-300',
  sev2: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  sev3: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  sev4: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
};

export const STATE_LABEL: Record<IncidentState, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  mitigated: 'Mitigated',
  resolved: 'Resolved',
};

export const STATE_TONE: Record<IncidentState, string> = {
  open: 'border-red-500/40 bg-red-500/10 text-red-300',
  acknowledged: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  mitigated: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  resolved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

export const EVENT_LABEL: Record<IncidentEventKind, string> = {
  opened: 'Opened',
  acknowledged: 'Acknowledged',
  mitigated: 'Mitigated',
  resolved: 'Resolved',
  note: 'Note',
  changeset: 'ChangeSet',
  telemetry: 'Telemetry',
  runbook: 'Runbook',
};
