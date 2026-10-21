# Quickstart — Pie del sitio con los enlaces que más se buscan

## Preparar

```sh
pnpm exec supabase start
pnpm exec supabase db reset
pnpm dev            # sin RESEND_API_KEY, para que walk.mjs --user encuentre el enlace
```

Con número de soporte: `SUPPORT_WHATSAPP` definido en `.env.local`. Sin número: sin esa variable.

## 1. Los grupos y los enlaces (US1, SC-001, SC-002)

1. Sin sesión, a 390, abrir `/`, `/animales`, una ficha, `/preguntas/como-se-verifica` y
   `/opinar`, y bajar al final. En cada una: «Animales», «Confianza», «Ayuda», en ese orden, con
   «Animales en adopción», «Publicar un animal» / «Qué dice cada nivel», «Preguntas y respuestas» /
   «Opinar», «Escribinos por WhatsApp», y la firma debajo, sin enlace.
2. Con sesión (`node scripts/walk.mjs --user`), lo mismo en esas pantallas y en `/mi-perfil`: el pie
   es idéntico.
3. Tocar cada enlace: listado, publicar (o su puerta), `/niveles`, `/preguntas`, `/opinar`, y el
   WhatsApp en otra pestaña.
4. En `/animales`, «Animales en adopción» del pie se ve con el subrayado grueso y lleva
   `aria-current="page"`; en `/opinar`, «Opinar».
5. Con el lector de pantalla del sistema (o el árbol de accesibilidad de las devtools): el pie es
   `contentinfo`; cada grupo, un encabezado seguido de una lista con su cantidad.

## 2. Cada ancho y cada situación (US2, SC-003 a SC-007)

1. A 390: grupos apilados, sin desplazamiento lateral; cada enlace mide ≥ 44 px de alto
   (devtools, caja del `a`).
2. A 768: siguen apilados. A 1024 y 1280: tres columnas en un renglón, la firma debajo.
3. Sin `SUPPORT_WHATSAPP`: Ayuda tiene solo «Opinar».
4. Cuenta suspendida (`tests/e2e/suspension.spec.ts` deja una; o una persona sembrada suspendida
   desde Administrar): en su pantalla, solo «Ayuda» y la firma. En `/opinar` con esa cuenta, el pie
   entero; tocar «Animales en adopción» vuelve a la pantalla de la cuenta suspendida.
5. Una «no encontrado» (`/perfil/no-existe`, `/preguntas/no-existe`) y una pantalla de error: el
   pie está igual.
6. Sin sesión, «Publicar un animal» del pie → «Entrar» con la vuelta a publicar. Con sesión y sin
   teléfono verificado → el aviso de verificación pendiente.
7. Texto del navegador al 200 %, a 1280: nada se corta ni se encima.

## 3. Capturas para la revisión

```sh
node scripts/walk.mjs --story 200-pie-del-sitio-enlaces / /animales /preguntas/como-se-verifica /opinar /perfil/no-existe
node scripts/walk.mjs --story 200-pie-del-sitio-enlaces --user /mi-perfil /animales
```

A 390 y 1280, en `.artifacts/200-pie-del-sitio-enlaces/`.
