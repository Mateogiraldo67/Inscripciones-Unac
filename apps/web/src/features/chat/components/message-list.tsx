import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../hooks/use-chat-conversations';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

export function MessageList({ messages, isSending }: { messages: ChatMessage[]; isSending: boolean }) {
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending]);

  return (
    <div className="chat__historial">
      {messages.length === 0 && (
        <p className="chat__vacio" role="status">
          ¿En qué puedo ayudarte hoy?
        </p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isSending && <TypingIndicator />}
      <div ref={finRef} />
    </div>
  );
}
