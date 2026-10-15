import type { ChatConversation } from '../hooks/use-chat-conversations';

function formatFecha(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString([], { day: '2-digit', month: 'short' });
}

interface ConversationListProps {
  conversations: ChatConversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: ConversationListProps) {
  return (
    <div className="chat-conversaciones">
      <button type="button" className="boton boton--primario chat-conversaciones__nuevo" onClick={onNew}>
        + Nuevo chat
      </button>

      <ul className="chat-conversaciones__lista">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              className={`chat-conversaciones__item ${conversation.id === activeId ? 'chat-conversaciones__item--activo' : ''}`}
              onClick={() => onSelect(conversation.id)}
            >
              <span className="chat-conversaciones__titulo">{conversation.title}</span>
              <span className="chat-conversaciones__fecha">{formatFecha(conversation.updatedAt)}</span>
            </button>
            <button
              type="button"
              className="chat-conversaciones__eliminar"
              onClick={() => onDelete(conversation.id)}
              aria-label={`Eliminar conversación "${conversation.title}"`}
              title="Eliminar conversación"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
