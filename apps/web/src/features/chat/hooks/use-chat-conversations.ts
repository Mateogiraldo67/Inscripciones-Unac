import { useCallback, useEffect, useState } from 'react';
import { ChatServiceError } from '../../../lib/n8n-chat';
import { useSendChatMessage } from '../api/chat-queries';

const CONVERSATIONS_STORAGE_KEY = 'sion_chat_conversations';
const ACTIVE_ID_STORAGE_KEY = 'sion_chat_active_id';
const MAX_MESSAGE_LENGTH = 4000;
const TITLE_MAX_LENGTH = 40;

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  status: ChatMessageStatus;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function createMessage(role: ChatMessageRole, text: string, status: ChatMessageStatus): ChatMessage {
  return { id: crypto.randomUUID(), role, text, status, createdAt: new Date().toISOString() };
}

function createConversation(): ChatConversation {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), title: 'Nueva conversación', messages: [], createdAt: now, updatedAt: now };
}

function titleFromText(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > TITLE_MAX_LENGTH ? `${trimmed.slice(0, TITLE_MAX_LENGTH)}…` : trimmed;
}

function isChatConversation(value: unknown): value is ChatConversation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'messages' in value &&
    Array.isArray((value as ChatConversation).messages)
  );
}

function loadConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatConversation);
  } catch {
    return [];
  }
}

function loadActiveId(conversations: ChatConversation[]): string {
  try {
    const stored = localStorage.getItem(ACTIVE_ID_STORAGE_KEY);
    if (stored && conversations.some((c) => c.id === stored)) return stored;
  } catch {
    // localStorage inaccesible (modo privado, etc.): se sigue con el valor por defecto.
  }
  return conversations[0]?.id ?? '';
}

/** Mantiene las conversaciones del chat: no es caché de servidor, es estado propio del navegador. */
export function useChatConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const stored = loadConversations();
    return stored.length > 0 ? stored : [createConversation()];
  });
  const [activeId, setActiveId] = useState<string>(() => loadActiveId(conversations));
  const [inputError, setInputError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const sendChat = useSendChatMessage();

  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // Sin espacio o modo privado: la conversación sigue funcionando en memoria.
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_STORAGE_KEY, activeId);
    } catch {
      // Igual que arriba: no es crítico que esto persista.
    }
  }, [activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const updateConversation = useCallback((conversationId: string, update: (c: ChatConversation) => ChatConversation) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? update(c) : c)));
  }, []);

  const deliver = useCallback(
    async (conversationId: string, text: string, userMessageId: string) => {
      try {
        const reply = await sendChat.mutateAsync({ sessionId: conversationId, message: text });
        updateConversation(conversationId, (c) => ({
          ...c,
          title: c.messages.length === 0 ? titleFromText(text) : c.title,
          messages: [
            ...c.messages.map((m) => (m.id === userMessageId ? { ...m, status: 'sent' as const } : m)),
            createMessage('assistant', reply, 'sent'),
          ],
          updatedAt: new Date().toISOString(),
        }));
        setLastFailedText(null);
      } catch (error) {
        const message = error instanceof ChatServiceError ? error.message : 'Ocurrió un error inesperado.';
        updateConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === userMessageId ? { ...m, status: 'error' as const } : m)),
        }));
        setLastFailedText(text);
        setInputError(message);
      }
    },
    [sendChat, updateConversation],
  );

  const sendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text) {
        setInputError('Escribe un mensaje antes de enviar.');
        return;
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        setInputError(`El mensaje supera el máximo de ${MAX_MESSAGE_LENGTH} caracteres.`);
        return;
      }
      if (sendChat.isPending || !activeConversation) return;

      setInputError(null);
      const conversationId = activeConversation.id;
      const userMessage = createMessage('user', text, 'sending');
      updateConversation(conversationId, (c) => ({
        ...c,
        title: c.messages.length === 0 ? titleFromText(text) : c.title,
        messages: [...c.messages, userMessage],
      }));
      void deliver(conversationId, text, userMessage.id);
    },
    [activeConversation, deliver, sendChat.isPending, updateConversation],
  );

  const retryLast = useCallback(() => {
    if (!lastFailedText || sendChat.isPending || !activeConversation) return;

    setInputError(null);
    const conversationId = activeConversation.id;
    const userMessage = createMessage('user', lastFailedText, 'sending');
    updateConversation(conversationId, (c) => ({ ...c, messages: [...c.messages, userMessage] }));
    void deliver(conversationId, lastFailedText, userMessage.id);
  }, [activeConversation, deliver, lastFailedText, sendChat.isPending, updateConversation]);

  const newConversation = useCallback(() => {
    const conversation = createConversation();
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setInputError(null);
    setLastFailedText(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setInputError(null);
    setLastFailedText(null);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (id === activeId) {
          const [mostRecent] = [...remaining].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          if (mostRecent) {
            setActiveId(mostRecent.id);
            return remaining;
          }
          const fresh = createConversation();
          setActiveId(fresh.id);
          return [fresh];
        }
        return remaining;
      });
    },
    [activeId],
  );

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    conversations: sortedConversations,
    activeConversation,
    activeId: activeConversation?.id ?? '',
    messages: activeConversation?.messages ?? [],
    isSending: sendChat.isPending,
    inputError,
    canRetry: lastFailedText !== null,
    sendMessage,
    retryLast,
    newConversation,
    selectConversation,
    deleteConversation,
  };
}
