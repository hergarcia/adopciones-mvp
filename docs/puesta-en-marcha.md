# Puesta en marcha del sitio de verdad

Cómo se pone el sitio a andar en el servidor de casa (homelab), una sola vez. Las cuentas de los
servicios son de Hernán (docs/09 §Quién decide qué); el gasto está aprobado en #77. Viene de la
historia #169 (`specs/021-sitio-andando-de-verdad/`) y de la mudanza de #356 (docs/07, decisión
2026-11-24).

Después de esto, cada merge a `main` despliega solo: Dokploy construye la imagen (`Dockerfile`) y,
al arrancar, el contenedor empuja las migraciones nuevas antes de atender pedidos
(`scripts/deploy/migrate.mjs`, research R3). Nunca corre `seed.sql`: el sitio de verdad no lleva
las personas ni los animales sembrados (FR-006).

## Cómo está armado

- **Dokploy**, proyecto `adopciones`:
  - `supabase` (compose, plantilla de Dokploy recortada): Postgres 17, Auth, la API REST, Storage,
    imgproxy, meta y Studio. Sin funciones, Realtime ni Supavisor. La base y el gateway se unen a
    `dokploy-network` como `adopciones-db` y `adopciones-api-gw`. El gateway escucha en
    `127.0.0.1:54400` y Studio en `127.0.0.1:54423`; ninguno tiene dominio en Traefik.
  - `app` (aplicación, desde GitHub `main`, tipo Dockerfile), publicada en el puerto 3100 del
    servidor.
- **Tailscale Funnel**: `https://homelab.tail3e58eb.ts.net:10000` → `http://127.0.0.1:3100`.
- Desde afuera solo se llega a la app. De Supabase, a `/auth/v1/authorize` y `/auth/v1/callback`,
  que la app reenvía (`lib/supabase/auth-rewrite.ts`).

## Los pasos

1. **Supabase**: desplegar la plantilla `supabase` en el proyecto `adopciones` y, antes del primer
   despliegue:
   - borrar el dominio que genera la plantilla (publicaría Studio);
   - en el compose, sacar `functions`, `realtime` y `supavisor`; publicar `api-gw` en
     `127.0.0.1:54400:8000` y `studio` en `127.0.0.1:54423:3000`; unir `db` y `api-gw` a
     `dokploy-network` con sus alias; sumar a `auth` las variables `GOTRUE_EXTERNAL_GOOGLE_*`
     (leen `GOOGLE_ENABLED`, `GOOGLE_CLIENT_ID` y `GOOGLE_SECRET` del entorno);
   - en `lds.template.yaml` y `cds.yaml` del gateway, sacar las rutas y los clusters de `studio`,
     `meta`, `functions` y `realtime`;
   - en el entorno: `SITE_URL` y `SUPABASE_PUBLIC_URL` = `https://homelab.tail3e58eb.ts.net:10000`,
     `API_EXTERNAL_URL` = esa dirección más `/auth/v1`, `ADDITIONAL_REDIRECT_URLS` = sus
     `/auth/confirm` y `/auth/callback**`, `ENABLE_PHONE_SIGNUP=false` (KL-017),
     `ENABLE_PHONE_AUTOCONFIRM=false` y `ENABLE_EMAIL_AUTOCONFIRM=true`.
2. **Primera migración, a mano**, para ver con calma cualquier error. Con la IP del contenedor de la
   base: `pnpm exec supabase db push --db-url "postgresql://postgres:<clave>@<ip>:5432/postgres?sslmode=disable" --yes --skip-vault`.
   La base no habla TLS adentro del servidor: sin `sslmode=disable`, el CLI no conecta.
