# Modelo de datos — Registro e ingreso sin contraseña con perfil básico

Dos tablas y un bucket. Son los primeros objetos de producto del proyecto: hasta ahora la base
solo tenía la función `whoami()` del arnés de privacidad.

Regla que gobierna todo lo de acá: **en esta historia nadie lee datos de otra persona**
(FR-026a). No hay "perfil público" todavía, así que la policy correcta es la estrecha, y la
historia #12 la va a ensanchar con una condición explícita. Empezar ancho "porque después va a ser
público" sería exponer datos por adelantado.

## `public.profiles`

Uno a uno con la persona del servicio de autenticación. El correo **no se copia acá**: ya vive en
`auth.users` y duplicarlo sería guardar dos veces el dato más sensible de la historia.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | referencia a la persona, `on delete cascade` |
| `display_name` | `text` | 2 a 60, sin espacios sobrantes (FR-020a), sin vía de contacto (FR-020b) |
| `department` | `text` | el código ISO 3166-2:UY, p. ej. `UY-MO` |
| `locality` | `text` | hasta 60; texto libre, la sugerencia no restringe (FR-019) |
| `is_rescuer` | `boolean` | una sola marca, no dos conceptos (FR-017b) |
| `avatar_path` | `text` nulo | la ruta dentro del bucket; nulo es "sin foto" |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Por qué no hay `is_complete`**: el perfil está completo cuando tiene nombre, departamento y
localidad. Guardar una marca aparte crea un segundo lugar donde la verdad puede estar mal. Se
deriva.

**Por qué el texto y no un enum para `department`**: son 19 valores estables, pero un `check`
contra la lista de códigos ISO dice lo mismo sin el costo de migrar un tipo cuando algo cambie.

Restricciones:

- `check` de largo y de no-vacío en `display_name` y `locality`.
- `check` de que `department` esté entre los 19 códigos.
- Índice: **ninguno extra**. La PK es la columna por la que filtra la policy; un índice sobre
  `id` ya existe por ser clave primaria. Agregar más sería adorno.

### RLS

Habilitada. Cuatro policies, todas `to authenticated` **y** con predicado de pertenencia: el rol
solo no alcanza, sería autorización por autenticación.

```sql
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);
```

Tres cosas deliberadas: `auth.uid()` envuelto en `select` para que se evalúe una vez y no por
fila; `update` con `using` **y** `with check`, porque sin el segundo alguien podría reasignarle la
fila a otra persona; y ninguna policy para `anon`, que es como se cumple que sin sesión no se ve
nada.

## `public.login_links`

El registro de los enlaces emitidos. Existe por dos motivos concretos, los dos autorizados por
FR-030a: el tope mudo por dirección (FR-006 punto 2) y poder decir **cuál** de los motivos hizo
que un enlace no entre (FR-005), cosa que el mensaje genérico del servicio no permite.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | va en la URL del enlace, junto al token |
| `email` | `text` | a qué dirección se mandó |
| `issued_at` | `timestamptz` | |
| `expires_at` | `timestamptz` | `issued_at + 60 min` (FR-004) |
| `consumed_at` | `timestamptz` nulo | se usó |
| `superseded_at` | `timestamptz` nulo | se pidió uno nuevo para esa dirección |
| `delivery` | `text` | `sent` o `skipped_rate_limit`: el segundo cuenta para el tope pero no mandó nada |

- Índice: `(email, issued_at desc)`, que es exactamente como consultan el tope por hora y la
  invalidación del anterior. Es el único índice, y existe porque hay una consulta real que lo usa.
- **Retención de 7 días** (FR-030a): el borrado corre al pedir un enlace nuevo y al borrar una
  cuenta. Barato y sin infraestructura, y suficiente: la tabla solo crece cuando alguien pide un
  enlace, así que el único residuo posible son las filas posteriores al último pedido, acotadas y
  sin nadie que las consulte. La misma limpieza borra las personas sin confirmar de más de 7 días,
  que son las que nunca abrieron su enlace. Cuando exista el cron diario (M5) pasa a correr ahí
  también, y deja de depender del tráfico.
- Se borra también al borrarse la cuenta, por dirección.

### RLS

Habilitada, y **sin ninguna policy**. Nadie lee esta tabla desde el cliente: la tocan solo las
Server Actions con permisos de servicio. Una tabla con RLS y cero policies no devuelve una sola
fila a `anon` ni a `authenticated`, que es exactamente lo que queremos y lo que el test
`tests/db/login-links.test.ts` demuestra intentándolo.

**Por qué el correo en claro y no un hash**: hay que poder mandar el correo cuando se pide otro
enlace desde la pantalla del enlace vencido, sin que la persona lo reescriba (FR-005b). Un hash lo
impediría. El dato vive 7 días, no es legible por nadie desde el cliente, y se borra con la cuenta.

## Bucket `avatars`

- **No público.** `public = false`: es lo que hace verdadero a FR-026c.
- Ruta: `<id de la persona>/avatar.webp`. La ruta lleva el id adelante para que la policy pueda
  compararlo con la sesión.
- **Los límites del bucket son los del archivo que se guarda, no los de la entrada.** Los 10 MB y
  la lista de tipos de FR-025 son lo que la pantalla acepta *antes* de procesar; lo que llega al
  bucket ya es un WebP de 256 px de unos 20 KB. Entonces `allowed_mime_types = ['image/webp']` y
  `file_size_limit = 262144` (256 KB, holgado para ese cuadrado y cerrado para todo lo demás). Un
  bucket que acepta 10 MB de cualquier imagen es una carga de archivos abierta con otro nombre.
- Sin EXIF: `docs/08` §Encontrable manda borrar el GPS al subir, y el procesado lo hace.

Policies sobre `storage.objects`, las tres que hacen falta: **`select`, `insert` y `update`**. Con
solo `insert`, reemplazar la foto falla en silencio, que es una trampa conocida de Storage. Y
`delete`, para poder quitarla (FR-024b).

```sql
create policy avatars_own on storage.objects
  for all to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
```

Las pantallas nunca arman una URL pública: piden desde el servidor una **URL firmada de 60
segundos**, suficiente para que la imagen cargue y corta para que no sirva de enlace. Una firma ya
emitida **no se puede revocar**: si la foto se quita, el archivo se borra, que es lo que de verdad
la corta. Así la foto no queda accesible con una dirección adivinable, que es el segundo hallazgo
crítico que la spec cerró.

## Lo que NO se crea

- **Ninguna tabla de eventos de medición.** FR-030c pide que los eventos no lleven identificador
  de persona; encadenarlos por visita se hace del lado del cliente y no necesita base.
- **Ninguna tabla de roles ni de permisos** (FR-031): publicar y solicitar no existen, y su
  compuerta es de la historia #10.
- **Ninguna vista.** Una vista bypasea RLS salvo que se la declare `security_invoker`, y acá no
  hace falta ninguna.
- **Ninguna función `security definer`.** No hay consulta que la necesite, y agregarla para
  esquivar un permiso es justamente la trampa que hay que evitar.
