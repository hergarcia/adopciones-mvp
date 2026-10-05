# Quickstart — Que la ficha y el listado de animales abran livianos en el teléfono

Cómo ver la historia andando en local, contra el build de producción.

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm build && pnpm start`.
3. **El freno:** `pnpm exec playwright test tests/e2e/animales-rendimiento.spec.ts`. Pasa, y la
   anotación `rendimiento` de cada pantalla dice el peso de apertura, el peso total y el LCP. Ficha,
   no disponible y listado ≤ 150 KB de apertura; la portada ≤ su valor de partida (anotado en el PR).
4. **El freno falla:** sumar a propósito un `import` estático pesado a `share-button.tsx` (la
   cáscara), volver a armar y correr el paso 3: falla con «ficha: N KB de apertura, M KB por encima
   de 150». Sacar el agregado.
5. **«Compartir» sin señal:** en Chrome de escritorio, abrir `/animales/<código>` de un animal
   sembrado, esperar «Compartir», en DevTools → Network poner *Offline*, tocar «Compartir»: se copia y
   aparece «Enlace copiado». Con el permiso del portapapeles bloqueado para el sitio, aparece el
   camino de copiar a mano.
6. **Sin JavaScript:** DevTools → *Disable JavaScript*, abrir una ficha (todas las fotos y los
   datos) y el listado (filtrar por departamento con el botón del formulario, «Ver más»).
7. **Capturas:** `node scripts/walk.mjs --story ficha-listado-livianos /animales /animales/<código>`
   en la rama y en `main`: tienen que ser iguales.
