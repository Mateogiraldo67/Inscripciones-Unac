import type { ChatMessage } from '../hooks/use-chat-conversations';

function formatHora(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`mensaje mensaje--${message.role === 'user' ? 'usuario' : 'asistente'}`}>
      <div className={`burbuja ${message.status === 'error' ? 'burbuja--error' : ''}`}>
        <p>{message.text}</p>
        <span className="burbuja__hora">
          {formatHora(message.createdAt)}
          {message.status === 'sending' && ' · enviando…'}
          {message.status === 'error' && ' · no se pudo enviar'}
        </span>
      </div>
    </div>
  );
}
