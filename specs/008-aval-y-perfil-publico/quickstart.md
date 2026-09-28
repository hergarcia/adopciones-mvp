# Quickstart: probar la historia en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm dev` **sin** `RESEND_API_KEY`, para que los enlaces de ingreso queden en `.artifacts/mail/`.
3. El seed (research R17) deja cada estado a mano, con `public_id` fijos: Ana en nivel 1, Lucía y
   Marta en nivel 0, **Carla** en nivel 3 (la avala Beto), **Beto** en nivel 2, **Dani** en nivel 2
   sin avales dados ni recibidos, y **Eva** en nivel 3 con 50 avales (`aval-01@example.test` …
   `aval-50@example.test`, sin contraseña).
4. Perfil público sin sesión, en una ventana privada: `/perfil/<id de Carla>` (nivel 3 y «Beto …»
   entre quienes responden), `/perfil/<id de Beto>` (nivel 2 con «Identidad verificada en …»),
   `/perfil/<id de Ana>` (solo la chapita de nivel 1), `/perfil/<id de Marta>` («Todavía no se
   verificó»), `/perfil/AAAAAAAAAAAAAAAAAAAAAA` («Este perfil no existe»). Con JavaScript apagado, el
   de Carla se lee entero.
5. Avalar: `node scripts/walk.mjs --user` como Dani; abrir el perfil de Beto, «Avalar», confirmar.
   Recargar el de Beto sin sesión: nivel 3 y «Dani …». Retirar desde el mismo perfil.
6. «Mis avales» como Beto: quitar el aval de Dani; como Dani, abrir el perfil de Beto y ver que ese
   aval ya no se puede dar.
7. Regla de contacto: editar el perfil con «fijo 2401 2345» en la localidad y «@juanrescata» en el
   nombre; ver cada error con su fragmento.
8. Capturas para el design-reviewer: `node scripts/walk.mjs --story aval-y-perfil-publico
   /perfil/<id de Carla> /perfil/<id de Marta> /perfil/AAAAAAAAAAAAAAAAAAAAAA /niveles?nivel=2`, y con
   `--user` `/perfil/<id de Beto>` (lugar de avalar), `/mis-avales`, `/mi-perfil`,
   `/verificar-identidad`.
9. `pnpm verify`.
