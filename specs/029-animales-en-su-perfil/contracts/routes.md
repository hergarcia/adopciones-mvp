# Contratos: rutas, consultas y componentes

## `GET /api/perfil/{publicId}/animales`

Las tandas de la sección «En adopción» del perfil para la hoja cliente.

| Parámetro | Dónde | Regla |
|---|---|---|
| `publicId` | camino | `isPublicId`; si no, `200 { cards: [], next: null, signedAt }` sin ir a la base |
| `despues` | query | cursor de `formatCursor`; sin él, la primera tanda (para «Probar de nuevo») |

- `200`: `ApiPage` sin `total` ni `totalText`: `{ cards: ListedCardView[], next: string | null,
  signedAt }`, 24 tarjetas como mucho. `cache-control: no-store`.
- `503`: `{ error: 'pets.listing.errors.no_response' }` si la base falla.
- No llama a `track` ni a `trackAll` (FR-022). Un lector de vista previa recibe lo mismo.
- La sesión de quien mira viaja en la cookie: el bloqueo se aplica en la base como en el listado.

## `listProfilePets(publicId, cursor, limit, now?)` · `src/lib/supabase/queries/listed-pets.ts`

`listed_pets` con `p_owner_public_id = publicId`, los filtros vacíos, `p_after_*` del cursor y
`p_limit`. Devuelve `ListingPage`; lanza si la base falla.

## `profilePetsView(publicId, cursor, shown)` · `src/app/[locale]/_components/listing-view.ts`

Pide `shown + 1`, arma las tarjetas con `listedCardViews` y `next` con `nextCursor`. Devuelve
`ApiPage` sin total. Lo usan la página del perfil (primera tanda), «Mis animales» (`shown = 1`, para
saber si hay alguno a la vista) y la ruta.

## Página del perfil · `src/app/[locale]/(public)/perfil/[id]/page.tsx` (cambia)

- `searchParams` suma `mostrar` (`SHOWN_KEY`), validado con la regla de `parseShown`.
- `profilePetsView(id, null, shown).catch(() => null)` entra en el `Promise.all` cuando `isPublicId`.
- `public_profile_viewed` lleva `profileViewProps(origin, pets)`; no se mide con `mostrar` presente.
- `ProfileScreen` recibe `pets: ApiPage | null` y la pasa a `PublicProfileLayout` en el lugar nuevo
  `pets`, entre los avales y el lugar de avalar. Con `pets.cards.length === 0`, `null`.

## `ProfilePets` · `src/components/pets/profile-pets.tsx` (nuevo, hoja cliente)

```text
props: {
  publicId: string
  first: ApiPage | null          // null = la primera tanda falló
  shown: number                  // para el enlace sin JavaScript
  texts: { title, loadMore, cap, retry, loadError, moreFailed: Record<ListingFailure, string> }
}
```

`<section aria-labelledby>` con `h2` «En adopción», `PetWall`, `LoadMoreButton` con
`href=/perfil/{id}?mostrar={n+24}#a-{n+1}`, `SaveFailedStrip` y «Probar de nuevo». Devuelve `null`
si después de «Probar de nuevo» no hay tarjetas.

## `ProfileLinkLine` · `src/components/profile/profile-link-line.tsx` (nuevo)

```text
props: { url: string; texts: { line: string; copy: CopyProfileLinkTexts } }
```

Un `p` con la línea en `--text-base` y `CopyProfileLink from="my_pets"` debajo.

## `CopyProfileLink` (cambia)

Suma `from: ProfileLinkOrigin` (obligatoria) y llama `trackProfileMoment('profile_link_copied', {
from })`.

## `trackProfileMoment` · `src/actions/profile.ts` (cambia)

`props: { field?: string; kind?: string; from?: string }`. Para `profile_link_copied`, `from` debe
ser uno de `PROFILE_LINK_ORIGINS`; si no, `{ ok: false, error: 'profile.errors.save_failed' }` sin
medir.
