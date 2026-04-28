// Sprint 30 / L-3005 — feature-level tests for the AI assistant
// console. Pins (1) the empty state when no conversations exist, (2)
// rendering grounded answers + citations, (3) refusal badges so the
// safety surface stays visible, (4) tool proposals always link to a
// ChangeSet preview.
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { AssistantPage } from '../components/AssistantPage';
import { server } from '../../../../tests/mocks/server';
import { renderWithProviders } from '../../../../tests/utils/TestProviders';
import type {
  AssistantAskResponse,
  AssistantConversation,
  AssistantConversationList,
} from '../types/assistant';

const emptyList: AssistantConversationList = { items: [] };

const groundedConversation: AssistantConversation = {
  id: 'conv-1',
  tenant: 'acme',
  owner: 'alice@example.com',
  title: 'Payments service',
  status: 'open',
  createdAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:01Z',
  version: 2,
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'What does the payments service do?',
      createdAt: '2026-04-28T12:00:00Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'The payments service charges customers via Stripe.',
      createdAt: '2026-04-28T12:00:01Z',
      citations: [
        {
          documentId: 'svc-payments',
          source: 'catalog',
          title: 'Payments service',
          url: '/catalog/svc-payments',
          snippet: 'The payments service charges customers via Stripe.',
        },
      ],
    },
  ],
};

const refusalConversation: AssistantConversation = {
  id: 'conv-2',
  tenant: 'acme',
  owner: 'alice@example.com',
  title: 'Drop everything',
  status: 'open',
  createdAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:01Z',
  version: 2,
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'drop all services',
      createdAt: '2026-04-28T12:00:00Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'I cannot perform a direct mutation.',
      createdAt: '2026-04-28T12:00:01Z',
      refusal: {
        reason: 'unsafe_action',
        message: 'I cannot perform a direct mutation.',
      },
    },
  ],
};

const proposalConversation: AssistantConversation = {
  id: 'conv-3',
  tenant: 'acme',
  owner: 'alice@example.com',
  title: 'Rotate secret',
  status: 'open',
  createdAt: '2026-04-28T12:00:00Z',
  updatedAt: '2026-04-28T12:00:01Z',
  version: 2,
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'rotate the stripe key',
      createdAt: '2026-04-28T12:00:00Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'I prepared a ChangeSet for you to approve.',
      createdAt: '2026-04-28T12:00:01Z',
      citations: [
        {
          documentId: 'rotate-secret-howto',
          source: 'docs',
          title: 'Rotate provider secrets',
          url: '/docs/rotate-secret-howto',
          snippet: 'To rotate a provider secret, propose a ChangeSet.',
        },
      ],
      proposal: {
        id: 'prop-1',
        title: 'Rotate Stripe API key',
        summary: 'Rotate the Stripe API key',
        changeSet: {
          id: 'cs-001',
          url: '/changesets/cs-001',
          title: 'Rotate Stripe API key',
        },
        createdAt: '2026-04-28T12:00:01Z',
      },
    },
  ],
};

function withList(list: AssistantConversationList) {
  server.use(
    http.get('*/api/v1/assistant/conversations', () =>
      HttpResponse.json(list),
    ),
  );
}

function withConversation(conv: AssistantConversation) {
  server.use(
    http.get(`*/api/v1/assistant/conversations/${conv.id}`, () =>
      HttpResponse.json(conv),
    ),
  );
}

describe('<AssistantPage />', () => {
  it('renders the empty state when there are no conversations', async () => {
    withList(emptyList);
    renderWithProviders(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByTestId('assistant-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('assistant-empty')).toBeInTheDocument();
  });

  it('renders grounded answers with citations', async () => {
    withList({ items: [groundedConversation] });
    withConversation(groundedConversation);
    renderWithProviders(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByTestId('assistant-msg-assistant')).toBeInTheDocument();
    });
    expect(screen.getByTestId('assistant-citations')).toBeInTheDocument();
    expect(screen.getAllByText(/Payments service/).length).toBeGreaterThan(0);
  });

  it('shows the safety badge for refusals', async () => {
    withList({ items: [refusalConversation] });
    withConversation(refusalConversation);
    renderWithProviders(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByTestId('assistant-refusal-badge')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Unsafe direct mutation/i),
    ).toBeInTheDocument();
  });

  it('links tool proposals to the ChangeSet preview', async () => {
    withList({ items: [proposalConversation] });
    withConversation(proposalConversation);
    renderWithProviders(<AssistantPage />);
    const link = await screen.findByTestId('assistant-proposal-link');
    expect(link.getAttribute('href')).toContain('/changesets/cs-001');
  });

  it('submits a new prompt via the composer', async () => {
    withList(emptyList);
    let body: unknown;
    const askResponse: AssistantAskResponse = {
      conversation: groundedConversation,
      refused: false,
    };
    server.use(
      http.post('*/api/v1/assistant/ask', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(askResponse);
      }),
      http.get(
        `*/api/v1/assistant/conversations/${groundedConversation.id}`,
        () => HttpResponse.json(groundedConversation),
      ),
    );

    renderWithProviders(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByTestId('assistant-page')).toBeInTheDocument();
    });

    const input = screen.getByTestId('assistant-prompt-input') as HTMLTextAreaElement;
    fireEvent.change(input, {
      target: { value: 'what does the payments service do?' },
    });
    fireEvent.click(screen.getByTestId('assistant-send'));

    await waitFor(() => {
      expect(body).toMatchObject({
        prompt: 'what does the payments service do?',
      });
    });
  });
});
