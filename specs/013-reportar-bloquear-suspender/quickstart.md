# Quickstart: ver la historia funcionando

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed (Ana publica; Lucía administra)
pnpm dev                         # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

Ana tiene nivel 1 y animales publicados; Lucía administra. Para tener un aval que cortar, que Marta
(nivel 2) avale a Ana desde su perfil antes de empezar.

## Recorrer

1. Como Marta (`node scripts/walk.mjs --user` con su correo), abrir el perfil de Ana → «Reportar» →
   «Vende animales» → texto → enviar: confirmación anónima y «Bloquear a Ana». Reportarla de nuevo
   por el mismo motivo: «Ya la reportaste por este motivo».
2. Bloquear a Ana: el perfil dice que la bloqueaste, con «Desbloquear» y «Reportar». En
   `/animales` no están los animales de Ana y la cantidad bajó; el enlace de uno dice que lo publicó
   alguien que bloqueaste. El aval de Marta a Ana ya no está en el perfil de Ana.
3. «Mi perfil» → «Mis bloqueos»: Ana, con «Desbloquear». Desbloquear: los animales vuelven; el aval
   no.
4. Como Lucía: «Mi perfil» → «Revisar reportes (1)» → el reporte con el historial de Ana →
   «Suspender» con un motivo. En `.artifacts/mail/` está el correo a Ana con el motivo.
5. Sin sesión: `/perfil/{id de Ana}` dice que el perfil no existe; `/animales` no tiene sus
   animales; el enlace de uno dice que no está publicado; `curl -s …/animales/{code} | grep og:`
   no trae foto ni nombre.
6. Como Ana: cualquier pantalla lleva a «Tu cuenta está suspendida», con el motivo y el correo de
   ayuda.
7. Como otra cuenta, verificar el número de Ana: después del código, «Ese número no se puede usar».
8. Como Lucía: «Cuentas suspendidas» → «Reactivar». Ana vuelve: perfil, animales con el mismo
   enlace y los mismos días que les quedaban.
9. Retención: suspender a Ana de nuevo, borrar su cuenta desde la pantalla de suspendida, y con otra
   cuenta intentar el número: no se puede. Con la base local:

```sql
update public.withheld_numbers set until = now() - interval '1 minute';
```

   y el número vuelve a poder verificarse.

## Compuertas

`pnpm lint && pnpm typecheck && pnpm test` en cada commit; `pnpm verify` antes del PR.
