import { useRef, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function enviar() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onSend(textarea.value);
    textarea.value = '';
    textarea.style.height = 'auto';
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      enviar();
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  return (
    <div className="chat__campo">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Escribe tu mensaje…"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        aria-label="Mensaje para el asistente"
      />
      <button type="button" className="boton boton--primario" onClick={enviar} disabled={disabled}>
        Enviar
      </button>
    </div>
  );
}
