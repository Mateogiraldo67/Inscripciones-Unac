## Context

Ver `proposal.md` para el porqué. El flujo de n8n ya existe, está desplegado y
probado por fuera de este repositorio (responde con reglas fijas por palabra clave,
sin IA todavía). Este change solo le da una pantalla dentro de SION.

La **definición** del workflow (el JSON que se importa en n8n) sí se versiona en este
repo, en [`n8n/`](../../../n8n/README.md) — no se despliega junto con `apps/api` ni
`apps/web`, es solo para no perder cómo está armado y poder reimportarlo si hace falta.

## Goals / Non-Goals

**Goals:**

- Que el chat se sienta parte de la aplicación (mismo shell, mismo menú, misma
  estética), no una ventana ajena incrustada.
- Mantener la regla de "un solo cliente HTTP por tipo de destino" que ya hace cumplir
  ESLint: ningún componente llama `fetch` directo.
- Cero cambios en `apps/api` y en el esquema de Prisma.

**Non-Goals:**

- No se construye historial persistente en la base de datos de SION.
- No se conecta Gemini con contexto real todavía.
- No se oculta la URL del webhook detrás de un proxy propio (ver "Fuera de alcance").

## Decisions

### El webhook se llama directo desde el frontend, no desde `apps/api`

Alternativa descartada: añadir un endpoint `POST /chat/messages` en `apps/api` que
reenvíe al webhook de n8n, reutilizando la sesión JWT para identificar al usuario.

Se descarta para este change porque: el webhook ya no transporta ningún secreto (la
API key de Gemini vive dentro de n8n, no en este repo), ya tiene su propia validación
y límite de envíos, y pasarlo por `apps/api` no añadiría ninguna protección real hoy
— solo una capa de red de más. Si en el futuro se necesita atar el límite de envíos a
la cuenta del usuario (no al navegador) o guardar el historial en la base de datos de
SION, ese es el momento de mover la llamada al backend; hoy sería trabajo sin
beneficio.

### `sessionId` vive en `localStorage`, no en la sesión de SION

El `userId` de la sesión de SION no se usa para identificar la conversación. Dos
razones: primero, atar la conversación a la cuenta exigiría pasar por el backend
(ver decisión anterior); segundo, es coherente con cómo ya funciona el flujo de n8n,
que no conoce nada de SION más allá de `sessionId` y `message`.

Se genera con `crypto.randomUUID()` la primera vez que se abre el chat y se guarda en
`localStorage` bajo una clave propia. Cerrar sesión en SION no lo borra: es un detalle
aceptado, no un fallo — el proposal lo declara como supuesto.

### Un cliente nuevo en `src/lib/`, no dentro de `features/chat/`

`src/lib/http.ts` es el cliente del API **propio** de SION: añade `credentials:
'include'`, interpreta `apiErrorSchema`, y dispara el aviso de sesión caducada en un
401. El webhook de n8n no tiene nada de eso — no manda cookies, su forma de error es
`{ success: false, error, code }`, no `apiErrorSchema`. Mezclarlo en `apiFetch` sería
forzar un contrato que no aplica.

Por eso `src/lib/n8n-chat.ts` es un archivo nuevo, hermano de `http.ts`, no una
función dentro de él. Sigue viviendo en `src/lib/` porque ahí es donde la regla de
ESLint (`no-restricted-globals` sobre `fetch`, con `ignores: ['src/lib/**']`) permite
llamar `fetch`; un cliente en `features/chat/api/` rompería el lint.

```ts
// src/lib/n8n-chat.ts (forma, no código final)
export class ChatServiceError extends Error { readonly code?: string }
export async function sendChatMessage(sessionId: string, message: string): Promise<{ reply: string }>
```

### La feature `chat` se mira igual que las demás, pero sin capa `api/` con TanStack Query clásico

Las demás features (`goals`, `enrollment`...) tienen `api/<feature>-queries.ts` con
`useQuery`/`useMutation` apuntando a `apiFetch`. Aquí se mantiene el mismo patrón:
`features/chat/api/chat-queries.ts` expone un hook `useSendChatMessage()` que envuelve
`sendChatMessage` de `lib/n8n-chat.ts` en un `useMutation`, igual que cualquier otra
mutación del repo. El estado de los mensajes en pantalla (lista de turnos, reintento)
vive en un hook de la propia feature (`features/chat/hooks/use-chat-session.ts`), no
en caché de TanStack Query, porque no es un recurso que se vuelva a pedir al
servidor — es estado de UI de la conversación actual.

## Variables de entorno

| Variable | Dónde | Ejemplo | Notas |
|---|---|---|---|
| `VITE_N8N_WEBHOOK_URL` | `apps/web/.env` | `https://tu-instancia.app.n8n.cloud/webhook/chat-gemini-v2` | Pública a propósito: no es un secreto, es la URL del webhook. Cambiarla exige redeploy del frontend (Vite la incrusta en build). |

Se añade a `packages/config/src/schemas.ts` (`webEnvSchema`) como `z.url(...)`
obligatoria, siguiendo el mismo patrón que `VITE_API_URL`, y se documenta en
`apps/web/.env.example`.

## Estructura

```
apps/web/src/
  lib/
    n8n-chat.ts                     # nuevo — único punto que llama al webhook
  features/chat/
    api/chat-queries.ts             # useSendChatMessage()
    hooks/use-chat-session.ts       # sessionId, lista de mensajes, reintento
    components/
      chat-window.tsx
      message-list.tsx
      message-bubble.tsx
      chat-input.tsx
      typing-indicator.tsx
  routes/role-routes.tsx            # + export ChatPage (o archivo propio de la feature)
  router.tsx                        # + applicantChatRoute, + studentChatRoute
  components/navigation.ts          # + entrada "Chat" en APPLICANT y STUDENT
  styles.css                        # + bloque .chat-* en el mismo vocabulario visual
```

## Risks / Trade-offs

- **El webhook es, en la práctica, semipúblico**: cualquiera que lo descubra puede
  llamarlo directo. Aceptado — ver "Fuera de alcance" en el proposal; la validación y
  el límite de envíos ya corren del lado de n8n.
- **El historial no sobrevive si la instancia de n8n se reinicia** sin persistencia
  configurada. Deuda conocida, no de este change (vive en el proyecto del workflow).
- **Si `VITE_N8N_WEBHOOK_URL` falta o está mal**, la pantalla de chat falla con el
  mismo aviso de "no se pudo conectar" que cualquier error de red — no hace que la
  aplicación entera falle al arrancar, porque no es una variable que el resto de la
  app necesite.

## Migration Plan

Ninguna migración de base de datos. Despliegue: añadir `VITE_N8N_WEBHOOK_URL` a las
variables de entorno del frontend en Vercel (o donde esté desplegado) y redesplegar.
