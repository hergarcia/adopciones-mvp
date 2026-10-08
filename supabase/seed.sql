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

-- Los cuatro animales de Ana para la historia #63 (specs/014-solicitar-adopcion/quickstart.md):
-- Tobi (disponible, castrado, pide teléfono), Luna (disponible, sin castrar, pide identidad), Michi
-- (en proceso) y Nube (disponible), sin ninguna solicitud. Con código fijo, así las rutas de las
-- capturas no cambian de un reset al otro: el trigger que sortea el código se apaga solo para este
-- insert. Las fotos las sube `db reset` desde `supabase/seed-pet-photos/` (config.toml).
alter table public.pets disable trigger pets_assign_code;

insert into public.pet_codes (code)
values ('semana0001'), ('semana0002'), ('semana0003'), ('semana0004')
on conflict (code) do nothing;

insert into public.pets (
  id, owner_id, attempt_id, code, name, species, sex, age_value, age_unit, age_as_of, size,
  is_neutered, vaccines, has_chip, description, department, locality, status, required_level,
  published_at
)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0001', 'Tobi', 'dog', 'male', 2, 'years', current_date, 'medium',
   true, 'up_to_date', true, 'Tranquilo, se lleva bien con otros perros.', 'UY-MO', 'Pocitos',
   'available', 1, now() - interval '4 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0002', 'Luna', 'dog', 'female', 8, 'months', current_date, 'small',
   false, 'incomplete', false, 'Juguetona y curiosa.', 'UY-MO', 'Pocitos',
   'available', 2, now() - interval '3 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0003', 'Michi', 'cat', 'male', 1, 'years', current_date, 'small',
   true, 'up_to_date', false, null, 'UY-MO', 'Pocitos',
   'in_process', 1, now() - interval '2 days'),
  ('bbbbbbbb-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0004', 'Nube', 'cat', 'female', 3, 'years', current_date, 'medium',
   true, 'up_to_date', true, 'Le gusta dormir al sol.', 'UY-MO', 'Pocitos',
   'available', 1, now() - interval '1 day')
on conflict (id) do nothing;

alter table public.pets enable trigger pets_assign_code;

insert into public.pet_photos (id, owner_id, pet_id, position, width, height, thumbhash)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000001', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000002', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000003', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'),
  ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000004', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw')
on conflict (id) do nothing;

-- Una solicitud de Dani a Nube, para la bandeja de Ana (historia #65, quickstart.md): llega como
-- nueva, sin abrir, con su correo de solicitud nueva ya mandado. Tobi sigue sin solicitudes para el
-- recorrido de la #63.
insert into public.applications (
  id, applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name, sent_at, changed_at
)
values (
  'cccccccc-0000-4000-8000-000000000001', '77777777-7777-7777-7777-777777777777',
  'bbbbbbbb-0000-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111',
  gen_random_uuid(),
  '{"housing_type": "apartment", "housing_tenure": "owned", "outdoor_space": "netted_balcony",
    "household": "Mi pareja y yo.", "other_pets": "Una gata de 6 años.", "hours_alone": "4_to_8",
    "moving_plan": "Se viene conmigo.", "experience": "Tuve gatos toda la vida.",
    "vet_budget": "yes", "why_this_pet": "Porque es tranquila y le gusta el sol, como a nosotros."}',
  'Nube', now() - interval '2 days', now() - interval '2 days'
)
on conflict (id) do nothing;

-- Una solicitud aceptada de Carla a Michi, para «¿A quién se lo diste?» (historia #67,
-- quickstart.md): Ana la elige al marcar adoptado y lee el compromiso. Michi está castrado, así que
-- el compromiso no lleva la línea de la castración; Luna, sin solicitudes aceptadas, muestra el vacío.
insert into public.applications (
  id, applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name, status, sent_at,
  changed_at
)
values (
  'cccccccc-0000-4000-8000-000000000002', '55555555-5555-5555-5555-555555555555',
  'bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
  gen_random_uuid(),
  '{"housing_type": "house", "housing_tenure": "owned", "outdoor_space": "yard",
    "household": "Vivo sola.", "other_pets": "Ninguna.", "hours_alone": "4_to_8",
    "moving_plan": "Se viene conmigo.", "experience": "Tuve un gato de chica.",
    "vet_budget": "yes", "why_this_pet": "Porque es tranquilo y mi casa tiene patio."}',
  'Michi', 'accepted', now() - interval '2 days', now() - interval '1 day'
)
on conflict (id) do nothing;

insert into public.application_reviews (application_id, opened_at, first_response_at, accepted_at)
values (
  'cccccccc-0000-4000-8000-000000000002', now() - interval '1 day', now() - interval '1 day',
  now() - interval '1 day'
)
on conflict (application_id) do nothing;

