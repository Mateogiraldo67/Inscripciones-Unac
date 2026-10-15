import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../../../lib/n8n-chat';

export function useSendChatMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      sendChatMessage(sessionId, message),
  });
}
