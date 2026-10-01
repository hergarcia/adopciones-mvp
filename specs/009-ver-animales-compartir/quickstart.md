# Quickstart: ver la historia funcionando

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + seed
node scripts/seed-pets.mjs       # si existe (pulido opcional): cinco animales de Ana y uno de Lucía (oculto)
pnpm dev                         # sin RESEND_API_KEY, para que walk.mjs --user lea el enlace
```

Con el script, Ana tiene nivel 1 y sus animales están en zonas distintas de la de su perfil; Lucía
tiene un número a medias, así que su animal no está a la vista. Sin el script, publicar a mano un
par de animales con Ana y, para ver uno oculto, empezar después un cambio de número con ella.

## Recorrer

1. Sin sesión, abrir `/animales`: el total, 24 o menos animales, los filtros sin marcar.
2. Marcar «Gato», «Cachorro» y «Canelones»: la dirección pasa a
   `/animales?especie=gato&edad=cachorro&departamento=canelones`; el total cambia; volver atrás
   sale del listado (no desmarca).
3. Tocar un animal: la ficha, con todas las fotos, los datos, «Rescatista o refugio» si
   corresponde y «Teléfono verificado». Volver atrás: mismo lugar.
4. Abrir `/animales/{code}` del animal de Lucía sin sesión: «no disponible por ahora» con «Entrar».
5. Abrir `/animales/zzzzzzzzzz`: «no está publicado».
6. `curl -s http://localhost:3000/animales/{code} | grep og:` → título, zona e imagen; la imagen
   (`curl -sI …/imagen?v=…`) responde `image/jpeg`. La del animal de Lucía: sin `og:image`, y
   `/imagen` responde 404.
7. Con Ana (`node scripts/walk.mjs --user`): «Mis animales» tiene «Ver ficha» y «Compartir»; en la
   ficha propia aparece «Editar».
8. Sin JavaScript (DevTools → Disable JavaScript): el listado aplica filtros con «Ver resultados» y
   «Ver más» muestra 48 desde el principio; la ficha se ve entera y sin «Compartir».

## Compuertas

```bash
pnpm lint && pnpm typecheck && pnpm test     # incluye tests/db/listed-pets.test.ts
pnpm e2e                                      # tests/e2e/animales.spec.ts y animales-rendimiento.spec.ts
node scripts/walk.mjs --story ver-animales /animales /animales/{code}
```
