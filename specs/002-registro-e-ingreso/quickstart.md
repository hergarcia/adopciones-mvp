# Cómo correr y ver esta historia

Para Hernán, en el build local, y para cualquier corrida futura que tenga que reproducirla.

## Antes

```bash
pnpm install
pnpm exec supabase start          # Docker tiene que estar corriendo
pnpm exec supabase status -o env  # copiar los valores a .env.local
pnpm exec supabase db reset       # migraciones + seed, incluidas las personas sembradas
pnpm db:types                     # regenera src/lib/supabase/types.ts con las tablas nuevas
pnpm dev
```

## Variables nuevas en `.env.local`

Todas las de F00 siguen igual. Esta historia suma estas, y **ninguna es obligatoria** para que el
producto funcione en local:

| Variable | Si falta | Dónde se saca |
|---|---|---|
| `RESEND_API_KEY` | el correo no sale; el mensaje se escribe en `.artifacts/mail/` y todo lo demás funciona (KL-006) | resend.com, cuando exista el dominio |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID` | la opción «Entrar con Google» no se muestra y el ingreso por correo funciona igual (FR-011) | Google Cloud → Credenciales → ID de cliente OAuth |
| `SUPABASE_AUTH_GOOGLE_SECRET` | idem | idem |

Para probar Google en local hay que crear un cliente OAuth en Google Cloud con
`http://127.0.0.1:54321/auth/v1/callback` como URI de redirección autorizada, cargar las dos
variables y reiniciar `pnpm exec supabase start`.

## El camino completo, sin cuenta de correo

1. Abrir `http://localhost:3000/entrar`.
2. Escribir cualquier dirección y enviar.
3. El enlace queda en `.artifacts/mail/` (el archivo más nuevo). Abrirlo en el navegador.
4. Completar nombre, departamento y localidad. La etiqueta del segundo campo dice **«Barrio»** si
   el departamento es Montevideo y **«Localidad»** en los otros 18: es la decisión del 2026-09-19.
5. Ver el perfil, editarlo, cerrar sesión, volver a entrar, borrar la cuenta.

## Qué mirar, contra la spec

| Cosa | Dónde | Requisito |
|---|---|---|
| El correo de otra persona no se ve desde ninguna pantalla | `pnpm test tests/db/profiles.test.ts` | FR-026, SC-005 |
| La foto no se abre sin sesión ni con sesión ajena | `pnpm test tests/db/avatars.test.ts` | FR-026c |
| Pedir dos enlaces y abrir el primero | a mano, con dos pedidos seguidos | FR-005 |
| Escribir una dirección ajena no revela nada | comparar la pantalla con una dirección nueva y una que ya tiene cuenta: tienen que ser idénticas | FR-006a |
| Quedarse sin salida en «Completar perfil» | desde ahí, cerrar sesión y borrar la cuenta | FR-016b |
| Entrar con Google por primera vez | con una cuenta de Google sin perfil: el nombre llega escrito y la foto se ofrece sin estar puesta; «Usar esta foto» la pone y «Quitar foto» vuelve a ofrecerla | FR-030b, US3-AS6 |
| Lo escrito vuelve, y no le queda a otra cuenta | elegir departamento y barrio, recargar: siguen ahí; cerrar sesión y entrar con otra cuenta: el formulario no trae nada de la anterior | FR-021 |

## Capturas para la revisión de diseño

```bash
node scripts/walk.mjs --story 002-registro-e-ingreso
node scripts/walk.mjs --story 002-registro-e-ingreso --user   # las pantallas con sesión
```

Salen a `.artifacts/002-registro-e-ingreso/`, a 390 px. Sin `--user` no hay capturas de
«Completar perfil», «Mi perfil» ni del diálogo de borrado.

## Si algo falla

- **El enlace del correo da 404**: el matcher de `src/proxy.ts` volvió a comerse `/auth`. Es la
  Decisión 6 del plan y el motivo de que el e2e abra el enlace de verdad.
- **`pnpm db:types` no cambia nada**: falta `pnpm exec supabase db reset` después de agregar la
  migración.
- **`pnpm lighthouse` no termina**: es KL-001, pasa en Windows. Esa etapa se verifica en CI.
