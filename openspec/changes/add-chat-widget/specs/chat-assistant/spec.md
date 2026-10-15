## Purpose

Darle a un aspirante o a un estudiante un lugar dentro de la aplicación para preguntar
sobre su proceso y recibir respuesta, sin que otro rol pueda verlo ni usarlo.

## ADDED Requirements

### Requirement: Un aspirante o estudiante accede al chat desde su menú

El sistema SHALL mostrar una entrada "Chat" en el menú lateral de los roles APPLICANT y
STUDENT, que lleva a una pantalla de conversación dentro de la zona autenticada de cada
uno.

#### Scenario: El aspirante ve la entrada

- **WHEN** un aspirante abre su menú lateral
- **THEN** ve una entrada "Chat" que lo lleva a su propia pantalla de conversación

#### Scenario: El estudiante ve la entrada

- **WHEN** un estudiante abre su menú lateral
- **THEN** ve una entrada "Chat" que lo lleva a su propia pantalla de conversación

### Requirement: El chat está reservado a aspirantes y estudiantes

Las pantallas de chat SHALL resolver la misma autorización por rol que el resto de la
zona autenticada: heredan el guard de su layout. Los roles ADMIN y DEAN SHALL NOT tener
una entrada de chat en su menú ni acceso a esa pantalla.

#### Scenario: Un administrador no ve la entrada

- **WHEN** un administrador abre su menú lateral
- **THEN** no aparece ninguna entrada de chat

#### Scenario: Un administrador abre la dirección directamente

- **WHEN** una persona con rol ADMIN o DEAN abre directamente la dirección de la
  pantalla de chat de otro rol
- **THEN** se le niega el acceso y se le devuelve a su propia zona, igual que con
  cualquier otra pantalla fuera de su rol

#### Scenario: Sin sesión

- **WHEN** alguien sin sesión abre directamente la dirección de la pantalla de chat
- **THEN** se le lleva a la pantalla de ingreso sin llegar a ver el contenido

### Requirement: La persona mantiene varias conversaciones y elige entre ellas

El sistema SHALL permitir empezar una conversación nueva sin perder las anteriores, y
SHALL mostrar la lista de conversaciones previas para volver a cualquiera de ellas.
Todas persisten en el navegador y sobreviven a recargar la página.

#### Scenario: Recargar la página conserva todas las conversaciones

- **WHEN** una persona tiene varias conversaciones con mensajes y recarga la página
  del chat
- **THEN** todas siguen apareciendo en la lista, con sus mensajes intactos

#### Scenario: Se empieza una conversación nueva

- **WHEN** una persona pide empezar una conversación nueva
- **THEN** se abre un hilo vacío, distinto de los anteriores, sin mezclar sus mensajes
  con los de otra conversación

#### Scenario: Se cambia entre conversaciones

- **WHEN** una persona selecciona una conversación anterior de la lista
- **THEN** ve exactamente los mensajes de esa conversación, no los de la que tenía
  abierta antes

#### Scenario: Se elimina una conversación

- **WHEN** una persona elimina una conversación de la lista
- **THEN** deja de aparecer y sus mensajes no se pueden recuperar; si era la que tenía
  abierta, pasa a ver otra conversación existente o una nueva vacía si no queda
  ninguna

#### Scenario: Otra persona en otro navegador no ve las conversaciones

- **WHEN** dos personas distintas abren el chat cada una desde su propio navegador
- **THEN** cada una ve únicamente sus propias conversaciones

### Requirement: El chat informa cuando no puede responder

Cuando la llamada al servicio de respuestas falle, el sistema SHALL mostrar un aviso
claro, SHALL conservar el mensaje que la persona envió, y SHALL permitirle reintentar
sin perder los mensajes anteriores.

#### Scenario: El servicio no responde

- **WHEN** el servicio de respuestas no contesta o responde con un error
- **THEN** la persona ve un aviso de que no se pudo obtener respuesta, su mensaje
  sigue visible, y puede reintentar
