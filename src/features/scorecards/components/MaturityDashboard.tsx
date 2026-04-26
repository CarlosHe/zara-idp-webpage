import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Select,
} from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import {
  useEvaluateAllScorecardsMutation,
} from '../services/scorecardsApi';
import type { ScorecardEvaluation } from '../types';
import { severityVariant } from './severityBadge';

const KIND_OPTIONS = ['Application', 'API', 'Resource', 'BusinessDomain', 'Group'];

// `MaturityDashboard` is the L-2206 dashboards UI. It evaluates every
// active scorecard against a single (kind, namespace, name) selection
// and renders the resulting score per scorecard with finding details.
// It depends on the `:evaluateAll` REST endpoint (Sprint-22 / L-2204).
export function MaturityDashboard() {
  const [kind, setKind] = useState('Application');
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');
  const [evaluateAll, { data, isLoading, error, reset }] = useEvaluateAllScorecardsMutation();

  const handleEvaluate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    reset();
    await evaluateAll({ entityKind: kind, namespace, entityName: name });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maturity dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end" onSubmit={handleEvaluate}>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Kind</span>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Namespace</span>
            <Input
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="payments"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="checkout" required />
          </label>
          <Button type="submit" loading={isLoading}>
            Evaluate
          </Button>
        </form>

        <div className="mt-4 space-y-3">
          {error ? (
            <p className="text-sm text-red-400">{errorMessage(error) || 'Evaluation failed'}</p>
          ) : null}
          {data && data.length === 0 ? (
            <EmptyState
              title="No active scorecards target this entity"
              description="Either no scorecards are active yet, or none target this entity's kind."
            />
          ) : null}
          {data?.map((evaluation) => (
            <EvaluationCard key={evaluation.scorecardSlug} evaluation={evaluation} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface EvaluationCardProps {
  evaluation: ScorecardEvaluation;
}

function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const scoreColor = scoreToColor(evaluation.effectiveScore);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{evaluation.scorecardSlug}</CardTitle>
        <span className={`text-2xl font-semibold ${scoreColor}`}>
          {evaluation.effectiveScore}
          <span className="text-xs text-slate-400 ml-1">/100</span>
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400">
          raw score {evaluation.score} · {evaluation.findings.length} findings · {evaluation.blockedFindings} blocking
        </p>
        {evaluation.findings.length === 0 ? (
          <p className="text-sm text-emerald-300 mt-2">All rules pass.</p>
        ) : (
          <ul className="mt-2 space-y-2" data-testid="finding-list">
            {evaluation.findings.map((finding) => (
              <li
                key={finding.code}
                className="flex items-start gap-2 border-l-2 border-slate-700 pl-2"
                data-finding-code={finding.code}
              >
                <Badge variant={severityVariant(finding.severity)}>{finding.severity}</Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-100">{finding.message}</p>
                  <p className="text-xs text-slate-500">
                    {finding.code}
                    {finding.field ? ` · field: ${finding.field}` : ''}
                    {finding.waived ? ' · WAIVED' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function scoreToColor(score: number) {
  if (score >= 90) return 'text-emerald-300';
  if (score >= 70) return 'text-yellow-300';
  if (score >= 40) return 'text-orange-300';
  return 'text-red-300';
}
