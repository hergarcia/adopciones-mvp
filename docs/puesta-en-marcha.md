# Puesta en marcha del sitio de verdad

Cómo se pone el sitio a andar en la dirección provisoria, una sola vez, con las cuentas de los
servicios. Las cuentas son de Hernán (docs/09 §Quién decide qué); el gasto está aprobado en #77.
Viene de la historia #169 (`specs/021-sitio-andando-de-verdad/`); la comprobación de cada parte
contra el sitio de verdad está en su `quickstart.md` §B.

Después de esto, cada merge a `main` despliega solo: la construcción de producción empuja las
migraciones nuevas a la base y después compila (`scripts/deploy/build.mjs`, research R3). Nunca
corre `seed.sql`: el sitio de verdad no lleva las personas ni los animales sembrados (FR-006).

## Los pasos

1. **Supabase**: crear el proyecto en plan gratuito. Región **Frankfurt (eu-central-1)**: la Ley
   18.331 (art. 23) solo permite llevar los datos a un país con nivel adecuado, y la Unión Europea
   lo es (FR-060). La prueba de rendimiento corre en **São Paulo (sa-east-1)** hasta verificar la
   ley (docs/07-stack.md, 2026-10-16). Anotar la URL, la clave anónima, la de servicio y la cadena del **pooler en
   modo sesión** (Settings → Database → Connection pooling): la conexión directa es solo IPv6 y la
   construcción de Vercel no la alcanza.
2. **Auth del proyecto**: *Site URL* = `https://<proyecto>.vercel.app`; *Redirect URLs* =
   `https://<proyecto>.vercel.app/**`; proveedor de Google prendido con el cliente de Google
   Cloud, cuya URI de redirección autorizada suma `https://<ref>.supabase.co/auth/v1/callback`;
   proveedor de **teléfono apagado** (KL-017): el teléfono no es una forma de entrar.
3. **Primera migración, a mano**: `pnpm exec supabase db push --db-url "<pooler>"`, para ver con
   calma cualquier error de una migración contra la nube. Sin `--include-seed`.
4. **Vercel**: importar el repositorio en Hobby, *Framework* Next.js. `vercel.json` ya trae el
   comando de construcción, la región `gru1` (al lado de la base) y las direcciones de prueba
   apagadas. Node lo toma de `engines` en `package.json`: la 24.x más nueva (KL-169-1). Las
   variables, **solo en Production**:

   | Variable | De dónde |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | el proyecto de Supabase (paso 1) |
   | `SUPABASE_DB_URL` | la cadena del pooler en modo sesión (paso 1) |
   | `NEXT_PUBLIC_APP_URL` | `https://<proyecto>.vercel.app` |
   | `CRON_SECRET` | un secreto nuevo, largo; el mismo va a Vault (paso 5) |
   | `RESEND_API_KEY`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Resend (paso 7) y la casilla del equipo |
   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` | Twilio (paso 8) |
   | `POSTHOG_PROJECT_KEY` | PostHog (paso 9) |
   | `SENTRY_DSN` | Sentry (paso 10) |
   | `NEXT_PUBLIC_SUPPORT_WHATSAPP` | opcional |

   Ninguna lleva `NEXT_PUBLIC_` salvo las que ya lo tenían: la clave de PostHog y el DSN de Sentry
   solo los usa el servidor.
5. **Vault** (SQL editor de Supabase), con la dirección y el mismo `CRON_SECRET` de Vercel, para
   que las tareas de la base llamen al sitio:
   ```sql
   select vault.create_secret('https://<proyecto>.vercel.app', 'app_url');
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   ```
6. **Quien administra**: Hernán entra con Google y, en el SQL editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = '<su correo>';
   ```
7. **Resend**: la clave en Vercel. Sin dominio, el remitente es el de pruebas y solo le llega a la
   casilla de la cuenta (KL-006).
8. **Twilio**: cuenta con un Messaging Service con remitente para Uruguay; *Messaging Geographic
   Permissions* **solo Uruguay**; protección contra el bombeo de mensajes **prendida** (KL-010,
   FR-012). Las tres `TWILIO_*` en Vercel.
9. **PostHog**: proyecto en **EU Cloud**; en *Project settings*, «Discard client IP data»
   prendido. La clave del proyecto en `POSTHOG_PROJECT_KEY`. Acceso solo para el equipo (FR-062).
10. **Sentry**: organización en la región **UE**; proyecto Node; «Prevent Storing of IP Addresses»
    prendido y los *Data Scrubbers* por defecto. El DSN en `SENTRY_DSN`. Una alerta por correo al
    equipo para cada problema nuevo. Acceso solo para el equipo (FR-062).
11. Volver a desplegar `main` en Vercel para que tome todo.

## Si algún día se prenden las direcciones de prueba

Hoy no existen: `vercel.json` despliega solo `main` (research R1), así que ningún cambio sin
revisar toca los datos de verdad ni manda mensajes (FR-008). Para prenderlas: un segundo proyecto
gratuito de Supabase para *Preview*, sin `TWILIO_*` ni el `SUPABASE_DB_URL` de producción, y
`vercel.json` sin el `"**": false`. Las variables de producción nunca van a *Preview*.

## Comprobar contra el sitio de verdad

Con todo andando, las pruebas de privacidad y la medida de velocidad corren contra la nube y su
resultado queda en la historia (#169, FR-050 a FR-053):

1. `.env.cloud` en la raíz del repositorio, ignorado por git, con `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` del proyecto de la nube. No van en
   `.env.local`: ahí, `pnpm test` correría contra los datos de verdad.
2. `node scripts/cloud/privacy-check.mjs`: borra las personas de prueba que hayan quedado, corre las
   pruebas de privacidad de la base contra la nube, las vuelve a borrar e imprime la tabla regla por
   regla. La fila de los respaldos es a mano: la captura del plan del proyecto (gratuito, sin
   recuperación a un punto, KL-11-1).
3. `node scripts/cloud/speed-check.mjs https://<proyecto>.vercel.app <código de una ficha publicada>`:
   Lighthouse tres veces por pantalla con los ajustes de la compuerta y el peso de apertura de los
   e2e, para la portada, el listado y esa ficha; imprime la tabla.
4. Pegar las dos tablas y la captura como comentario en #169. Una regla que falla o que no corrió deja
   la historia sin terminar (FR-051).
