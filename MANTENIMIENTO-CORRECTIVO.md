# Mantenimiento correctivo

## Diagnóstico

El taller orienta el mantenimiento correctivo a reparar fallos de lógica que hacen que se pierdan eventos. En `POST /events`, un evento con acción `DELETE` recibía `201` y `{ "ok": true }`, pero la consulta por origen devolvía `[]`. Al comparar las cuatro acciones en `EventsService.registerEvent`, se vio que `DELETE` solo llamaba a `deleteRepo.create()`, que construye la entidad en memoria. Las demás acciones también llamaban a `save()`.

## Cambio y justificación

En [EventsService](epn-event-manager/src/modules/events/events.service.ts), `DELETE` ahora espera a que `deleteRepo.save()` escriba en `delete_events` antes de responder `{ "ok": true }`. Así, la confirmación corresponde a un registro que el cliente ya puede consultar. Es correctivo porque recupera una función prevista que fallaba con solicitudes válidas.

## Verificación

La prueba envía las cuatro acciones como lo haría un CRUD y las consulta mediante `GET /events/source/:source`. Usa una base SQLite en memoria. Antes del cambio pasaban `CREATE`, `UPDATE` y `QUERY`, mientras `DELETE` devolvía un historial vacío. Con el cambio, las cuatro acciones se confirman y aparecen en sus consultas por origen.

Desde `epn-event-manager`, ejecutar `npm run test:e2e -- --runInBand delete-event.e2e-spec.ts`.
