# Quickstart — poner el sitio andando de verdad y comprobarlo

Dos partes. **A** la hace el equipo una vez, con las cuentas (docs/09 §Quién decide qué: las cuentas
son de Hernán; el gasto ya está aprobado en #77). **B** comprueba cada user story contra el sitio de
verdad. Build deja este archivo como `docs/puesta-en-marcha.md` (el índice `docs/README.md` lo
enlaza), para que siga sirviendo después de la historia.

## A. Puesta en marcha (una vez)

1. **Supabase**: crear el proyecto en plan gratuito, región **Frankfurt (eu-central-1)** (FR-060).
   Anotar la URL, la clave anónima, la de servicio y la cadena del **pooler en modo sesión**
   (Settings → Database → Connection pooling).
2. **Auth del proyecto**: *Site URL* = `https://<proyecto>.vercel.app`; *Redirect URLs* =
   `https://<proyecto>.vercel.app/**`; proveedor de Google prendido con el cliente de Google Cloud,
   cuya URI de redirección autorizada suma `https://<ref>.supabase.co/auth/v1/callback`; proveedor de
   **teléfono apagado** (KL-017).
3. **Primera migración, a mano**: `pnpm exec supabase db push --db-url "<pooler>"`. Sin
   `--include-seed`: el sitio de verdad no lleva los sembrados (FR-006).
4. **Vercel**: importar el repositorio en Hobby; *Framework* Next.js; las variables de research R16
   **solo en Production**. `vercel.json` ya trae el comando de construcción, la región `fra1`, el cron
   diario y las direcciones de prueba apagadas. Comprobar la versión de Node (research R4).
5. **Vault** (SQL editor de Supabase), con la dirección y el mismo `CRON_SECRET` de Vercel:
   ```sql
   select vault.create_secret('https://<proyecto>.vercel.app', 'app_url');
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   ```
6. **Quien administra**: Hernán entra con Google y, en el SQL editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = '<su correo>';
   ```
7. **Resend**: la clave en Vercel; sin dominio, el remitente es el de pruebas y solo le llega a la
   casilla de la cuenta (KL-006).
8. **Twilio**: cuenta con un Messaging Service con remitente para Uruguay; *Messaging Geographic
   Permissions* **solo Uruguay**; protección contra el bombeo de mensajes **prendida** (KL-010,
   FR-012). Las tres `TWILIO_*` en Vercel.
9. **PostHog**: proyecto en **EU Cloud**; en *Project settings*, «Discard client IP data» prendido.
   La clave del proyecto en `POSTHOG_PROJECT_KEY`. Acceso solo para el equipo (FR-062).
10. **Sentry**: organización en la región **UE**; proyecto Node; «Prevent Storing of IP Addresses»
    prendido y los *Data Scrubbers* por defecto. El DSN en `SENTRY_DSN`. Una alerta por correo al
    equipo para cada problema nuevo. Acceso solo para el equipo (FR-062).
11. Volver a desplegar `main` en Vercel para que tome todo.

### Si algún día se prenden las direcciones de prueba

Un segundo proyecto gratuito de Supabase para *Preview*, sin `TWILIO_*` ni `SUPABASE_DB_URL` de
producción, y `vercel.json` sin el `"**": false`. Las variables de producción nunca van a *Preview*
(FR-008).

## B. Comprobar cada user story contra el sitio de verdad

**US1** — En el teléfono: abrir `https://<proyecto>.vercel.app`, ver la portada y el listado sin
animales, entrar con Google. Pedir el enlace por correo con la casilla del equipo (llega, sus enlaces
empiezan con la dirección provisoria) y con otra (no se pudo mandar; Google en la misma pantalla).
`curl -sI https://<proyecto>.vercel.app/` y `/animales` → `x-robots-tag: noindex, nofollow`;
`/robots.txt` cierra todo salvo los lectores de vista previa; `/sitemap.xml` no existe.

**US2** — Pedir el código para un celular uruguayo del equipo: llega en menos de 5 minutos; escribirlo
→ nivel 1. Pedirlo para `+54…` → lo que #10 muestra, sin mensaje (y nada en Twilio).

**US3** — Publicar un animal, tocar Compartir, pegar en el grupo de WhatsApp del equipo (la tarjeta con
foto, nombre y zona; el enlace con `?desde=compartir`). Desde otro teléfono abrirlo y tocar «Quiero
adoptar». En PostHog (Activity), dentro de la hora: `pet_viewed` con `origin: shared` y
`application_started`, sin nada más que las propiedades del momento. Escribir la dirección de la
ficha a mano → `origin: unknown`. Desde el listado → `listing`.

**US4** — Dos fallas reales, sin tocar código: pedir el enlace de ingreso con una casilla que no es
la del equipo (Resend lo rechaza, KL-006) y, con `TWILIO_AUTH_TOKEN` cambiado un momento en Vercel,
pedir un código. La persona ve lo de siempre; en Sentry, dentro de la hora, dos avisos con pantalla
(`sign_in`, `phone_verification`), paso (`send_email`, `request_code`) y hora, sin la casilla ni el
número. Abrir cada aviso y buscar cualquier dato de una persona: no hay. Volver a poner el token.

**US5** — En el SQL editor, `select * from private.task_runs order by last_ok_at;`: cada tarea con su
vuelta reciente. Dejar una publicación de prueba que venza un día en que nadie use el sitio; al día
siguiente, vencida y el aviso en la casilla del equipo. Desactivar una tarea más que su plazo
(`select cron.alter_job((select jobid from cron.job where jobname = 'follow-ups'), active := false);`)
→ un solo aviso en Sentry ese día; reactivarla → la vuelta siguiente hace lo pendiente, una vez.

**US6** — `node scripts/cloud/privacy-check.mjs` con `.env.cloud` → la tabla regla por regla; pegarla
como comentario en #169 junto con la captura del plan del proyecto (gratuito, sin recuperación a un
punto) para KL-11-1. `node scripts/cloud/speed-check.mjs https://<proyecto>.vercel.app <código>` → la
tabla de velocidad; pegarla en #169.
