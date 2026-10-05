# Quickstart — Portada del sitio (#61)

Cómo comprobar la historia de punta a punta en local.

## Preparar

```sh
pnpm exec supabase start
pnpm exec supabase db reset   # migraciones + semillas
pnpm build && pnpm start      # o pnpm dev para mirar
```

## Comprobar

1. **Pruebas**: `pnpm test` (la medición: `home-events`, `listing-events`, `site-share-version`) y
   `pnpm e2e` (`portada.spec.ts`, más el freno de `animales-rendimiento.spec.ts`, que mide `/`).
2. **Capturas**: `node scripts/walk.mjs --story portada-del-sitio /` a 390 y 1280; con sesión,
   `--user`. Mirar: el nombre una sola vez, la tirita como único bloque perforado, 2 columnas a 390
   y 4 a 1280, nada angosto con blanco al costado.
3. **Vacío**: con la base sin animales a la vista (`db reset` y pausar los sembrados, o una base sin
   semillas de animales), `/` muestra «Todavía no hay animales publicados.» con «Publicá el
   primero», y el resto entero.
4. **Error**: con la base detenida (`pnpm exec supabase stop`) y `pnpm start` corriendo, `/` muestra
   la frase, las acciones, los pasos y lo verificado, y en el lugar de los animales «No pudimos
   cargar los animales.» con «Ver animales en adopción».
5. **Sin JavaScript**: abrir `/` con JavaScript apagado en las herramientas del navegador: todo se
   lee y cada enlace lleva.
6. **Vista previa**: `curl -s http://localhost:3000/ | grep og:` muestra título, descripción e
   imagen; `curl -sI http://localhost:3000/imagen` da `image/jpeg`. Abrir la imagen: el nombre, la
   frase y el cartel, sin animales.
7. **Medición**: con `pnpm start`, la consola del servidor muestra `[medición] home_viewed`, y al
   tocar «Publicar un animal», `home_publish_tapped` con la misma `visita=`.
