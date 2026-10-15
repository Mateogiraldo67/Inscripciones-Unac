## 1. Configuración

- [x] 1.1 Añadir `VITE_N8N_WEBHOOK_URL` a `webEnvSchema` en `packages/config/src/schemas.ts`, como `z.url(...)` obligatoria
- [x] 1.2 Documentar `VITE_N8N_WEBHOOK_URL` en `apps/web/.env.example`, con comentario explicando que no es secreta y que requiere redeploy al cambiar
- [x] 1.3 Añadir el valor real en `apps/web/.env` local (no versionado) para poder probar

## 2. Cliente del webhook

- [x] 2.1 Crear `apps/web/src/lib/n8n-chat.ts`: `sendChatMessage(sessionId, message)`, con su propio tipo de error (`ChatServiceError`), timeout, y manejo de red caída — mismo espíritu que `http.ts` pero sin `credentials`, sin `apiErrorSchema`, interpretando `{ success, reply, error, code }`

## 3. Feature `chat`

- [x] 3.1 Crear `features/chat/hooks/use-chat-session.ts`: genera/recupera `sessionId` de `localStorage`, mantiene la lista de mensajes en estado local, expone `sendMessage` y `retryLast`
- [x] 3.2 Crear `features/chat/api/chat-queries.ts`: `useSendChatMessage()` envolviendo `sendChatMessage` en un `useMutation`, usado por el hook de 3.1
- [x] 3.3 Crear los componentes de presentación: `chat-window.tsx`, `message-list.tsx` (con scroll automático), `message-bubble.tsx`, `chat-input.tsx`, `typing-indicator.tsx`
- [x] 3.4 Validar en el propio input que el mensaje no esté vacío ni supere el máximo de caracteres antes de enviarlo (la validación real la sigue haciendo n8n; esta es solo comodidad)

## 4. Integración en la aplicación

- [x] 4.1 Añadir `applicantChatRoute` (`/aspirante/chat`) y `studentChatRoute` (`/estudiante/chat`) en `router.tsx`, como hijas de `applicantLayout` y `studentLayout` respectivamente
- [x] 4.2 Añadir la entrada `{ label: 'Chat', to: '/aspirante/chat' }` y `{ label: 'Chat', to: '/estudiante/chat' }` en `NAV_BY_ROLE` (`components/navigation.ts`)
- [x] 4.3 Añadir el bloque `.chat-*` en `styles.css`, en el mismo vocabulario de variables (`--borde`, `--tenue`, el azul `#1a4fd8` de los botones) que el resto de la zona autenticada

## 5. Verificación

- [x] 5.1 `pnpm lint` y `pnpm typecheck` en verde
- [x] 5.2 Probar a mano en el navegador, con sesión de APPLICANT: enviar un mensaje y recibir respuesta (verificado con cuenta real contra el webhook de n8n). Pendiente repetir con STUDENT, el caso de recarga de página y el de fallo de red.
- [ ] 5.3 Confirmar que un ADMIN o un DEAN no ven la entrada de chat y que abrir la URL directamente los devuelve a su propia zona
- [x] 5.4 Sin pruebas automatizadas nuevas: no hay lógica de negocio ni cambio de permisos en este repo — la ruta hereda el guard de rol ya existente y probado, y la lógica de respuesta vive en n8n, fuera de este repositorio

## 6. Varias conversaciones (ampliación tras la primera prueba en vivo)

Al probarlo, el chat quedaba como un widget pequeño en vez de ocupar la pantalla, y no
había forma de empezar una conversación nueva ni de deshacerse de una vieja — todo se
acumulaba en un único hilo. Se amplía el alcance original para cubrirlo.

- [x] 6.1 Rediseñar el estado del chat como una lista de **conversaciones**
      (`id`, `título`, `mensajes`, `creada`, `actualizada`) en vez de una sola sesión;
      el `id` de la conversación pasa a ser el `sessionId` que se le manda a n8n
- [x] 6.2 Persistir la lista completa de conversaciones en `localStorage` (no solo el
      id de sesión), y seguir leyéndola al volver a abrir el chat
- [x] 6.3 El título de cada conversación sale de su primer mensaje (recortado); antes
      de tener mensajes se llama "Nueva conversación"
- [x] 6.4 Añadir `conversation-list.tsx`: botón "Nuevo chat", lista de conversaciones
      pasadas (resaltando la activa), botón de eliminar por conversación
- [x] 6.5 Eliminar la conversación activa pasa a la más reciente de las que queden, o
      crea una nueva si no queda ninguna
- [x] 6.6 El chat pasa a ocupar el alto disponible de la pantalla (ya no es un
      recuadro pequeño), con la lista de conversaciones como panel lateral dentro de
      la misma pantalla
- [x] 6.7 `pnpm lint` y `pnpm typecheck` en verde; probado a mano: crear varias
      conversaciones, cambiar entre ellas, eliminar una, recargar la página y
      confirmar que todo sigue ahí
