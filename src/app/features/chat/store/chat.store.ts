import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState
} from '@ngrx/signals';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/api/api.service';
import { SignalRService } from '../../../core/signalr/signalr.service';
import { Conversation, Message } from '../../../shared/models';

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | null;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  isStreaming: false,
  streamingContent: '',
  streamingMessageId: null,
  error: null
};

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    activeConversation: computed(() =>
      store.conversations().find((c) => c.id === store.activeConversationId()) ?? null
    ),
    sortedMessages: computed(() =>
      [...store.messages()].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    ),
    hasConversations: computed(() => store.conversations().length > 0)
  })),
  withMethods((store) => {
    const api = inject(ApiService);
    const signalr = inject(SignalRService);

    const setError = (error: string | null) => patchState(store, { error });

    const loadConversations = async (): Promise<void> => {
      patchState(store, { isLoadingConversations: true, error: null });
      try {
        const conversations = await firstValueFrom(api.get<Conversation[]>('/conversations'));
        patchState(store, { conversations });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được hội thoại');
      } finally {
        patchState(store, { isLoadingConversations: false });
      }
    };

    const loadMessages = async (conversationId: string): Promise<void> => {
      patchState(store, { isLoadingMessages: true, error: null });
      try {
        const messages = await firstValueFrom(
          api.get<Message[]>(`/conversations/${conversationId}/messages`)
        );
        patchState(store, { messages });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được tin nhắn');
      } finally {
        patchState(store, { isLoadingMessages: false });
      }
    };

    const createConversation = async (title?: string): Promise<Conversation | null> => {
      patchState(store, { error: null });
      try {
        const conversation = await firstValueFrom(
          api.post<Conversation>('/conversations', { title })
        );
        patchState(store, {
          conversations: [conversation, ...store.conversations()],
          activeConversationId: conversation.id,
          messages: []
        });
        signalr.joinConversation(conversation.id).catch(() => undefined);
        return conversation;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tạo được hội thoại');
        return null;
      }
    };

    const selectConversation = async (id: string): Promise<void> => {
      if (store.activeConversationId() === id) return;
      const previous = store.activeConversationId();
      if (previous) {
        signalr.leaveConversation(previous).catch(() => undefined);
      }
      patchState(store, {
        activeConversationId: id,
        messages: [],
        streamingContent: '',
        streamingMessageId: null,
        isStreaming: false
      });
      await Promise.all([
        loadMessages(id),
        signalr.joinConversation(id).catch(() => undefined)
      ]);
    };

    const sendMessage = async (content: string): Promise<void> => {
      const trimmed = content.trim();
      if (!trimmed) return;

      let conversationId = store.activeConversationId();
      if (!conversationId) {
        const created = await createConversation(trimmed.slice(0, 60));
        if (!created) return;
        conversationId = created.id;
      }

      const optimisticUser: Message = {
        id: `local-${crypto.randomUUID()}`,
        conversationId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString()
      };

      patchState(store, {
        messages: [...store.messages(), optimisticUser],
        isSending: true,
        isStreaming: true,
        streamingContent: '',
        streamingMessageId: null,
        error: null
      });

      try {
        await signalr.sendMessage(conversationId, trimmed);
      } catch (err) {
        patchState(store, {
          isSending: false,
          isStreaming: false,
          streamingContent: ''
        });
        setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn');
      }
    };

    const appendStreamToken = (token: string): void => {
      patchState(store, {
        isStreaming: true,
        streamingContent: store.streamingContent() + token
      });
    };

    const finalizeStreamedMessage = (message: Message): void => {
      const existing = store.messages();
      const without = existing.filter((m) => m.id !== message.id);
      patchState(store, {
        messages: [...without, message],
        isStreaming: false,
        isSending: false,
        streamingContent: '',
        streamingMessageId: null
      });
    };

    const cancelStream = (): void => {
      patchState(store, {
        isStreaming: false,
        isSending: false,
        streamingContent: '',
        streamingMessageId: null
      });
    };

    const deleteConversation = async (id: string): Promise<void> => {
      patchState(store, { error: null });
      try {
        await firstValueFrom(api.delete<void>(`/conversations/${id}`));
        const remaining = store.conversations().filter((c) => c.id !== id);
        const wasActive = store.activeConversationId() === id;
        patchState(store, {
          conversations: remaining,
          activeConversationId: wasActive ? null : store.activeConversationId(),
          messages: wasActive ? [] : store.messages()
        });
        signalr.leaveConversation(id).catch(() => undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không xoá được hội thoại');
      }
    };

    const reset = (): void => {
      patchState(store, initialState);
    };

    return {
      loadConversations,
      loadMessages,
      createConversation,
      selectConversation,
      sendMessage,
      appendStreamToken,
      finalizeStreamedMessage,
      cancelStream,
      deleteConversation,
      reset,
      setError
    };
  }),
  withHooks({
    onInit(store) {
      const signalr = inject(SignalRService);
      const destroy$ = new Subject<void>();

      signalr.connect().catch(() => undefined);

      signalr
        .onTokenReceived()
        .pipe(takeUntil(destroy$))
        .subscribe((event) => {
          const activeId = store.activeConversationId();
          if (!activeId || !event.conversationId || event.conversationId === activeId) {
            store.appendStreamToken(event.token);
          }
        });

      signalr
        .onMessageComplete()
        .pipe(takeUntil(destroy$))
        .subscribe((message) => {
          const activeId = store.activeConversationId();
          if (activeId && message.conversationId !== activeId) return;
          store.finalizeStreamedMessage(message);
        });

      signalr
        .onError()
        .pipe(takeUntil(destroy$))
        .subscribe((message) => {
          store.setError(message);
          store.cancelStream();
        });

      (store as unknown as { _destroy$: Subject<void> })._destroy$ = destroy$;
    },
    onDestroy(store) {
      const destroy$ = (store as unknown as { _destroy$?: Subject<void> })._destroy$;
      destroy$?.next();
      destroy$?.complete();
    }
  })
);
