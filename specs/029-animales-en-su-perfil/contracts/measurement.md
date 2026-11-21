# Contrato: la medición

Ningún momento lleva un id, un nombre, un código, un texto ni una cantidad de animales (FR-021).

| Momento | Antes | Después | Cuándo |
|---|---|---|---|
| `public_profile_viewed` | `{ origin }` | `{ origin, with_pets? }` | igual que hoy (dueña, vista previa, marca `aval` y «no existe» no se miden) y además no con `mostrar` en la dirección |
| `pet_viewed` | `origin` de ocho | `origin` suma `profile` | `referer` del mismo host con camino `/perfil/<publicId>` y sin la marca de Compartir |
| `profile_link_copied` | sin propiedades | `{ from: 'my_profile' \| 'my_vouches' \| 'my_pets' }` | cada vez que se manda, se copia o queda escrito a mano |

- `with_pets`: `true` si la primera tanda trajo al menos una tarjeta; `false` si trajo cero; ausente
  si falló.
- `apply_tapped` y `application_sent` no cambian: «cuántas fichas abiertas desde un perfil terminan en
  una solicitud» se lee siguiendo la marca de visita (`pet_viewed` con `origin = profile` → 
  `apply_tapped` → `application_sent` en la misma visita), como la lectura por nivel de #236.

## docs/03 §Métricas de éxito, «Cómo se leen» (nuevo punto 6)

**¿El rescatista usa el sitio como su vidriera?** (#238)

- `profile_link_copied` con `from` = `my_pets`: cuántas veces se copia o se manda el enlace del perfil
  desde «Mis animales». Son momentos, no personas.
- `public_profile_viewed` con `with_pets` = `true`, por `origin`: qué parte llega desde un enlace de
  afuera (`link`) y qué parte navegando el sitio (`site`), casi siempre desde una ficha.
- `pet_viewed` por `origin`: qué parte de las fichas vistas se abre desde un perfil (`profile`), al
  lado de `listing`, `shared` y los de afuera; y, siguiendo la misma visita, cuántas de esas terminan
  en `apply_tapped` y en `application_sent`.
- Con 3 a 5 rescatistas los números son chicos: se leen como señal al lado de las opiniones y las
  encuestas, no como prueba.
