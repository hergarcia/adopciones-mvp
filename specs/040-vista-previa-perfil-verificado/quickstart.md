# Quickstart: probar la vista previa del perfil con el nivel

Con Supabase local y la app corriendo (`pnpm exec supabase start`, `pnpm exec supabase db reset`,
`pnpm dev`).

1. **Vista previa con nivel.** `curl -s -A 'WhatsApp/2.23' http://localhost:3000/perfil/SemillaCarla0000000005 | sed -n '/<head>/,/<\/head>/p'`
   → `og:description` «Identidad verificada y avalada» (Carla tiene aval en el seed) y `og:image`
   con `/perfil/nivel/3/imagen?v=`. Sin `La Paloma`, sin `/foto`.
2. **La imagen.** Abrir `http://localhost:3000/perfil/nivel/3/imagen?v=x` → la tarjeta con el nivel
   en verde en el centro y el sitio abajo. Recortar al cuadrado central (x 285–915): el nivel entra
   entero. `.../nivel/0/imagen` y `.../nivel/abc/imagen` → 404.
3. **Sin nada verificado.** Con una persona sin teléfono verificado (`newPerson(..., { level: 0 })`
   en un e2e, o una del seed sin teléfono): el `<head>` es el de hoy, sin `og:image` ni
   `og:description`.
4. **«Mi perfil».** Entrar como Carla (`node scripts/walk.mjs --user`): en «Tu perfil público», la
   línea entre el título y «Copiar el enlace». Como una persona sin teléfono verificado: sin línea.
5. **Medición.** Con `pnpm dev` sin clave de PostHog, cada momento sale en la consola del servidor
   como `[medición] …`:
   copiar el enlace desde «Mi perfil» → `profile_link_copied` con `from: my_profile` y `owner_level`;
   abrir el perfil de Carla en otra sesión → `public_profile_viewed` con `origin` y `owner_level: 3`.
6. **Compuertas.** `pnpm gates:affected`.
