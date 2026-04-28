// Sprint 30 / L-3005 — DTOs mirroring the REST contract of the AI
// assistant surface.

export type AssistantStatus = 'open' | 'closed';
export type AssistantRole = 'user' | 'assistant' | 'system';
export type AssistantRefusalReason =
  | 'rate_limited'
  | 'prompt_injection'
  | 'insufficient_context'
  | 'out_of_scope'
  | 'unsafe_action';

export interface AssistantCitation {
  documentId: string;
  source: string;
  title: string;
  url?: string;
  snippet: string;
}

export interface AssistantRefusal {
  reason: AssistantRefusalReason;
  message: string;
}

export interface AssistantChangeSetRef {
  id: string;
  url: string;
  title: string;
}

export interface AssistantProposal {
  id: string;
  title: string;
  summary: string;
  changeSet: AssistantChangeSetRef;
  createdAt: string;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  citations?: AssistantCitation[];
  refusal?: AssistantRefusal;
  proposal?: AssistantProposal;
}

export interface AssistantConversation {
  id: string;
  tenant: string;
  owner: string;
  title: string;
  status: AssistantStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  messages: AssistantMessage[];
}

export interface AssistantConversationList {
  items: AssistantConversation[];
}

export interface AssistantAskResponse {
  conversation: AssistantConversation;
  refused: boolean;
  refusal?: AssistantRefusal;
  proposal?: AssistantProposal;
}

export interface AssistantAskRequest {
  conversationId?: string;
  prompt: string;
  intent?: {
    kind: string;
    resource?: string;
    summary?: string;
    metadata?: Record<string, string>;
  };
  maxCitations?: number;
}
