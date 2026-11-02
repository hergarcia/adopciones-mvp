# Quickstart: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset   # migraciones + seed
pnpm dev                       # sin RESEND_API_KEY, así el correo se escribe en .artifacts/mail/
```

La semilla tiene personas con la identidad verificada y con solo el teléfono, con animales a la vista.

## Validar

1. **La falla de un filtro** (US1): abrí `/animales`, con las herramientas del navegador poné la red
   sin conexión y marcá «Solo de quien verificó su identidad». Se ve la tira «No hay conexión. Estos
   son los animales de los filtros anteriores.», la casilla desmarcada, la dirección sin
   `quien-publica`, sin «Sacar los filtros», y las tarjetas de quien tiene solo el teléfono. Volvé la
   red y tocá «Reintentar»: el listado se filtra y la casilla queda marcada.
2. **Con otro filtro puesto** (US1): abrí `/animales?departamento=montevideo`, cortá la red y marcá
   «Perro»: queda marcado solo Montevideo, con «Sacar los filtros».
3. **El correo** (US2): entrá como una persona sembrada y creá «Perros en Montevideo» y después el
   mismo con el filtro. Publicá un perro en Montevideo con una persona con la identidad verificada y
   otro con una de solo el teléfono. Corré la tarea de las 8 y leé el correo en `.artifacts/mail/`: el
   primero va en la parte «…, de quien verificó su identidad», el segundo en «Perros en Montevideo», y
   el asunto cuenta 2.
4. **La confirmación** (US3): con sesión, abrí `/animales` sin filtros, marcá «Perro» y el filtro y
   tocá «Avisame cuando haya uno así»: en lugar del botón, «Te vamos a avisar por correo.» con «Mis
   avisos». Abrí «Mis avisos»: está el aviso. Volvé, marcá otro filtro: vuelve el botón.

## Pruebas

```bash
pnpm gates:affected
node scripts/walk.mjs --story 287-filtro-identidad-cumpla-dice "/animales" "/animales?departamento=montevideo"
node scripts/walk.mjs --story 287-filtro-identidad-cumpla-dice --user /animales
```
