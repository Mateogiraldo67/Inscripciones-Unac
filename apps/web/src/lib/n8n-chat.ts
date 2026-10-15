import { config } from './config';

/**
 * Llama al webhook del flujo de chat en n8n.
 *
 * Vive en `lib/` por el mismo motivo que `upload.ts`: es una llamada de red que no va
 * a nuestro API propio (no lleva credenciales de sesión, no habla el contrato de
 * `apiErrorSchema`), y la regla de ESLint que prohíbe `fetch` fuera de aquí no debe
 * saltarse desde un componente ni desde la feature.
 */
export class ChatServiceError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ChatServiceError';
    this.code = code;
  }
}

interface ChatWebhookResponse {
  success: boolean;
  reply?: string;
  error?: string;
  code?: string;
}

const REQUEST_TIMEOUT_MS = 20000;

export async function sendChatMessage(sessionId: string, message: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(config.VITE_N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ChatServiceError('El asistente tardó demasiado en responder. Intenta de nuevo.', 'TIMEOUT');
    }
    throw new ChatServiceError('No se pudo conectar con el asistente. Revisa tu conexión.', 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }

  let payload: ChatWebhookResponse;
  try {
    payload = (await response.json()) as ChatWebhookResponse;
  } catch {
    throw new ChatServiceError('El asistente respondió con un formato inesperado.', 'BAD_RESPONSE');
  }

  if (!payload.success || !payload.reply) {
    throw new ChatServiceError(payload.error ?? 'El asistente no pudo responder.', payload.code);
  }

  return payload.reply;
}
