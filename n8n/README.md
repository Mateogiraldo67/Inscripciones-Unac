# Workflow de n8n del chat

Esta carpeta guarda la **definición** del flujo de n8n del que depende la pantalla de
chat (`apps/web/src/features/chat/`, ver `openspec/changes/add-chat-widget/`). n8n es
un servicio externo a este repositorio — nada de aquí se despliega junto con `apps/api`
ni `apps/web` — pero el JSON del workflow sí se versiona aquí para no perder cómo está
armado.

## Archivos

| Archivo | Qué es |
|---|---|
| `workflow-chat-gemini-v2-lastnode.json` | **El que está en producción.** Webhook → validación + límite de envíos → respuestas por palabra clave. Sin IA conectada todavía (ver "Siguiente paso" abajo). |
| `workflow-chat-gemini.json` | Versión original con nodo `Respond to Webhook` explícito. En la instancia de n8n Cloud usada para este proyecto no entregaba la respuesta (502); se dejó documentada por si en otra instancia sí funciona. |
| `diagnostico-ping.json` | Workflow mínimo de un solo nodo, usado para diagnosticar si una instancia de n8n puede entregar respuestas de webhook en absoluto. Útil si vuelve a pasar algo raro. |
| `ejemplos-request-response.md` | Ejemplos de la solicitud y las cuatro respuestas posibles (éxito, validación, límite de envíos, error del proveedor). |

## Cómo importarlo en una instancia de n8n

1. Consigue una API Key de Gemini en [Google AI Studio](https://aistudio.google.com/apikey) (solo hace falta si vas a reconectar IA real; el workflow activo no la usa todavía).
2. En n8n: **Workflows → Import from File** → `workflow-chat-gemini-v2-lastnode.json`.
3. Si vas a reconectar el nodo **Gemini - generateContent**: créale una credencial **Header Auth** (`Name: x-goog-api-key`, `Value:` tu API Key) y selecciónala en el nodo.
4. Publica/activa el workflow y copia la **Production URL** del nodo **Webhook - Recibir mensaje**.
5. Pon esa URL en `VITE_N8N_WEBHOOK_URL` (`apps/web/.env`, ver `apps/web/.env.example`).

## Siguiente paso: contexto real con Gemini

Ahora mismo el camino feliz (`IF - ¿Entrada válida?` → `true`) va directo a **Code -
Respuesta quemada**, que responde por palabra clave sin llamar a Gemini — es
intencional, para tener una demo 100% confiable sin depender de una API externa.

Los nodos de Gemini (`Code - Construir historial`, `Gemini - generateContent` y sus
formateadores) siguen en el workflow, armados pero desconectados. Para activarlos:
reconecta la salida `true` del IF a `Code - Construir historial` en vez de a `Code -
Respuesta quemada`, y asígnale la credencial de Gemini al nodo HTTP Request.
