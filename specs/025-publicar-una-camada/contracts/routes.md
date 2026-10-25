# Contrato de rutas y acciones: camadas (#205)

## Rutas

| Ruta | Grupo | Quién | Qué |
|---|---|---|---|
| `/mis-animales/publicar` | `(app)` | nivel 1 | sin `tipo`: «¿Es un animal o una camada?»; `?tipo=animal`: el formulario de #53; `?tipo=camada`: el de la camada. Sin nivel 1, el aviso de #10 como hoy |
| `/mis-animales/camadas/[id]/editar` | `(app)` | dueña con nivel 1 | editar la camada; de otra persona o inexistente, el `not-found` de editar |
| `/camadas/[code]` | `(public)` | cualquiera | la ficha (FR-021 a FR-033); `generateMetadata` con nombre y zona, `noindex` como `/animales/[code]` hasta el dominio |
| `/camadas/[code]/imagen` | `(public)` | cualquiera | la imagen de la vista previa, 1200 × 630, con `PetShareImage` |
| `/animales/[code]` | `(public)` | cualquiera | si el código es de una cría, 307 a `/camadas/{código de la camada}`; si no, como hoy |
| `/solicitar/[code]` | `(app)` | como hoy | con el código de una cría: el cuestionario de esa cría, sin cambios de regla; `?camada={code}` da el camino de vuelta si la cría ya no está (FR-032) |

Cada ruta nueva lleva `loading.tsx` y `error.tsx`, como sus pares de `/animales` y `/mis-animales`.

## Server Actions (`src/actions/litters.ts`)

Todas devuelven `ActionResult<T>` con el `error` como clave de i18n bajo `litters.errors.*`.

| Acción | Entrada | Salida |
|---|---|---|
| `publishLitter` | `FormData` validado con `litterSchema` (lo común, `attempt`, `photoIds`, `young[]`) | `{ code }` |
| `saveLitter` | ídem con `litterId` | `{ code }` |
| `previewLitterRemoval` | `litterId`, `youngIds[]` | `{ openApplications: number }` |
| `deleteLitter` | `litterId` | `{}` |
| `findLitterDuplicate` | `name`, `species` | `{ duplicate: boolean }` |

Las fotos se suben con la acción que ya existe en `src/actions/pet-photos.ts`.

## Consultas (`src/lib/supabase/queries/litters.ts`)

`getLitterByCode`, `getLitterShareCard`, `listMyLitters`, `getLitterForEdit`; `listed-pets.ts` y
`pet-reviews.ts` cambian para leer las columnas nuevas.
