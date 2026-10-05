# Contrato — Portada del sitio (#61)

Lo que la portada promete hacia afuera: a quien la mira, a quien la pega en un grupo y a la medición.

## `/` (la portada)

- Responde 200 con o sin sesión; nunca redirige (FR-021).
- El HTML del servidor trae: un solo `h1` (la frase), «Publicar un animal» (`a` a
  `/mis-animales/publicar`), «Ver animales en adopción» (`a` a `/animales`), la `ol` de tres pasos,
  «Si querés adoptar», y hasta 8 `a` a `/animales/<código>` en el orden de los primeros 8 de
  `/animales`, más «Ver todos» (`a` a `/animales`) cuando hay al menos uno (FR-022).
- `APP_NAME` aparece una sola vez en el `body` visible (la cabecera). El texto «construyendo» no
  aparece.
- Metadatos: `title` = `APP_NAME` (absoluto); `description` = la frase; `canonical` = `/`;
  `robots` = `noindex, nofollow` mientras `INDEXING_ENABLED` sea `false`.
- Open Graph: `og:type` `website`, `og:site_name` y `og:title` = `APP_NAME`, `og:description` = la
  frase, `og:image` = `/imagen?v=<versión>` de 1200 × 630 con su `og:image:alt`. Ningún dato de un
  animal ni de una persona.

## `/imagen?v=<versión>`

- Responde 200 `image/jpeg`, ≤ 300 KB, 1200 × 630. El contenido no depende de la base ni de quién
  la pide. `v` solo rompe la caché de las apps; cualquier valor devuelve la misma imagen.

## Eventos de medición

| Evento | Cuándo | Propiedades |
|---|---|---|
| `home_viewed` (nuevo) | Se dibuja `/` para alguien que no es un lector de vista previa | ninguna |
| `home_publish_tapped` (nuevo) | Se pide `/mis-animales/publicar` con `referer` = la portada de este mismo host, antes de la puerta | ninguna |
| `listing_viewed` (cambia) | Como hoy | `origin`: `home` si el `referer` es la portada de este host; si no, `elsewhere` |
| `pet_viewed` (cambia) | Como hoy | `origin`: suma `home` a `listing` / `outside` |

Todas con la marca de la visita que ya existe (UUID al azar). Ninguna con código de animal, id de
cuenta ni texto libre. «Publicó en la misma visita» = `home_publish_tapped` y `pet_published` con la
misma visita.