-- Dos adopciones por el sitio de animales de Ana, para el seguimiento (historia #69,
-- specs/017-seguimiento-adopcion/quickstart.md): Rocco, a Dani, marcado hace 31 días y con el
-- compromiso aceptado —la primera vuelta de la tarea le pide el seguimiento— y Pancho, a Beto,
-- marcado hace 10 días, que todavía no.
alter table public.pets disable trigger pets_assign_code;

insert into public.pet_codes (code)
values ('semana0005'), ('semana0006')
on conflict (code) do nothing;

insert into public.pets (
  id, owner_id, attempt_id, code, name, species, sex, age_value, age_unit, age_as_of, size,
  is_neutered, vaccines, has_chip, description, department, locality, status, required_level,
  published_at, status_changed_at, expires_at
)
values
  ('bbbbbbbb-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0005', 'Rocco', 'dog', 'male', 3, 'years', current_date, 'large',
   true, 'up_to_date', true, 'Grandote y mimoso.', 'UY-MO', 'Pocitos',
   'adopted', 1, now() - interval '45 days', now() - interval '31 days', null),
  ('bbbbbbbb-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(), 'semana0006', 'Pancho', 'cat', 'male', 2, 'years', current_date, 'medium',
   true, 'up_to_date', false, 'Duerme todo el día.', 'UY-MO', 'Pocitos',
   'adopted', 1, now() - interval '20 days', now() - interval '10 days', null)
on conflict (id) do nothing;

alter table public.pets enable trigger pets_assign_code;

insert into public.pet_photos (id, owner_id, pet_id, position, width, height, thumbhash)
values
  ('aaaaaaaa-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000005', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'),
  ('aaaaaaaa-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   'bbbbbbbb-0000-4000-8000-000000000006', 0, 1280, 1600, 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw')
on conflict (id) do nothing;

insert into public.applications (
  id, applicant_id, pet_id, publisher_id, attempt_id, answers, pet_name, status, close_reason,
  sent_at, changed_at
)
values
  ('cccccccc-0000-4000-8000-000000000003', '77777777-7777-7777-7777-777777777777',
   'bbbbbbbb-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(),
   '{"housing_type": "house", "housing_tenure": "owned", "outdoor_space": "yard",
     "household": "Mi pareja y yo.", "other_pets": "Ninguna.", "hours_alone": "4_to_8",
     "moving_plan": "Se viene conmigo.", "experience": "Tuve perros toda la vida.",
     "vet_budget": "yes", "why_this_pet": "Porque necesita patio y nosotros tenemos."}',
   'Rocco', 'closed', 'handed_over', now() - interval '40 days', now() - interval '31 days'),
  ('cccccccc-0000-4000-8000-000000000004', '66666666-6666-6666-6666-666666666666',
   'bbbbbbbb-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111',
   gen_random_uuid(),
   '{"housing_type": "apartment", "housing_tenure": "rented", "outdoor_space": "netted_balcony",
     "household": "Vivo solo.", "other_pets": "Ninguna.", "hours_alone": "4_to_8",
     "moving_plan": "Se viene conmigo.", "experience": "Tuve un gato.",
     "vet_budget": "yes", "why_this_pet": "Porque es tranquilo, como mi casa."}',
   'Pancho', 'closed', 'handed_over', now() - interval '15 days', now() - interval '10 days')
on conflict (id) do nothing;

insert into public.application_reviews (application_id, opened_at, first_response_at, accepted_at)
values
  ('cccccccc-0000-4000-8000-000000000003', now() - interval '39 days', now() - interval '39 days',
   now() - interval '39 days'),
  ('cccccccc-0000-4000-8000-000000000004', now() - interval '14 days', now() - interval '14 days',
   now() - interval '14 days')
on conflict (application_id) do nothing;

insert into public.adoptions (
  pet_id, publisher_id, kind, application_id, adopter_id, includes_neuter, attempt_id, marked_at,
  adopter_accepted_at
)
values
  ('bbbbbbbb-0000-4000-8000-000000000005', '11111111-1111-1111-1111-111111111111', 'site',
   'cccccccc-0000-4000-8000-000000000003', '77777777-7777-7777-7777-777777777777', false,
   gen_random_uuid(), now() - interval '31 days', now() - interval '30 days'),
  ('bbbbbbbb-0000-4000-8000-000000000006', '11111111-1111-1111-1111-111111111111', 'site',
   'cccccccc-0000-4000-8000-000000000004', '66666666-6666-6666-6666-666666666666', false,
   gen_random_uuid(), now() - interval '10 days', null)
on conflict do nothing;
