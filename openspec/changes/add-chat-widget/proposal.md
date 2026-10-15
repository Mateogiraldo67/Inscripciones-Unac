## Why

Un aspirante o un estudiante que tiene una duda sobre su proceso no tiene a quién
preguntarle dentro de la plataforma. Ya existe, fuera de este repositorio, un flujo de
n8n que responde preguntas frecuentes sobre el proceso de inscripción (documentos,
pago, estado, entrevista). Este change le da una pantalla dentro de SION, para que deje
de ser una demo aparte y pase a ser parte de la aplicación que ya usan.

## What Changes

- Se añade una pantalla **Chat** dentro de la zona autenticada, en `/aspirante/chat` y
  `/estudiante/chat`, con entrada en el menú lateral de ambos roles.
- El frontend llama directamente al webhook del flujo de n8n (un servicio externo ya
  desplegado y operado fuera de este repositorio) con `sessionId` (generado y
  persistido en `localStorage` del navegador) y `message`. No hay backend propio
  involucrado: ni nuevo módulo en `apps/api`, ni tabla nueva en la base de datos.
- Se añade una variable de entorno nueva, `VITE_N8N_WEBHOOK_URL`, documentada en
  `apps/web/.env.example` y validada en `packages/config`.
- Se añade `apps/web/src/lib/n8n-chat.ts` como el único punto del frontend que llama a
  ese webhook (igual que `apiFetch` es el único punto que llama al API propio): la
  regla de "sin `fetch` directo en componentes" se mantiene intacta.
- La pantalla ocupa el alto disponible en vez de ser un recuadro pequeño, y permite
  varias **conversaciones** en paralelo: se puede empezar una nueva, cambiar entre las
  existentes y eliminar la que ya no sirve. Cada conversación es su propio hilo frente
  a n8n (su identificador de conversación es el `sessionId` que se le manda).

## Fuera de alcance

- **Historial de conversación persistido en el backend propio.** El historial de cada
  conversación vive del lado de n8n (memoria del workflow), no en la base de datos de
  SION. Si se pierde al reiniciar la instancia de n8n, es una limitación conocida y
  aceptada, no de este change.
- **Respuestas generadas con contexto real de IA (Gemini).** El flujo de n8n actual
  responde con reglas fijas por palabra clave, no con un modelo de lenguaje. Conectar
  Gemini con contexto del proceso queda para un change posterior.
- **ADMIN y DEAN.** No ven el chat: no lo necesitan para su trabajo y no hay pantalla
  para ellos.
- **Ocultar la URL del webhook detrás del API propio.** Se decide exponerla
  directamente al frontend porque el webhook ya hace su propia validación y límite de
  envíos del lado de n8n, y no transporta ningún secreto (la API key de Gemini vive
  solo dentro de n8n). Proxyarla por `apps/api` queda como mejora posible si se
  necesita en el futuro más control (p. ej. límite de envíos ligado a la cuenta en vez
  de a la sesión del navegador).
- **Notificar o guardar nada en la base de datos de SION sobre el uso del chat.**

## Capabilities

### New Capabilities

- `chat-assistant`: permite a un APPLICANT o STUDENT conversar con el asistente desde
  una pantalla propia dentro de la zona autenticada, sin que otro rol pueda verla ni
  usarla.

## Impact

- **Roles**: APPLICANT y STUDENT ganan la pantalla de chat y su entrada de menú. ADMIN
  y DEAN no se ven afectados.
- **Base de datos**: ninguna migración. Nada de este change toca Prisma.
- **Configuración**: una variable nueva, `VITE_N8N_WEBHOOK_URL`, en `apps/web/.env` y
  `packages/config`. Es pública por diseño (no es un secreto), así que no hay problema
  en que Vite la incruste en el bundle.
- **Dependencias nuevas**: ninguna.
- **Arquitectura**: un cliente nuevo en `src/lib/` (el único lugar permitido para
  `fetch`), una feature nueva en `src/features/chat/`, y rutas nuevas bajo las zonas
  de aspirante y estudiante que ya existen. No se toca `apps/api`.

## Supuestos

- El webhook de n8n (`VITE_N8N_WEBHOOK_URL`) ya está desplegado, publicado y
  respondiendo antes de desplegar este change; si no lo está, la pantalla de chat
  muestra el error de conexión como cualquier otro fallo de red.
- Cada pestaña/navegador tiene su propia conversación: el `sessionId` vive en
  `localStorage`, no en la cuenta del usuario. Cerrar sesión en SION no reinicia la
  conversación del chat ni viceversa.
- El chat no necesita conocer datos reales de la inscripción del usuario: responde de
  forma genérica sobre el proceso, no sobre el caso particular de quien pregunta.
