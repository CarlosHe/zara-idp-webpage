import { it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import { ChangeSetDetailPage } from '../components/ChangeSetDetailPage';

it.each([
  { jobStatus: 'FAILED', appliedAt: undefined, execution: 'failed' },
  { jobStatus: 'COMPLETED', appliedAt: undefined, execution: 'applying' },
  { jobStatus: 'COMPLETED', appliedAt: '2026-10-19T12:00:00Z', execution: 'applied' },
])('approval stays separate from actual execution: $execution', async ({ jobStatus, appliedAt, execution }) => {
  server.use(
    http.get('*/api/v1/changesets/cs-live', () => HttpResponse.json({ id: 'cs-live', approvalStatus: 'approved', changes: [], appliedAt })),
    http.get('*/api/v1/changesets/cs-live/jobs', () => HttpResponse.json({ items: [{ id: 'job-live', resourceId: 'resource-live', action: 'CREATE', status: jobStatus, attempts: 3 }] })),
    http.get('*/api/v1/changesets/cs-live/diff', () => HttpResponse.json({})),
  );
  renderWithProviders(<Routes><Route path="/changesets/:id" element={<ChangeSetDetailPage />} /></Routes>, { route: '/changesets/cs-live' });
  expect(await screen.findByLabelText(`Execution: ${execution}`)).toBeInTheDocument();
  expect(screen.getByLabelText('Approval: approved')).toBeInTheDocument();
  if (!appliedAt) expect(screen.queryByLabelText('Execution: applied')).not.toBeInTheDocument();
});
