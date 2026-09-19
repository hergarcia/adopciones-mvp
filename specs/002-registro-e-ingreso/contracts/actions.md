# Contratos — Server Actions y rutas

Todas las acciones devuelven `ActionResult<T>` y **no lanzan** (`docs/08`). El `error` es una clave
de i18n, nunca un texto.

```ts
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }
```

## `actions/auth.ts`

### `requestLoginLink(email: string): ActionResult<{ waitSeconds: number }>`

1. Valida con `lib/schemas/auth.ts`. Formato malo → `ok: false`, `auth.errors.email_format`.
2. Mira la ventana del navegador (cookie). Si todavía no puede pedir → `ok: true` con
   `waitSeconds`, **sin mandar nada**: para quien mira, es el mismo camino.
3. Marca `superseded_at` en los enlaces vivos de esa dirección (FR-004).
4. Mira el tope mudo por dirección. Pasado → registra `delivery: 'skipped_rate_limit'` y sigue
   como si nada.
5. `auth.admin.generateLink({ type: 'magiclink', email })`, guarda la fila y manda el correo.
6. Devuelve **siempre** `ok: true` con la misma forma, exista o no la cuenta (FR-006a).

Falla de envío → `ok: false`, `auth.errors.send_failed`, y el intento **no** consume ventana
(FR-003a).

### `resendLinkFor(linkId: string): ActionResult<{ waitSeconds: number }>`

La acción de «El enlace no sirve». Toma el **id del enlace**, no una dirección: resuelve el correo
del lado del servidor a partir de la fila de `login_links` y sigue el mismo camino que
`requestLoginLink`. El cliente nunca conoce la dirección, y por eso la pantalla no puede
revelarla (FR-005b). Si la fila ya no existe —pasaron los 7 días— devuelve `ok: false` con
`auth.errors.link_unknown`, y la pantalla pide escribir el correo de nuevo.

### `signOut(): ActionResult<null>`

Cierra la sesión y redirige al inicio.

## `actions/profile.ts`

### `saveProfile(input): ActionResult<{ redirectTo: string }>`

`input`: un `FormData` con `display_name`, `department`, `locality`, `is_rescuer` y, opcional, el
archivo `avatar` **ya procesado en el navegador** (WebP de 256 px, sin EXIF). El archivo viaja en
la acción y lo sube el servidor con `uploadAvatar`; el navegador **no** habla con Storage
directamente, así que no necesita credenciales ni URL firmada de escritura, y el límite de tipo y
tamaño del bucket se aplica del lado del servidor.

- Valida con el **mismo** schema que usa el formulario (`lib/schemas/profile.ts`).
- Escribe a través de `upsertProfile` en `lib/supabase/queries/profiles.ts`. **Ninguna acción hace
  `.from(...)` por su cuenta**: `docs/08` lo prohíbe y hay una compuerta con su fixture que lo
  demuestra fallando. Nunca toca otra fila: la policy lo impide aunque el código falle.
- `redirectTo` sale de `lib/auth/next-destination.ts`: el destino pendiente si lo hay y es de este
  sitio, si no `/mi-perfil` (FR-016a, FR-014a).
- Error de red o de base → `ok: false`, `profile.errors.save_failed`; el formulario conserva todo.

### `removeAvatar(): ActionResult<null>`

Borra el archivo y pone `avatar_path` en nulo (FR-024b).

### `deleteAccount(): ActionResult<null>`

En este orden, de menos a más irreversible: cierra las sesiones → borra el archivo → borra las
filas de `login_links` de esa dirección → borra la persona del servicio de autenticación, que
arrastra la fila de perfil por `on delete cascade`. **Cada paso tolera estar ya hecho**, así que
reintentar retoma donde quedó. Si algo falla, no confirma nada y devuelve
`profile.errors.delete_failed`; solo al terminar el último paso redirige a `/cuenta-borrada`
(FR-028a, FR-028c).

## Nota sobre la capa de base

Toda lectura y escritura pasa por `lib/supabase/queries/`: `getMyProfile`, `upsertProfile`,
`clearAvatarPath`, `deleteProfile`, `getLoginLink`, `recordLoginLink`, `supersedeLinks`,
`countRecentLinks`, `purgeExpired`, y para el archivo `uploadAvatar`, `deleteAvatar` y
`signAvatarUrl` en `lib/supabase/queries/avatars.ts`. Las acciones y las rutas llaman a esas funciones y nunca a la
base directamente.

## Rutas

### `GET /auth/confirm?link=<id>&token_hash=<hash>&next=<ruta>`

Abre el enlace del correo. En este orden:

1. Busca la fila por `link`. No está, o pasaron los 7 días → mensaje general.
2. `lib/auth/link-status.ts` decide con la precedencia de FR-005a: **reemplazado** → **usado** →
   **vencido**. Cualquiera de los tres → `/entrar/enlace` con el motivo, **sin la dirección**
   (FR-005b).
3. La cuenta fue borrada → el enlace no sirve y no recrea nada (FR-007b).
4. Ya hay sesión: si es la misma dirección, sigue adentro sin consumir el enlace; si es otra, dice
   con cuál está adentro y **no** consume el enlace (FR-007c).
5. Si no, `verifyOtp` con el `token_hash`, marca `consumed_at`, y va al destino: a completar el
   perfil si está incompleto, o a `next` validado, o a `/mi-perfil`.

Vale en cualquier navegador (FR-004a): cuando `next` no viaja con el enlace, cae en `/mi-perfil`.

### `GET /auth/callback?code=<code>` — la vuelta de Google

Canjea el código y le pregunta a `lib/auth/google.ts` si **Google marcó como verificada esa
dirección en este ingreso**: el campo `email_verified` dentro de `identity_data` de la identidad
`google`, leída con permisos de servicio. **No** alcanza con `email_confirmed_at` del usuario, que
pudo haberlo puesto nuestro propio enlace semanas antes y no dice nada sobre lo que Google afirma
hoy; y **no** se lee `user_metadata`, que la propia persona edita. Si no está verificada, cierra la
sesión en el acto y va a `/entrar` con `auth.errors.google_unverified` (FR-009a).

Cancelar en Google vuelve a `/entrar` sin sesión y con un mensaje (FR-010).
