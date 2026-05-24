export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  pending?: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface CreateConversationRequest {
  title?: string;
}
