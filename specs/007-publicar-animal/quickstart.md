# Quickstart: validar «Publicar un animal»

## Preparar

```sh
pnpm install
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed: Ana (nivel 1), Lucía (número a medias)
pnpm db:types
pnpm dev                         # sin RESEND_API_KEY, para que el enlace de ingreso quede en .artifacts/mail/
```

## Compuertas

```sh
pnpm lint && pnpm typecheck && pnpm test     # unidad + tests/db/pets.test.ts
pnpm mutation                                # 100 % sobre lo tocado
pnpm build && pnpm e2e                       # tests/e2e/publicar.spec.ts
pnpm verify                                  # todo, en orden (Lighthouse se verifica en CI, KL-001)
```

## Recorrida a mano (390 px y 1280 px)

| Paso | Qué se espera | Spec |
|---|---|---|
| Entrar como Ana y tocar «Mis animales» en la cabecera | El vacío: «Todavía no publicaste ningún animal. Empezá con una foto.» con la tirita | US1.14 |
| «Publicar un animal», elegir 3 fotos del teléfono | Cada casillero pasa de la forma punteada a la foto; «3 de 5 fotos» | US1.1 |
| En la segunda foto, «Hacer portada» | Pasa primera y dice «Portada»; las otras conservan su orden | US1.3 |
| Zona | Montevideo · Pocitos ya puestos; cambiarla no toca el perfil | US1.2 |
| Escribir «099 123 456» en la descripción y publicar | Se marca la descripción, se cita el número, no se publica | US1.7 |
| Completar y publicar | «Subiendo fotos: n de 3», después «Publicado» y Luna primera en la pared | US1.1 |
| Publicar otra perra «luna» | El aviso de nombre repetido; «Publicar igual» publica | US3.4 |
| Abrir Luna, sacar una foto, agregar otra, cambiar la descripción, «Guardar» | «Guardado» y Luna con los cambios, en su lugar | US2.1 |
| En la consola del navegador, modo sin conexión, «Publicar» | «No se publicó porque no hay conexión», todo en pantalla; con conexión, una sola publicación | US3.1 |
| Recargar a mitad de la carga | La nota de lo recuperado; los datos siguen, las fotos no | US3.3 |
| Entrar como Lucía (número a medias) y abrir publicar | El aviso de verificación pendiente para publicar | US1.10 |
| Como Lucía, abrir `/mis-animales/<id de Luna>/editar` | «Este animal no existe.» | US2.4 |

La edad que avanza (US2.2) se ve moviendo el día de la publicación en la base local:

```sql
update public.pets set age_as_of = age_as_of - interval '1 month' where name = 'Luna';
```

Con 2 meses cargados, al abrir Luna figura con 3.

## Capturas para el design-reviewer

```sh
node scripts/walk.mjs --story publicar-animal --user /mis-animales /mis-animales/publicar
```