3. **La app** en Dokploy: aplicación desde GitHub, rama `main`, tipo Dockerfile, puerto publicado
   3100 → 3000. Los argumentos de construcción, que Next mete en el código al compilar:

   | Argumento | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `http://adopciones-api-gw:8000` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` del entorno de Supabase |
   | `NEXT_PUBLIC_APP_URL` | `https://homelab.tail3e58eb.ts.net:10000` |
   | `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP` | la casilla del equipo; el WhatsApp, opcional |

   Y el entorno: los mismos cinco, más

   | Variable | De dónde |
   |---|---|
   | `DEPLOY_ENV` | `production`: prende las migraciones al arrancar, PostHog y Sentry |
   | `SUPABASE_SECRET_KEY` | `SUPABASE_SECRET_KEY` del entorno de Supabase |
   | `SUPABASE_DB_URL` | `postgresql://postgres:<clave>@adopciones-db:5432/postgres?sslmode=disable` |
   | `CRON_SECRET` | un secreto nuevo, largo; el mismo va a Vault (paso 5) |
   | `RESEND_API_KEY` | Resend. Sin dominio, solo le llega a la casilla de la cuenta (KL-006) |
   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` | Twilio |
   | `POSTHOG_PROJECT_KEY`, `SENTRY_DSN` | PostHog y Sentry |
   | `GOOGLE_SIGN_IN_ENABLED` | `true` cuando Google ande (paso 7) |
4. **Funnel**: `tailscale funnel --bg --https=10000 http://127.0.0.1:3100`.
5. **Vault**, con la dirección interna de la app y el mismo `CRON_SECRET`, para que las tareas de la
   base la llamen sin salir del servidor (`docker exec` al contenedor de la base, `psql -U postgres`):
   ```sql
   select vault.create_secret('http://<appName de la app>:3000', 'app_url');
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   ```
6. **La vigilancia diaria**: una tarea programada de Dokploy en la app, `0 10 * * *`, que corre en el
   contenedor:
   ```sh
   node -e "fetch('http://localhost:3000/api/cron/vigilancia',{headers:{authorization:'Bearer '+process.env.CRON_SECRET}}).then(r=>process.exit(r.ok?0:1))"
   ```
7. **Google**: en Google Cloud → Credenciales, sumar
   `https://homelab.tail3e58eb.ts.net:10000/auth/v1/callback` a las URI de redirección del cliente.
   El cliente y el secreto van en `GOOGLE_CLIENT_ID` y `GOOGLE_SECRET` del entorno de Supabase, con
   `GOOGLE_ENABLED=true`; redesplegar el compose y, en la app, `GOOGLE_SIGN_IN_ENABLED=true`.
8. **Quien administra**: Hernán entra y, en la base:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = '<su correo>';
   ```
9. **Twilio, PostHog y Sentry**: como estaban (región US1, US Cloud, US), con las mismas
   protecciones: Twilio solo Uruguay y con la protección contra el bombeo de mensajes (KL-010);
   PostHog sin la IP; Sentry sin la IP y con los *Data Scrubbers* por defecto (FR-062).

Studio se abre desde la PC con un túnel: `ssh -L 54423:127.0.0.1:54423 homelab` y
`http://localhost:54423`.

## Comprobar contra el sitio de verdad

Con todo andando, las pruebas de privacidad y la medida de velocidad corren contra el servidor y
su resultado queda en la historia (#169, FR-050 a FR-053):

1. `.env.cloud` en la raíz del repositorio, ignorado por git, con `NEXT_PUBLIC_SUPABASE_URL`
   (`http://127.0.0.1:54400`, el gateway desde el servidor), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `SUPABASE_SECRET_KEY`. No van en `.env.local`: ahí, `pnpm test` correría contra los datos de
   verdad.
2. Subir `GOTRUE_RATE_LIMIT_TOKEN_REFRESH` a 1800 en el compose de Supabase mientras corren las
   pruebas y volverlo a 150 al terminar. Cada persona de prueba entra con contraseña por `/token`, y
   con el tope de siempre las que pasan de unas 70 reciben 429 (`over_request_rate_limit`).
3. `node scripts/cloud/privacy-check.mjs`: borra las personas de prueba que hayan quedado, corre las
   pruebas de privacidad de la base contra el servidor, las vuelve a borrar e imprime la tabla regla
   por regla. La fila de los respaldos es a mano (KL-11-1, KL-356-1).
4. `node scripts/cloud/speed-check.mjs https://homelab.tail3e58eb.ts.net:10000 <código de una ficha publicada>`:
   Lighthouse tres veces por pantalla con los ajustes de la compuerta y el peso de apertura de los
   e2e, para la portada, el listado y esa ficha; imprime la tabla.
5. Pegar las dos tablas como comentario en #169. Una regla que falla o que no corrió deja la
   historia sin terminar (FR-051).
