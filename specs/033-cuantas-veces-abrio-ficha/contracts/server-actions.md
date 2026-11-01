# Contracts: lo que llama el código

Historia #269 · [research.md](./research.md) R3, R5, R6, R7.

## Acción `readPetStats` (`src/actions/pet-stats.ts`)

```ts
readPetStats(input: { kind: 'pet' | 'litter'; id: string }): Promise<ActionResult<PetStatsView>>
```

- Valida con `petStatsRequestSchema` (`src/lib/schemas/pet-stats.ts`): `kind` uno de los dos, `id`
  un uuid. Inválido → `{ ok: false, error: 'pets.stats.load_error' }`.
- Lee con `getMyPublicationStats(kind, id)`. `null` (no es suyo, no existe o la base falló) →
  `{ ok: false, error: 'pets.stats.load_error' }`. No distingue «no es tuyo» de «falló»: no confirma
  que exista.
- Con números, arma la vista con `statsView` y `petStatsTexts`. Si la vista es vacía, suma el texto
  para el grupo (`petGroupPost` / `litterGroupPost` sobre `getPublicPet` / `getLitterByCode`), o
  `null` si hoy no se ofrece o si esa lectura falla.
- Nunca lanza. La llaman el Server Component de la página al dibujar y `PetStatsLive` al tocar
  «Probar de nuevo».

## Queries (`src/lib/supabase/queries/publication-stats.ts`, la única puerta a la tabla)

```ts
countPublicationOpen(kind: PublicationKind, code: string, viewer: string | null): Promise<void>
countApplyTap(code: string, viewer: string | null, count: ApplyCount): Promise<void>
getMyPublicationStats(kind: PublicationKind, id: string): Promise<PublicationStats | null>
```

- Las dos primeras usan `createServiceSupabase()` (ejecutar es solo de `service_role`), atrapan todo
  y no devuelven nada: una cuenta perdida no se reintenta. `countApplyTap` con
  `{ tap: false, stop: null }` no llama a la base.
- `getMyPublicationStats` usa la sesión (`createServerSupabase()`), devuelve `null` sin fila o con
  error, y valida el nivel con `oneOf`.

## Dónde se llaman

| Lugar | Qué | Cómo |
|---|---|---|
| `(public)/animales/[code]/page.tsx` | `countPublicationOpen('pet', code, user?.id ?? null)` | Si `shouldCountOpen` da verdadero, dentro de `deliver`, antes de elegir la pantalla (también la de pausada, vencida, no disponible y bloqueada). |
| `(public)/camadas/[code]/page.tsx` | `countPublicationOpen('litter', …)` | Ídem. |
| `(app)/solicitar/[code]/page.tsx` | `countApplyTap(code, user?.id ?? null, applyCountOf(events))` | Con los mismos `events` que hoy van a `trackAll`, en los dos caminos (sin sesión y con sesión), dentro de `deliver`. |
| `(app)/mis-animales/[id]/page.tsx` y `camadas/[id]/page.tsx` | `readPetStats` | En `PetStatsSection` dentro de `Suspense`. |

## Funciones de la base

Ver [data-model.md](../data-model.md) §Funciones.
