# Mantenimiento preventivo

## Diagnóstico

El taller propone validar las entradas antes de que provoquen fallos. `POST /events` recibía un DTO con tipos declarados en TypeScript, pero el controlador aceptaba los datos sin comprobarlos al ejecutar la aplicación. Por ejemplo, una acción numérica provocaba un `500` y un `payload` que era una lista podía guardarse en SQLite.

## Cambio y justificación

El [controlador de eventos](epn-event-manager/src/modules/events/events.controller.ts) ahora aplica `ValidationPipe` al cuerpo de `POST /events`. El [DTO](epn-event-manager/src/modules/events/dto/create-event.dto.ts) comprueba los tipos y longitudes antes de que el servicio procese el evento.

- `source` y `entity` deben contener texto y admiten hasta 100 caracteres cada uno. `title` admite hasta 200 y también debe contener texto.
- `action` admite `CREATE`, `UPDATE`, `DELETE` y `QUERY` en mayúsculas, minúsculas o una combinación de ambas.
- `description` es opcional y admite texto de hasta 1000 caracteres. `payload` es un objeto JSON opcional que conserva la estructura propia de cada CRUD. Si se omite o se envía como `null`, se guarda como `{}`.

Estos límites permiten usar identificadores y descripciones habituales y acotan lo que se almacena. La API devuelve `400` para datos inválidos. Para cuerpos JSON de más de 100 KiB se aprovecha el límite de Express, que ya devuelve `413`. Es preventivo porque los datos se comprueban antes de llegar a la escritura y el cliente recibe una respuesta que le permite corregir su solicitud.

## Verificación

La prueba envía solicitudes HTTP con SQLite en memoria. Antes del cambio, la acción numérica devolvía `500` y las otras siete entradas inválidas recibían `201`. Después, las ocho devuelven `400`. Los otros dos casos comprueban que un cuerpo sobredimensionado devuelve `413` y que un evento válido del CRUD se registra con `201` y aparece en la consulta por origen.

Desde `epn-event-manager`, ejecutar `npm run test:e2e -- --runInBand event-validation.e2e-spec.ts`.
