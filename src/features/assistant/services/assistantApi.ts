import { baseApi } from '@/shared/lib/api';
import type {
  AssistantAskRequest,
  AssistantAskResponse,
  AssistantConversation,
  AssistantConversationList,
} from '../types/assistant';

// Sprint 30 / L-3005 — RTK Query slice for the AI assistant surface.
//
// The API exposes three endpoints:
//   - POST /api/v1/assistant/ask
//   - GET  /api/v1/assistant/conversations
//   - GET  /api/v1/assistant/conversations/:id
// Every mutation invalidates the conversation list + the bumped
// conversation entry so the UI immediately reflects the new turn.
export const assistantApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAssistantConversations: build.query<AssistantConversationList, void>({
      query: () => '/assistant/conversations',
      providesTags: (result) =>
        result
          ? [
              { type: 'AssistantConversation', id: 'LIST' },
              ...result.items.map(
                (c) =>
                  ({ type: 'AssistantConversation', id: c.id }) as const,
              ),
            ]
          : [{ type: 'AssistantConversation', id: 'LIST' }],
    }),

    getAssistantConversation: build.query<AssistantConversation, string>({
      query: (id) => `/assistant/conversations/${id}`,
      providesTags: (_r, _e, id) => [
        { type: 'AssistantConversation', id },
      ],
    }),

    askAssistant: build.mutation<AssistantAskResponse, AssistantAskRequest>({
      query: (body) => ({
        url: '/assistant/ask',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'AssistantConversation', id: 'LIST' },
              { type: 'AssistantConversation', id: result.conversation.id },
            ]
          : [{ type: 'AssistantConversation', id: 'LIST' }],
    }),
  }),
});

export const {
  useListAssistantConversationsQuery,
  useGetAssistantConversationQuery,
  useAskAssistantMutation,
} = assistantApi;
