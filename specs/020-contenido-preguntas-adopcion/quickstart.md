# Quickstart — Preguntas y respuestas (#8)

Cómo comprobar la historia de punta a punta en local.

## Preparar

```sh
pnpm exec supabase start
pnpm exec supabase db reset   # migraciones + semillas
pnpm build && pnpm start      # o pnpm dev para mirar
```

## Comprobar

1. **Pruebas**: `pnpm test` (`lib/questions/*.test.ts`, `question-events.test.ts`,
   `site-share-metadata.test.ts`, `tests/questions/*.test.ts`) y `pnpm e2e` (`preguntas.spec.ts`).
2. **Capturas**: `node scripts/walk.mjs --story contenido-preguntas-adopcion /preguntas
   /preguntas/como-se-verifica /preguntas/que-exige-uruguay /preguntas/no-existe /niveles` a 390 y
   1280; con sesión (`--user`), `/verificar-identidad` en la vista de pedir. Mirar: el primer
   párrafo a la vista sin bajar a 390, una sola tirita por pantalla, el renglón nuevo del pie.
3. **Sin sesión y sin JavaScript**: abrir `/preguntas` y cada página con JavaScript apagado: todo se
   lee y cada enlace lleva.
4. **Suspendida**: entrar como una persona sembrada, suspenderla desde Administrar con otra, y abrir
   `/preguntas` y una página: la pantalla de cuenta suspendida, cuyo pie no tiene «Preguntas y
   respuestas».
5. **Ida y vuelta desde el pedido**: con sesión de nivel 1 sin pedido, `/verificar-identidad`, tocar
   «Cómo se verifica y qué se hace con tu cédula», volver atrás con el navegador: la vista de pedir,
   sin aceptar.
6. **Vista previa**: `curl -s -A WhatsApp/2 http://localhost:3000/preguntas/reconocer-una-estafa |
   grep og:` muestra la pregunta, la descripción y la imagen; `curl -s
   http://localhost:3000/robots.txt` muestra `Allow: /preguntas` para los lectores de vista previa.
7. **Medición**: con `pnpm start`, abrir el índice desde el pie, una página desde el índice y tocar
   la acción: la consola del servidor muestra `questions_index_viewed {"origin":"footer"}`,
   `question_viewed {"page":…,"origin":"index"}` y `question_action_used` con la misma `visita=`.
   Con sesión de nivel 1: abrir el pedido, tocar el enlace a «Cómo se verifica», volver, aceptar y
   enviar: `identity_request_started`, `question_viewed {"origin":"identity_request"}`,
   `identity_consent_accepted` e `identity_request_sent` con la misma `visita=` (FR-052).
8. **Acciones heredadas**: sin sesión, tocar «Verificar mi identidad» al final de «Cómo se
   verifica» y «Publicar un animal» al final de «Antes de entregar»: piden ingresar y, después,
   siguen en esa acción; con la identidad verificada, «Verificar mi identidad» muestra que lo está y
   desde cuándo.
9. **Barra final y sin imágenes**: `/preguntas/como-se-verifica/` lleva a la misma página; con las
   imágenes bloqueadas en el navegador, todo el texto se lee.
10. **Fuentes**: abrir cada enlace de `que-exige-uruguay` y compararlo con la fila de `sources.md`.
