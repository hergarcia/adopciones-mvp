-- «Creación de cuenta empezada» tiene que dispararse cuando nace una cuenta, no cada vez que entra
-- alguien sin perfil: quien lo dejó a medias y vuelve otro día ya la empezó, y contarlo de nuevo
-- inflaría el embudo para siempre sin que nada lo cierre (FR-032).
--
-- El dato existe gratis al emitir el enlace —`generateLink` devuelve la persona, y una que nunca
-- ingresó no tiene fecha de último ingreso— y no al abrirlo, que es cuando hace falta. Por eso
-- viaja en la fila.
alter table public.login_links
  add column first_sign_in boolean not null default false;

comment on column public.login_links.first_sign_in is
  'Si al emitir este enlace la dirección todavía no había ingresado nunca. Decide cuál de los dos '
  'eventos de medición se dispara al abrirlo (FR-032).';
