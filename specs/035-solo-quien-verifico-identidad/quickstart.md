# Quickstart: Ver solo los animales de quien verificó su identidad

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset   # migraciones + seed
pnpm db:types
pnpm dev                       # sin RESEND_API_KEY, así el correo se escribe en .artifacts/mail/
```

La semilla ya tiene personas con la identidad verificada (`identity_verifications`) y con solo el
teléfono. Si ninguna de nivel 1 tiene un animal a la vista, publicá uno con esa persona.

## Validar

1. **El filtro** (US1): abrí `/animales`, marcá «Solo de quien verificó su identidad». La pared deja
   solo las tarjetas que dicen «Identidad verificada» o el nivel con aval, el total baja y la
   dirección termina en `quien-publica=identidad`. Recargá: la casilla sigue marcada. «Sacar los
   filtros» la desmarca.
2. **Enlace alterado** (US1): abrí `/animales?especie=perro&quien-publica=cualquiera`: se ve el
   listado de perros sin el filtro y la dirección queda `/animales?especie=perro`.
3. **El aviso** (US2): entrá como una persona sembrada, marcá «Perro», «Montevideo» y el filtro, tocá
   «Avisame cuando haya uno así» y abrí `/mis-avisos`: «Perros en Montevideo, de quien verificó su
   identidad». Creá el mismo sin el filtro: hay dos.
4. **El correo** (US3): con avisos con y sin el filtro y un animal nuevo de cada nivel, corré la
   tarea de las 8 (`/api/cron/resumen` con el secreto de la tarea) y leé el correo en
   `.artifacts/mail/`: la parte del aviso con el filtro trae solo lo de nivel 2 o más y su enlace
   lleva `quien-publica=identidad`.
5. **Medición** (US4): con la consola de la medición en modo local, marcá el filtro y mirá
   `listing_filter_used` con `filter: publisher`, `option: identity`.

## Pruebas

```bash
pnpm gates:affected
node scripts/walk.mjs --story 285-solo-quien-verifico-identidad "/animales?quien-publica=identidad" "/animales?especie=perro&departamento=montevideo&quien-publica=identidad"
node scripts/walk.mjs --story 285-solo-quien-verifico-identidad --user /mis-avisos
```
