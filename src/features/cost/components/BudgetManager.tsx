import { useState } from 'react';
import { Alert, Button, Input, Modal, Select } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/api';
import { useDeleteCostBudgetMutation, useListCostBudgetsQuery, useUpsertCostBudgetMutation } from '../services/costApi';
import type { BudgetUpsertRequest, CostBudget } from '../types/cost';

export function BudgetManager({ onClose }: { onClose: () => void }) {
  const list = useListCostBudgetsQuery();
  const [save, saving] = useUpsertCostBudgetMutation();
  const [remove, removing] = useDeleteCostBudgetMutation();
  const [id, setID] = useState('');
  const [name, setName] = useState('');
  const [cap, setCap] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [team, setTeam] = useState('');
  const [period, setPeriod] = useState<BudgetUpsertRequest['period']>('monthly');
  const [threshold, setThreshold] = useState('80');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState<CostBudget | null>(null);
  function edit(budget: CostBudget) {
    setID(budget.id); setName(budget.name); setCap(String(budget.cap.minorUnits / 100));
    setCurrency(budget.cap.currency); setTeam(budget.scope.team ?? ''); setPeriod(budget.period);
    setThreshold(String(budget.warnThresholdBP / 100)); setMessage('');
  }
  return <Modal isOpen onClose={onClose} title="Manage budgets">
    {(list.error || saving.error || removing.error) && <Alert type="error">{errorMessage(list.error || saving.error || removing.error)}</Alert>}
    {list.isError && <Button onClick={() => void list.refetch()}>Retry budgets</Button>}
    {message && <p role="status">{message}</p>}
    <ul className="space-y-2 my-4">{(list.data?.budgets ?? []).map((budget) => <li key={budget.id} className="flex justify-between gap-2" data-testid={`budget-record-${budget.id}`}>
      <span>{budget.name}</span><div className="flex gap-2"><Button size="sm" onClick={() => edit(budget)}>Edit {budget.name}</Button><Button size="sm" variant="danger" onClick={() => setDeleting(budget)}>Delete {budget.name}</Button></div>
    </li>)}</ul>
    {deleting && <div role="group" aria-label="Confirm budget deletion" className="my-4 space-y-2">
      <p>Delete budget {deleting.name}?</p>
      <Button variant="danger" disabled={removing.isLoading} onClick={async () => {
        try { await remove(deleting.id).unwrap(); if (id === deleting.id) { setID(''); setName(''); } setDeleting(null); setMessage('Budget deleted'); }
        catch { /* Preserve the selection for retry. */ }
      }}>Confirm delete budget</Button><Button variant="secondary" onClick={() => setDeleting(null)}>Cancel deletion</Button>
    </div>}
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      const existing = list.data?.budgets.find((budget) => budget.id === id);
      try {
        await save({ id: id || crypto.randomUUID(), name, scope: { ...existing?.scope, team: team.trim() || undefined }, period,
          capMinorUnits: Math.round(Number(cap) * 100), currency, warnThresholdBP: Math.round(Number(threshold) * 100) }).unwrap();
        setID(''); setName(''); setMessage('Budget saved');
      } catch { /* Preserve draft on failure. */ }
    }}>
      <p>{id ? 'Edit budget' : 'New budget'}</p>
      <Input label="Budget name" required value={name} onChange={(event) => setName(event.target.value)} />
      <Input label="Budget amount" type="number" min="0.01" step="0.01" required value={cap} onChange={(event) => setCap(event.target.value)} />
      <Input label="Currency" pattern="[A-Z]{3}" required value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
      <Input label="Budget team" value={team} onChange={(event) => setTeam(event.target.value)} />
      <Select label="Budget period" value={period} onChange={(event) => setPeriod(event.target.value as BudgetUpsertRequest['period'])}>
        <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
      </Select>
      <Input label="Warn at percentage" type="number" min="1" max="100" required value={threshold} onChange={(event) => setThreshold(event.target.value)} />
      <Button type="submit" disabled={list.isLoading || list.isError} loading={saving.isLoading}>Save budget</Button>
      {id && <Button type="button" variant="secondary" onClick={() => { setID(''); setName(''); }}>New budget</Button>}
    </form>
  </Modal>;
}
