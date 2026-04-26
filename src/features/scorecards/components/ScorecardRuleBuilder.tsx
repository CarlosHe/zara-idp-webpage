import { useState } from 'react';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea, useToast } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useCreateScorecardMutation } from '../services/scorecardsApi';
import type { ScorecardPredicateKind, ScorecardRule, ScorecardSeverity } from '../types';

const PREDICATES: ScorecardPredicateKind[] = [
  'spec.string.present',
  'spec.string.equals',
  'spec.map.not_empty',
  'relationship.exists',
  'relationship.type',
  'metadata.label.present',
  'metadata.annotation.present',
  'spec.lifecycle.atleast',
];

const SEVERITIES: ScorecardSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

interface DraftRule extends ScorecardRule {
  draftId: number;
}

let draftCounter = 0;
const nextDraftId = () => ++draftCounter;

const emptyRule = (): DraftRule => ({
  draftId: nextDraftId(),
  code: '',
  predicate: 'spec.string.present',
  field: '',
  value: '',
  severity: 'medium',
  message: '',
  remediationCode: '',
});

// `ScorecardRuleBuilder` is the L-2205 rule-builder shell. It lets a
// platform engineer compose a scorecard ruleset, name it, declare an
// owner, and submit. Activate-on-create is opt-in; drafts ship without
// blocking gating until they are explicitly activated.
export function ScorecardRuleBuilder() {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [appliesToKinds, setAppliesToKinds] = useState('');
  const [activate, setActivate] = useState(false);
  const [rules, setRules] = useState<DraftRule[]>([emptyRule()]);
  const [createScorecard, { isLoading }] = useCreateScorecardMutation();
  const toast = useToast();

  const updateRule = (draftId: number, patch: Partial<DraftRule>) => {
    setRules((prev) => prev.map((r) => (r.draftId === draftId ? { ...r, ...patch } : r)));
  };
  const addRule = () => setRules((prev) => [...prev, emptyRule()]);
  const removeRule = (draftId: number) =>
    setRules((prev) => prev.filter((r) => r.draftId !== draftId));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const sanitized: ScorecardRule[] = rules.map((rule) => ({
        code: rule.code,
        predicate: rule.predicate,
        severity: rule.severity,
        message: rule.message,
        field: rule.field || undefined,
        value: rule.value || undefined,
        remediationCode: rule.remediationCode || undefined,
      }));
      await createScorecard({
        slug,
        title,
        owner,
        description: description || undefined,
        appliesToKinds: appliesToKinds
          ? appliesToKinds.split(',').map((k) => k.trim()).filter(Boolean)
          : undefined,
        rules: sanitized,
        activate,
      }).unwrap();
      toast.success(`Scorecard "${slug}" created`);
      setSlug('');
      setTitle('');
      setOwner('');
      setDescription('');
      setAppliesToKinds('');
      setRules([emptyRule()]);
      setActivate(false);
    } catch (err) {
      const rtkErr = err as FetchBaseQueryError | SerializedError | undefined;
      toast.error(errorMessage(rtkErr) || 'Failed to create scorecard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} aria-label="scorecard rule builder">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Slug</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="service-readiness"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Title</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Service Readiness"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Owner</span>
              <Input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="team-platform"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Applies to kinds (comma-separated, optional)
              </span>
              <Input
                value={appliesToKinds}
                onChange={(e) => setAppliesToKinds(e.target.value)}
                placeholder="Application,API"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-400">Description</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this scorecard measures"
            />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Rules</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRule}>
                Add rule
              </Button>
            </div>
            <div className="space-y-3 mt-2">
              {rules.map((rule, index) => (
                <fieldset
                  key={rule.draftId}
                  className="border border-slate-700 rounded p-3 space-y-2"
                >
                  <legend className="text-xs uppercase tracking-wide text-slate-400">
                    Rule {index + 1}
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className="block">
                      <span className="text-xs text-slate-400">Code</span>
                      <Input
                        value={rule.code}
                        onChange={(e) => updateRule(rule.draftId, { code: e.target.value })}
                        placeholder="svc.has-owner"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-400">Predicate</span>
                      <Select
                        value={rule.predicate}
                        onChange={(e) =>
                          updateRule(rule.draftId, {
                            predicate: e.target.value as ScorecardPredicateKind,
                          })
                        }
                      >
                        {PREDICATES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-400">Severity</span>
                      <Select
                        value={rule.severity}
                        onChange={(e) =>
                          updateRule(rule.draftId, {
                            severity: e.target.value as ScorecardSeverity,
                          })
                        }
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-xs text-slate-400">Field</span>
                      <Input
                        value={rule.field}
                        onChange={(e) => updateRule(rule.draftId, { field: e.target.value })}
                        placeholder="owner | docs | DocSet"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-400">Value (for equals/atleast)</span>
                      <Input
                        value={rule.value}
                        onChange={(e) => updateRule(rule.draftId, { value: e.target.value })}
                        placeholder="production"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs text-slate-400">Message</span>
                    <Input
                      value={rule.message}
                      onChange={(e) => updateRule(rule.draftId, { message: e.target.value })}
                      placeholder="service must declare an owner"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">Remediation code (optional)</span>
                    <Input
                      value={rule.remediationCode}
                      onChange={(e) =>
                        updateRule(rule.draftId, { remediationCode: e.target.value })
                      }
                      placeholder="catalog.add-owner"
                    />
                  </label>
                  {rules.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRule(rule.draftId)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </fieldset>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={activate}
              onChange={(e) => setActivate(e.target.checked)}
            />
            Activate on create
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={isLoading}>
              Create scorecard
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
