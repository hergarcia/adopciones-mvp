-- Datos sintéticos para desarrollo local. Nada de esto es una persona real: son direcciones
-- @example.test, que la RFC 2606 reserva justamente para esto y que no se le pueden mandar a
-- nadie por accidente (docs/01 §Privacidad, Ley 18.331).
--
-- Tres personas, para poder ver las tres formas que toma una pantalla sin tener que fabricarlas
-- a mano cada vez: una con perfil completo y foto, una con perfil completo y sin foto —las
-- iniciales de FR-024—, y una con la cuenta creada y el perfil sin terminar, que es la que
-- demuestra la compuerta de FR-016.
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
   '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', '')
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
   'email', now(), now())
on conflict do nothing;

-- Ana: rescatista de Montevideo. Lucía: adoptante del interior. La tercera no tiene perfil a
-- propósito: es la que demuestra la compuerta.
--
-- Las dos van sin foto. Sembrar una fila con `avatar_path` sin el archivo detrás daría una foto
-- que no existe, y el archivo no se puede sembrar desde SQL: la foto se prueba subiéndola.
insert into public.profiles (id, display_name, department, locality, is_rescuer, avatar_path)
values
  ('11111111-1111-1111-1111-111111111111', 'Ana García', 'UY-MO', 'Pocitos', true, null),
  ('22222222-2222-2222-2222-222222222222', 'Lucía Fernández', 'UY-CA', 'Atlántida', false, null)
on conflict (id) do nothing;
