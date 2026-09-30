-- Datos sintéticos para desarrollo local. Nada de esto es una persona real: son direcciones
-- @example.test, que la RFC 2606 reserva justamente para esto y que no se le pueden mandar a
-- nadie por accidente (docs/01 §Privacidad, Ley 18.331).
--
-- Cuatro personas, para poder ver las formas que toma una pantalla sin tener que fabricarlas a
-- mano cada vez: tres con perfil completo —una con el teléfono verificado, una con un número a
-- medias y una sin teléfono (historia #10)— y una con la cuenta creada y el perfil sin terminar,
-- que es la que demuestra la compuerta de FR-016 de la historia #9.
--
-- Y, para la historia #12, cuatro personas más que dejan a la vista cada nivel del perfil público y
-- el aval: Carla (nivel 3, la avala Beto), Beto (nivel 2), Dani (nivel 2, sin avales: la que avala
-- en las capturas y el e2e) y Eva (nivel 3 con 50 avales, para medir el perfil más pesado). Los 50
-- que avalan a Eva no tienen contraseña ni pedidos en revisión: el driver no los ofrece y la cola de
-- revisión de Lucía no cambia. Cada perfil lleva su `public_id` fijo, así las rutas del perfil
-- público no cambian de un reset al otro.
--
-- La contraseña existe solo para que el driver de capturas pueda abrir sesión con `--user`: el
-- producto no tiene contraseñas y nunca las va a pedir (FR-001).

-- Las columnas de token van en cadena vacía y no en NULL: el servicio de autenticación las
-- consulta sin proteger contra nulos, y una persona sembrada con NULL rompe `listUsers` y
-- `generateLink` con un «Database error finding user» que no dice nada de la causa.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  email_change, phone_change, phone_change_token, reauthentication_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'ana@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'lucia@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'nueva@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'marta@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555',
   'authenticated', 'authenticated', 'carla@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666',
   'authenticated', 'authenticated', 'beto@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777',
   'authenticated', 'authenticated', 'dani@example.test',
   crypt('siembra-local', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888',
   'authenticated', 'authenticated', 'eva@example.test', '', now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', '')
on conflict (id) do nothing;

-- Los 50 que avalan a Eva: `aval-01@example.test` … `aval-50@example.test`, sin contraseña.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  email_change, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  ('99999999-9999-9999-9999-' || lpad(n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', 'aval-' || lpad(n::text, 2, '0') || '@example.test',
  '', now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''
from generate_series(1, 50) as n
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"ana@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"lucia@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"nueva@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   '{"sub":"44444444-4444-4444-4444-444444444444","email":"marta@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
   '{"sub":"55555555-5555-5555-5555-555555555555","email":"carla@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666',
   '{"sub":"66666666-6666-6666-6666-666666666666","email":"beto@example.test","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777',
   '{"sub":"77777777-7777-7777-7777-777777777777","email":"dani@example.test","email_verified":true}',
   'email', now(), now())
on conflict do nothing;

-- Ana: rescatista de Montevideo. Lucía: adoptante del interior. Marta: adoptante de Salto, sin
-- teléfono. La cuarta no tiene perfil a propósito: es la que demuestra la compuerta.
--
-- Casi todas van sin foto. Beto tiene una, sintética: el archivo no se siembra desde SQL sino desde
-- `supabase/seed-avatars/`, que `supabase start` y `db reset` suben al bucket
-- (`[storage.buckets.avatars]` en config.toml). Así el perfil con foto se revisa sin subirla a mano.
insert into public.profiles (id, public_id, display_name, department, locality, is_rescuer, avatar_path)
values
  ('11111111-1111-1111-1111-111111111111', 'SemillaAna000000000001', 'Ana García', 'UY-MO', 'Pocitos', true, null),
  ('22222222-2222-2222-2222-222222222222', 'SemillaLucia0000000002', 'Lucía Fernández', 'UY-CA', 'Atlántida', false, null),
  ('44444444-4444-4444-4444-444444444444', 'SemillaMarta0000000004', 'Marta Suárez', 'UY-SA', 'Salto', false, null),
  ('55555555-5555-5555-5555-555555555555', 'SemillaCarla0000000005', 'Carla Méndez', 'UY-MO', 'Malvín', true, null),
  ('66666666-6666-6666-6666-666666666666', 'SemillaBeto00000000006', 'Beto Silva', 'UY-CO', 'Juan Lacaze', false,
   '66666666-6666-6666-6666-666666666666/avatar.webp'),
  ('77777777-7777-7777-7777-777777777777', 'SemillaDani00000000007', 'Dani Rodríguez', 'UY-MO', 'Cordón', false, null),
  ('88888888-8888-8888-8888-888888888888', 'SemillaEva000000000008', 'Eva Pereira', 'UY-MA', 'Piriápolis', true, null)
on conflict (id) do nothing;

insert into public.profiles (id, public_id, display_name, department, locality, is_rescuer)
select
  ('99999999-9999-9999-9999-' || lpad(n::text, 12, '0'))::uuid,
  'SemillaAval' || lpad(n::text, 11, '0'),
  'Aval ' || lpad(n::text, 2, '0'),
  'UY-MO', 'Centro', false
from generate_series(1, 50) as n
on conflict (id) do nothing;

-- Ana con el teléfono verificado y Lucía con un número a medias: los tres estados de «Mi perfil»
-- (historia #10) sin fabricarlos a mano. Lucía va **sin código**: su resumen necesita la clave de
-- servicio, que no está en la base ni se escribe acá, y vencería a los 10 minutos del reset. La
-- pantalla del código se dibuja con el número a medias; el código se prueba pidiéndolo.
insert into public.phones (user_id, verified_number, verified_at, pending_number, pending_since)
values
  ('11111111-1111-1111-1111-111111111111', '+59899123456', '2026-09-20 14:00-03', null, null),
  ('22222222-2222-2222-2222-222222222222', null, null, '+59898765432', now()),
  ('55555555-5555-5555-5555-555555555555', '+59899200005', '2026-08-01 10:00-03', null, null),
  ('66666666-6666-6666-6666-666666666666', '+59899200006', '2026-08-10 10:00-03', null, null),
  ('77777777-7777-7777-7777-777777777777', '+59899200007', '2026-09-01 10:00-03', null, null),
  ('88888888-8888-8888-8888-888888888888', '+59899200008', '2026-07-01 10:00-03', null, null)
on conflict (user_id) do nothing;

insert into public.phones (user_id, verified_number, verified_at)
select
  ('99999999-9999-9999-9999-' || lpad(n::text, 12, '0'))::uuid,
  '+598991000' || lpad(n::text, 2, '0'),
  '2026-07-01 10:00-03'
from generate_series(1, 50) as n
on conflict (user_id) do nothing;

-- Las identidades verificadas de los niveles 2 y 3. Beto se verificó el 14 de agosto: su perfil
-- público dice «agosto de 2026» y nunca el día.
insert into public.identity_verifications (user_id, verified_on)
values
  ('55555555-5555-5555-5555-555555555555', '2026-08-02'),
  ('66666666-6666-6666-6666-666666666666', '2026-08-14'),
  ('77777777-7777-7777-7777-777777777777', '2026-09-03'),
  ('88888888-8888-8888-8888-888888888888', '2026-07-10')
on conflict (user_id) do nothing;

insert into public.identity_verifications (user_id, verified_on)
select ('99999999-9999-9999-9999-' || lpad(n::text, 12, '0'))::uuid, '2026-07-15'
from generate_series(1, 50) as n
on conflict (user_id) do nothing;

-- Beto avala a Carla; los 50 avalan a Eva, un día cada uno, así el orden del más reciente al más
-- viejo se ve.
insert into public.vouches (voucher_id, vouchee_id, created_at)
values (
  '66666666-6666-6666-6666-666666666666',
  '55555555-5555-5555-5555-555555555555',
  '2026-09-03 12:00-03'
)
on conflict do nothing;

insert into public.vouches (voucher_id, vouchee_id, created_at)
select
  ('99999999-9999-9999-9999-' || lpad(n::text, 12, '0'))::uuid,
  '88888888-8888-8888-8888-888888888888',
  timestamptz '2026-09-20 12:00-03' - make_interval(days => n)
from generate_series(1, 50) as n
on conflict do nothing;

-- Lucía administra (historia #11): en local, la cola de revisión se ve entrando como ella. En la
-- nube lo designa el equipo desde la consola, nunca el sitio (FR-013a).
insert into public.admins (user_id)
values ('22222222-2222-2222-2222-222222222222')
on conflict (user_id) do nothing;

-- Adónde llama la tarea de los correos de vencimiento y con qué secreto: el mismo `CRON_SECRET` de
-- desarrollo de .env.example. `host.docker.internal` es la máquina vista desde el contenedor de la
-- base. Si Vault no está, el seed sigue: sin secretos la tarea no llama a nada.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'app_url') then
    perform vault.create_secret('http://host.docker.internal:3000', 'app_url');
  end if;
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret('desarrollo-local', 'cron_secret');
  end if;
exception when others then
  raise notice 'seed: sin Vault, la tarea de los correos de vencimiento no va a llamar a nada';
end;
$$;
