# Ejemplos de solicitudes y respuestas

Todas las llamadas van por `POST` a la URL de producción del webhook (el nodo **Webhook -
Recibir mensaje** del workflow), con `Content-Type: application/json`.

## Enviar un mensaje

### Solicitud

```bash
curl -X POST "https://tu-instancia-n8n.app/webhook/chat-gemini" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "b3f1b6e2-7c0a-4b9a-9e4e-123456789abc",
    "message": "¿Cuáles son los horarios de atención?"
  }'
```

### Respuesta exitosa (200)

```json
{
  "success": true,
  "sessionId": "b3f1b6e2-7c0a-4b9a-9e4e-123456789abc",
  "reply": "Nuestro horario de atención es de lunes a viernes, de 8:00 a. m. a 5:00 p. m.",
  "timestamp": "2026-10-14T15:02:31.045Z"
}
```

## Errores

### Entrada inválida (400)

```json
{
  "success": false,
  "error": "message no puede estar vacío.",
  "code": "VALIDATION_ERROR"
}
```

### Límite de envíos superado (429)

```json
{
  "success": false,
  "error": "Has enviado demasiados mensajes. Espera un minuto antes de volver a intentar.",
  "code": "RATE_LIMITED"
}
```

### Falla el proveedor de IA (502)

```json
{
  "success": false,
  "sessionId": "b3f1b6e2-7c0a-4b9a-9e4e-123456789abc",
  "error": "No se pudo generar una respuesta en este momento. Intenta de nuevo en unos segundos.",
  "code": "PROVIDER_ERROR"
}
```

## Notas

- `sessionId` lo genera y conserva el frontend (`crypto.randomUUID()`, persistido en
  `localStorage`). Es lo que permite que el historial de una conversación sobreviva a recargas de
  página sin necesitar una cuenta de usuario.
- El campo `code` es estable y pensado para que el frontend decida qué hacer (mostrar el mensaje
  tal cual, ofrecer un botón de reintentar, etc.), sin tener que interpretar el texto de `error`.
