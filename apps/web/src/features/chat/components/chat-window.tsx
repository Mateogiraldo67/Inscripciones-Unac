import { useChatConversations } from '../hooks/use-chat-conversations';
import { ChatInput } from './chat-input';
import { ConversationList } from './conversation-list';
import { MessageList } from './message-list';

export function ChatWindow() {
  const {
    conversations,
    activeId,
    messages,
    isSending,
    inputError,
    canRetry,
    sendMessage,
    retryLast,
    newConversation,
    selectConversation,
    deleteConversation,
  } = useChatConversations();

  return (
    <div className="chat-layout">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
      />

      <div className="chat">
        <MessageList messages={messages} isSending={isSending} />

        {inputError && (
          <div className="aviso-caja aviso-caja--error chat__aviso" role="alert">
            <span>{inputError}</span>
            {canRetry && (
              <button type="button" onClick={retryLast}>
                Reintentar
              </button>
            )}
          </div>
        )}

        <ChatInput onSend={sendMessage} disabled={isSending} />
      </div>
    </div>
  );
}
