# Data Model: Que la vista previa del enlace de mi perfil diga qué tengo verificado

**Sin migración.** Nada se guarda en la base: el nivel se lee de lo que ya existe y viaja solo en la
vista previa y en la medición (spec FR-022).

## Lo que se lee (ya existe)

- **Perfil público** (`public_profile`, vía `getPublicProfile`): `displayName`, `levelOne`,
  `identitySince`, `vouchers` (solo los que cuentan). `publicLevel(profile)` da el nivel 0 a 3. Una
  persona suspendida, borrada o con el alta sin terminar no tiene fila: es «Este perfil no existe».
- **Perfil propio** (`findProfile(userId)`): `publicId`, para leer el perfil público de quien copia.

## Valores nuevos (sin tabla)

### Nivel de la vista previa

| Nivel | Palabras (`pets.page.*`) | `og:description` | `og:image` |
|---|---|---|---|
| 0 o no se sabe | — | — (como hoy) | — (como hoy) |
| 1 | `level_one` «Teléfono verificado» | las palabras | `/perfil/nivel/1/imagen?v=…` |
| 2 | `level_two` «Identidad verificada» | las palabras | `/perfil/nivel/2/imagen?v=…` |
| 3 | `level_three` «Identidad verificada y avalada» | las palabras | `/perfil/nivel/3/imagen?v=…` |

`v` = `siteShareVersion({ siteName: APP_NAME, phrase: <palabras> })`: cambia si cambia el texto o el
nombre del sitio. Validación de la ruta: el segmento es exactamente `1`, `2` o `3`; cualquier otra cosa
no es un nivel.

### `owner_level` en la medición

`MeasuredLevel` (0 nada · 1 teléfono · 2 identidad · 3 identidad y aval), opcional:

- `profile_link_copied`: `{ from: ProfileLinkOrigin; owner_level?: MeasuredLevel }`. El nivel de
  quien copia o manda, leído en el servidor al llegar el momento. Sin poder leerlo, sin la propiedad.
- `public_profile_viewed`: `{ origin: ProfileViewOrigin; with_pets?: boolean; owner_level?:
  MeasuredLevel }`. El nivel de la dueña, el mismo de la chapita que dibuja la página.

Ninguno lleva el id público, el nombre, la dirección ni el `from` de quien visita más allá de lo que
ya llevaba (FR-020).
