# Quickstart: ver la historia funcionando

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed (Ana con nivel 1; Lucía administra)
pnpm dev                         # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

Publicar dos o tres animales con Ana (`node scripts/walk.mjs --user` entra como ella). Para mover
el tiempo sin esperar 23 días, con la base local:

```sql
update public.pets set expires_at = now() + interval '6 days 23 hours' where name = 'Tobi';
update public.pets set expires_at = now() - interval '1 minute' where name = 'Luna';
```

La tarea corre cada 5 minutos sola; para no esperar, `select public.pet_lifecycle_tick();`
(necesita `app_url` y `cron_secret` en Vault, como la tarea de identidad) o un `POST` a
`/api/cron/publicaciones` con `x-cron-secret`.

## Recorrer

1. Mis animales: Tobi con «Vence el …» marcado como próximo y «Renovar» a la vista; Luna con el
   sello «Vencida» y «Volver a publicar» en «Más acciones».
2. Marcar a Tobi «En proceso»: en `/animales` y en su ficha, el sello. Marcarlo adoptado: sale de
   `/animales`, su ficha dice «Adoptado» y lleva al listado; `curl -s …/animales/{code} | grep og:`
   dice que fue adoptado, con imagen.
3. Pausar a otro: su enlace sin sesión dice que está pausado, sin foto ni nombre; `og:image` no
   está. Reanudar: vuelve, con vencimiento a 30 días.
4. Después de la tarea: el correo «¿Tobi sigue disponible?» en `.artifacts/mail/`. Abrir su
   «Sigue disponible» sin sesión: «Sigue publicado hasta …». Abrirlo de nuevo: la misma fecha.
   Cambiar una letra del token: «Este enlace no sirve».
5. Entrando como Lucía, que administra: Mi perfil muestra «Revisar publicaciones (N)»; en
   `/revision/publicaciones`, marcar una revisada y dar de baja otra por venta: sale del listado,
   su enlace dice «no está publicado», el correo de baja queda en `.artifacts/mail/`, y Ana la ve
   en Mis animales con el motivo y solo «Borrar».
6. Con Ana, editar una publicación revisada: vuelve a la cola marcada como editada.
7. Borrar un animal: pide confirmar; después su enlace dice «no está publicado».

## Compuertas

```bash
pnpm lint && pnpm typecheck && pnpm test     # incluye tests/db/pet-lifecycle.test.ts y pet-reviews.test.ts
pnpm e2e                                      # tests/e2e/ciclo-de-vida.spec.ts
node scripts/walk.mjs --story mantener-al-dia /mis-animales /revision/publicaciones
```
