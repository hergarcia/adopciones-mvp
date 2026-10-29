# Quickstart — validar los avisos de animales nuevos

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + las cuatro personas sintéticas
pnpm db:types
pnpm dev                          # sin RESEND_API_KEY: el ingreso y los avisos quedan en .artifacts/mail/
```

## Comprobar

1. **Crear (US1)**: sin sesión, `/animales?especie=perro&tamano=chico&departamento=montevideo`. En el
   vacío, al lado de «Sacar los filtros», «Avisame cuando haya uno así». Tocarlo, entrar con el
   enlace del correo y volver al mismo listado con la línea de confirmación y el enlace a «Mis
   avisos». Tocarlo otra vez: «ya lo tenés». Crear dos más con otros filtros y probar un cuarto: el
   máximo y el camino a «Mis avisos». Con la red cortada en las herramientas del navegador: el
   mensaje al lado del botón.
2. **Mis avisos (US1)**: `/mis-avisos` desde Mi perfil: «Perros chicos en Montevideo», su enlace
   abre el listado filtrado, «Borrar» lo saca. Sin avisos: el vacío con el enlace al listado.
3. **Correo (US2)**: con otra persona sembrada, publicar un perro chico en Montevideo; esperar la
   vuelta de 5 minutos (o `select private.stamp_first_listed();` en la base local) y llamar la ruta
   de las 8:
   `curl -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/resumen`. En
   `.artifacts/mail/` aparece un solo correo con la parte del aviso, el animal con foto, nombre,
   «Perro, …» y zona, el enlace al listado filtrado, «Dejar de recibir» y las cabeceras
   `List-Unsubscribe`. Llamarla otra vez: ningún correo nuevo.
4. **Dejar de recibir (US3)**: abrir el enlace del correo en una ventana privada: «cortando» y la
   confirmación con el enlace al listado. «Mis avisos» queda vacío. Cambiar una letra del token: la
   pantalla de enlace que no sirve, con el camino a Mi perfil.
5. **Teléfono angosto**: a 390 × 667, el ofrecimiento entra en el renglón del total o debajo, y
   «Mis avisos» no pide desplazarse de costado.

## Pruebas

```bash
pnpm test -- src/lib/alerts src/lib/schemas/pet-alert src/lib/analytics/alert-events src/lib/analytics/visit-origin src/lib/links
pnpm test -- tests/db/pet-alerts
pnpm gates:affected
node scripts/walk.mjs --story avisen-correo-animal-busco --user "/animales?especie=perro&tamano=chico&departamento=montevideo" /mis-avisos
```

Lo que se guarda está en [data-model.md](./data-model.md) y las acciones en
[contracts/server-actions.md](./contracts/server-actions.md).
