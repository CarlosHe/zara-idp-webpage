import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ShieldAlert, ExternalLink, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import {
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import {
  useAskAssistantMutation,
  useGetAssistantConversationQuery,
  useListAssistantConversationsQuery,
} from '../services/assistantApi';
import type {
  AssistantConversation,
  AssistantMessage,
  AssistantRefusalReason,
} from '../types/assistant';

// Sprint 30 / L-3005 — AI assistant console.
//
// The page is a thin shell over the REST surface:
//   - left rail lists the principal's conversations (newest-first),
//   - main pane renders the active conversation,
//   - the composer submits a turn with optional ChangeSet intent.
//
// The assistant NEVER surfaces a direct mutation: every action
// proposal links to the corresponding ChangeSet preview/approval
// route. Refusals show the canonical reason badge so users learn the
// system's safety boundaries.
const REFUSAL_TONE: Record<AssistantRefusalReason, string> = {
  rate_limited:
    'border-amber-400 bg-amber-500/20 text-amber-200',
  prompt_injection:
    'border-red-400 bg-red-500/20 text-red-200',
  insufficient_context:
    'border-slate-400 bg-slate-700/40 text-slate-200',
  out_of_scope:
    'border-purple-400 bg-purple-500/20 text-purple-200',
  unsafe_action:
    'border-rose-400 bg-rose-500/20 text-rose-200',
};

const REFUSAL_LABEL: Record<AssistantRefusalReason, string> = {
  rate_limited: 'Rate limited',
  prompt_injection: 'Prompt injection blocked',
  insufficient_context: 'Insufficient context',
  out_of_scope: 'Out of scope',
  unsafe_action: 'Unsafe direct mutation',
};

export function AssistantPage() {
  const {
    data: list,
    isFetching: isFetchingList,
    error: listError,
    refetch: refetchList,
  } = useListAssistantConversationsQuery();

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState('');
  const [askAssistant, askState] = useAskAssistantMutation();

  const items = useMemo<AssistantConversation[]>(
    () => list?.items ?? [],
    [list],
  );

  // Resolve the active conversation from a derived value so React
  // doesn't re-render twice when the list refreshes. Explicit user
  // selection always wins; otherwise we follow the most recent item.
  const activeId = selectedId ?? items[0]?.id;

  const {
    data: active,
    isFetching: isFetchingActive,
  } = useGetAssistantConversationQuery(activeId ?? '', {
    skip: !activeId,
  });

  const messages: AssistantMessage[] = active?.messages ?? [];
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = lastMessageRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [active?.id, messages.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    try {
      const result = await askAssistant({
        conversationId: activeId,
        prompt: prompt.trim(),
      }).unwrap();
      setSelectedId(result.conversation.id);
      setPrompt('');
    } catch {
      // RTK error surface — handled inline below.
    }
  };

  if (isFetchingList && !list) {
    return <LoadingState message="Loading assistant..." />;
  }
  if (listError && !list) {
    return (
      <ErrorState
        message={errorMessage(listError) || 'Failed to load assistant'}
        onRetry={refetchList}
      />
    );
  }

  return (
    <div
      className="space-y-4 animate-fade-in"
      aria-label="AI assistant"
      data-testid="assistant-page"
    >
      <PageHeader
        icon={<Sparkles className="h-6 w-6" />}
        iconClassName="text-fuchsia-400"
        title="AI Assistant"
        description="Permission-filtered, grounded answers and safe action proposals — never direct mutations."
        onRefresh={refetchList}
      />

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Card data-testid="assistant-conversation-list">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {items.length === 0 && (
              <p className="text-sm text-slate-400">
                No conversations yet. Ask a question to get started.
              </p>
            )}
            {items.map((conv) => (
              <button
                key={conv.id}
                type="button"
                className={[
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                  conv.id === activeId
                    ? 'border-fuchsia-500 bg-fuchsia-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-500',
                ].join(' ')}
                onClick={() => setSelectedId(conv.id)}
                data-testid={`assistant-conv-${conv.id}`}
              >
                <p className="truncate font-medium text-slate-100">
                  {conv.title}
                </p>
                <p className="text-xs text-slate-400">
                  {conv.messages.length} turn{conv.messages.length === 1 ? '' : 's'}
                  {' · '}
                  {conv.status}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="assistant-conversation-detail">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{active?.title ?? 'New conversation'}</span>
              {active && (
                <Badge variant="outline" className="text-xs">
                  v{active.version}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!active && !isFetchingActive && messages.length === 0 && (
              <p
                className="rounded border border-dashed border-slate-700 p-4 text-sm text-slate-400"
                data-testid="assistant-empty"
              >
                Ask the assistant about your services, docs, runbooks, or
                ChangeSets. Answers are always grounded in documents you
                are authorised to read; tool proposals always become a
                ChangeSet you must approve.
              </p>
            )}
            {messages.map((message, index) => (
              <MessageCard
                key={message.id}
                message={message}
                ref={index === messages.length - 1 ? lastMessageRef : undefined}
              />
            ))}

            {askState.isError && (
              <p
                className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
                role="alert"
              >
                {errorMessage(askState.error) || 'Assistant request failed.'}
              </p>
            )}

            <form
              className="flex flex-col gap-2 border-t border-slate-800 pt-3"
              onSubmit={handleSubmit}
              aria-label="Ask the assistant"
            >
              <label htmlFor="assistant-prompt" className="sr-only">
                Prompt
              </label>
              <textarea
                id="assistant-prompt"
                className="min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-100 focus:border-fuchsia-400 focus:outline-none"
                placeholder="Ask about a service, runbook, or propose a ChangeSet..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                data-testid="assistant-prompt-input"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Answers cite documents you can read; mutations always go
                  through approval.
                </p>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || askState.isLoading}
                  data-testid="assistant-send"
                >
                  <Send className="mr-1 h-4 w-4" />
                  {askState.isLoading ? 'Asking...' : 'Send'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MessageCardProps {
  message: AssistantMessage;
  ref?: React.Ref<HTMLDivElement>;
}

function MessageCard({ message, ref }: MessageCardProps) {
  const isUser = message.role === 'user';
  return (
    <div
      ref={ref}
      className={[
        'rounded-lg border p-3 text-sm',
        isUser
          ? 'border-slate-700 bg-slate-900/60'
          : 'border-fuchsia-500/30 bg-fuchsia-500/5',
      ].join(' ')}
      data-testid={`assistant-msg-${message.role}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="outline"
          className={isUser ? 'text-slate-200' : 'text-fuchsia-200'}
        >
          {isUser ? 'You' : 'Assistant'}
        </Badge>
        <span className="text-xs text-slate-500">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
        {message.refusal && (
          <Badge
            variant="outline"
            className={REFUSAL_TONE[message.refusal.reason]}
            data-testid="assistant-refusal-badge"
          >
            <ShieldAlert className="mr-1 h-3 w-3" />
            {REFUSAL_LABEL[message.refusal.reason]}
          </Badge>
        )}
      </div>
      <p className="whitespace-pre-line text-slate-100">{message.content}</p>

      {message.citations && message.citations.length > 0 && (
        <ul
          className="mt-3 space-y-1 text-xs text-slate-300"
          data-testid="assistant-citations"
        >
          {message.citations.map((c) => (
            <li
              key={`${message.id}-${c.documentId}`}
              className="flex items-start gap-1"
            >
              <span className="font-mono text-fuchsia-300">[{c.source}]</span>
              <span className="font-medium text-slate-100">{c.title}</span>
              <span className="text-slate-400">— {c.snippet}</span>
              {c.url && (
                <Link
                  className="ml-1 text-fuchsia-300 hover:underline"
                  to={c.url}
                  data-testid={`assistant-cite-${c.documentId}`}
                >
                  open
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {message.proposal && (
        <div
          className="mt-3 rounded border border-amber-400/40 bg-amber-500/10 p-2"
          data-testid="assistant-proposal"
        >
          <p className="text-xs uppercase tracking-wide text-amber-300">
            Proposed ChangeSet
          </p>
          <p className="font-medium text-slate-100">
            {message.proposal.title}
          </p>
          <p className="text-xs text-slate-300">{message.proposal.summary}</p>
          <Link
            to={message.proposal.changeSet.url || `/approvals/${message.proposal.changeSet.id}`}
            className="mt-1 inline-flex items-center gap-1 text-xs text-amber-200 hover:underline"
            data-testid="assistant-proposal-link"
          >
            Review &amp; approve
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
