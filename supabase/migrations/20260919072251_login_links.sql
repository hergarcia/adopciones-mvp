create table public.login_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  superseded_at timestamptz,
  delivery text not null,

  constraint login_links_delivery_valid check (delivery in ('sent', 'skipped_rate_limit', 'failed')),
  constraint login_links_expires_after_issue check (expires_at > issued_at)
);

comment on table public.login_links is
  'Los enlaces de ingreso emitidos. Existe por dos motivos, los dos autorizados por FR-030a de la '
  'historia #9: el tope mudo por dirección, y poder decir CUÁL de los motivos hizo que un enlace '
  'no entre (vencido, ya usado, reemplazado), que el mensaje genérico del servicio no permite.';

comment on column public.login_links.delivery is
  'sent cuenta para el tope por dirección. skipped_rate_limit no mandó correo pero sí cuenta: la '
  'respuesta que ve quien pide es idéntica, para no revelar si esa dirección tiene cuenta '
  '(FR-006a). failed no cuenta: un envío que no salió no puede gastarle el cupo a nadie (FR-003a).';

comment on column public.login_links.email is
  'En claro, no hasheado: hay que poder mandarle otro enlace desde la pantalla del enlace vencido '
  'sin que la persona reescriba la dirección (FR-005b). Vive siete días y no lo lee nadie desde '
  'el cliente.';

create index login_links_email_issued_at_idx on public.login_links (email, issued_at desc);

-- RLS habilitada y CERO policies: nadie lee esta tabla desde el cliente, ni siquiera la dueña de
-- la dirección. La tocan solo las acciones con permisos de servicio. Una tabla con RLS y sin
-- policies no devuelve una sola fila a anon ni a authenticated, y tests/db/login-links.test.ts lo
-- demuestra intentándolo.
alter table public.login_links enable row level security;
