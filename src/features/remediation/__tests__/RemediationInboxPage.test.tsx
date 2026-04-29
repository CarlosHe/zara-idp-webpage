// Sprint 31 / L-3104 + L-3107 — feature-level tests for the
// remediation inbox. Pins (1) listing renders proposals from the REST
// surface, (2) the approve button is disabled when no ChangeSet is
// attached (no-direct-mutation guard surfaced), (3) approving a
// proposal whose ChangeSet is attached posts to the right endpoint,
// (4) the ChangeSet link routes to the preview page.
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { RemediationInboxPage } from '../components/RemediationInboxPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import type {
  RemediationListResponse,
  RemediationProposal,
} from '../types/remediation';

const baseProposal: RemediationProposal = {
  id: 'rem-1',
  tenant: 'acme',
  title: 'Set service owner — catalog/service/checkout',
  summary: 'Adds owner field',
  source: 'scorecard',
  finding: {
    source: 'scorecard',
    code: 'catalog.add-owner',
    entityKey: 'catalog/service/checkout',
    severity: 'high',
  },
  risk: 'medium',
  owner: { team: 'platform' },
  status: 'pending',
  followups: ['confirm the owning team'],
  impact: { description: '+10 maturity points', coverage: 10 },
  createdAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:00Z',
  history: [{ at: '2026-04-28T12:00:00Z', to: 'pending', actor: 'planner' }],
  version: 1,
};

const proposalWithChangeSet: RemediationProposal = {
  ...baseProposal,
  id: 'rem-2',
  changeSet: {
    id: 'cs-100',
    url: '/changesets/cs-100',
    title: 'Add owner to checkout',
  },
};

function withList(list: RemediationListResponse) {
  server.use(
    http.get('*/api/v1/remediation/proposals', () => HttpResponse.json(list)),
  );
}

describe('<RemediationInboxPage />', () => {
  it('lists proposals from the REST surface', async () => {
    withList({ items: [baseProposal, proposalWithChangeSet] });
    renderWithProviders(<RemediationInboxPage />);
    await waitFor(() => {
      expect(screen.getByTestId('remediation-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('remediation-row-rem-1')).toBeInTheDocument();
    expect(screen.getByTestId('remediation-row-rem-2')).toBeInTheDocument();
  });

  it('disables approval when no ChangeSet is attached', async () => {
    withList({ items: [baseProposal] });
    renderWithProviders(<RemediationInboxPage />);
    const approve = await screen.findByTestId('remediation-approve');
    expect(approve).toBeDisabled();
    expect(screen.getByText(/No ChangeSet attached/i)).toBeInTheDocument();
  });

  it('enables approval and posts to the approve endpoint when a ChangeSet is attached', async () => {
    withList({ items: [proposalWithChangeSet] });
    let posted = false;
    server.use(
      http.post('*/api/v1/remediation/proposals/rem-2/approve', () => {
        posted = true;
        return HttpResponse.json(proposalWithChangeSet);
      }),
    );
    renderWithProviders(<RemediationInboxPage />);
    const approve = await screen.findByTestId('remediation-approve');
    await waitFor(() => expect(approve).not.toBeDisabled());
    fireEvent.click(approve);
    await waitFor(() => expect(posted).toBe(true));
  });

  it('renders the ChangeSet preview link when present', async () => {
    withList({ items: [proposalWithChangeSet] });
    renderWithProviders(<RemediationInboxPage />);
    const link = await screen.findByTestId('remediation-changeset-link');
    expect(link.getAttribute('href')).toContain('cs-100');
  });

  it('rejection requires a reason', async () => {
    withList({ items: [proposalWithChangeSet] });
    renderWithProviders(<RemediationInboxPage />);
    const reject = await screen.findByTestId('remediation-reject');
    expect(reject).toBeDisabled();

    const reason = screen.getByTestId('remediation-reason') as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: 'duplicate' } });
    await waitFor(() => expect(reject).not.toBeDisabled());
  });
});
