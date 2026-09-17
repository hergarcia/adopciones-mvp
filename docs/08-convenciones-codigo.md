# 08 — Convenciones de código

**Decisión (2026-09-16):** desarrollo limpio. Prioridad absoluta a componentizar elementos visuales
y lógica que se repite. Estas reglas se aplican en code review; no son sugerencias.

## Principio rector

> **Si tiene nombre en el dominio, es un componente.**

`PetCard`, `VerificationBadge`, `ZoneLabel`, `ApplicationStatus`. Aunque aparezca una sola vez,
si un rescatista lo nombraría, se extrae: el nombre documenta y el archivo lo hace encontrable.

Dos reglas complementarias:
- **Regla de dos:** la segunda vez que se copia JSX o lógica, se extrae. No la tercera.
- **Sin abstracción especulativa:** se extrae por repetición real o por nombre de dominio, nunca
  "por si acaso". Una abstracción que cubre un solo caso es peor que el código duplicado.

## Tres capas de componentes

```
app/**                 páginas y layouts: composición + data fetching + Server Actions
components/<dominio>/  componentes de dominio: PetCard, VerificationBadge, ApplicationCard
components/ui/         primitivas (shadcn): Button, Input, Dialog, Badge, Skeleton
```

| Capa | Sabe de | No sabe de |
|---|---|---|
| `app/**` | rutas, Supabase, Server Actions, params | detalles visuales |
| `components/<dominio>/` | tipos del dominio (`Pet`, `Application`), i18n | Supabase, rutas |
| `components/ui/` | props visuales, accesibilidad | dominio, i18n, datos |

**Dependencias en una sola dirección:** `app → dominio → ui`. Un componente de `ui/` jamás importa
de `pets/`. Un componente de dominio jamás hace `fetch` ni llama a Supabase: recibe datos por props.

Una página con más de ~50 líneas de JSX tiene componentes escondidos adentro.

## Server vs. Client

- Todo es Server Component salvo que necesite estado, efectos, eventos o APIs del browser.
- `"use client"` va en **la hoja más chica posible**: en el `FavoriteButton`, no en la `PetCard`.
- Los datos se buscan en la página (server) y bajan por props. Los componentes de dominio no saben
  de dónde vienen.

## Dónde vive la lógica que se repite

| Tipo de lógica | Dónde | Ejemplo |
|---|---|---|
| Cliente, con estado | `hooks/use-x.ts` | `useImageUpload`, `useOtpCountdown` |
| Pura, sin React | `lib/<dominio>/` | `lib/pets/format-age.ts`, `lib/verification/level.ts` |
| Mutaciones | `actions/<dominio>.ts` | `createPet`, `acceptApplication` |
| Validación | `lib/schemas/<dominio>.ts` | `petSchema`, `applicationSchema` |
| Lecturas de DB | `lib/supabase/queries/<dominio>.ts` | `getPetBySlug`, `listPetsByOwner` |

Reglas:
- **Un schema zod, dos usos:** el form (cliente) y la Server Action (server) importan el mismo
  schema. Nunca dos validaciones que puedan divergir.
- **Server Actions no lanzan:** devuelven `ActionResult<T> = { ok: true, data: T } | { ok: false, error: string }`.
  El `error` es una clave de i18n, no un texto.
- **Nadie llama `.from('pets')` fuera de `lib/supabase/queries/`.** Las páginas llaman
  `getPetBySlug(slug)`. Si cambia la tabla, cambia un archivo.

## Anatomía de un componente

- Un componente por archivo. Archivo en kebab-case, export en PascalCase:
  `pet-card.tsx` exporta `PetCard`.
- Carpeta propia solo cuando tiene subcomponentes privados:
  ```
  components/pets/pet-card/
    pet-card.tsx
    pet-card-photo.tsx      ← privado, no se exporta fuera de la carpeta
    pet-card.test.tsx       ← si tiene lógica
    index.ts
  ```
- Test al lado del componente, no en `__tests__/`.

## Props

- `type Props = { ... }` explícito en cada componente. Cero `any`.
- **El objeto de dominio, no sus campos sueltos:** `<PetCard pet={pet} />`, no
  `<PetCard name={...} age={...} photo={...} zone={...} />`. Si el tipo `Pet` crece, la card no cambia.
- **Composición sobre configuración:** más de 3 flags booleanos (`showPhoto`, `compact`,
  `withBadge`, `hideZone`) es señal de que hacen falta `children` o subcomponentes.
- **Variantes visuales con `cva`**, no con ternarios de clases:
  `badgeVariants({ level: 'verified' })`, no `` className={`... ${level === 2 ? 'bg-x' : 'bg-y'}`} ``.
- Prop drilling máximo 2 niveles. Si pasa de ahí: `children` o un contexto de dominio chico.

## Tamaño

- Componente > 150 líneas: se parte. Función > 40 líneas: se parte.
- No es dogma, es señal. Si al partirlo queda peor, no se parte, pero se justifica en un comentario.
- Un archivo, una responsabilidad. Un motivo para cambiar.

## Naming

- Componentes: sustantivo del dominio en PascalCase. `PetCard`, no `Card2` ni `PetCardComponent`.
- Hooks: `useX`. Actions: verbo + sustantivo: `createPet`, `acceptApplication`.
  Queries: `getX` (uno), `listX` (varios).
- Booleanos: `isVerified`, `hasPhotos`, `canApply`.
- Archivos y carpetas: kebab-case.
- **Inglés en el código, español en la UI** (vía `messages/`). No existe `solicitud` en el código;
  existe `application`. Ver glosario en `06-i18n.md`.

## Estilos

- Tailwind en el JSX. `cn()` para condicionales. `cva` para variantes.
- Tokens en `globals.css` (`--color-primary`, `--radius-card`...). **Nunca un hexadecimal en un
  componente.**
- Sin CSS-in-JS. Sin `style={}` salvo valores dinámicos reales (un ThumbHash, una posición).

## i18n en componentes

- Componentes de dominio: `useTranslations('pets')` / `getTranslations`. **Ningún string visible
  literal.**
- Componentes `ui/` no traducen: reciben `label`, `children`, `aria-label` ya traducidos.

## Estados

Todo componente que muestra datos cargados tiene **tres estados diseñados**: cargando (skeleton
con la misma forma), vacío (`EmptyState` con ilustración y acción) y error. Se resuelven con
`loading.tsx`, `error.tsx` y un `EmptyState` de dominio. Un spinner genérico no es un estado diseñado.

## Calidad

- TypeScript `strict`. Cero `any`. Cero `@ts-ignore` sin un comentario que diga por qué.
- **Decisión (2026-09-17): comentarios solo cuando hacen falta.** El código dice qué hace; el
  comentario dice por qué, cuando el porqué no es obvio (una regla de negocio no evidente, un
  workaround con su causa, una decisión que parece rara). Nunca narrar el código, repetir el
  nombre de la función ni contar la historia de cómo se llegó ahí: eso va al mensaje de commit o
  al doc. Sin bloques de encabezado; una línea de propósito solo si el nombre del archivo no
  alcanza. Un JSDoc solo en una función pública cuyo contrato no se lee de la firma.
- Lint + format en pre-commit. Herramienta de hooks a elegir al scaffoldear (la más liviana y
  actual en ese momento).
- Tests: solo lo que vale la pena (`09-flujo-de-trabajo.md` §Qué vale la pena testear): reglas
  de negocio, schemas, cálculos con casos borde, componentes de dominio **con** lógica
  (`VerificationBadge` según nivel), y los flujos críticos. Nada para páginas, `ui/`, queries
  finas ni componentes que solo pintan. Test al lado del archivo (`foo.ts` + `foo.test.ts`).
- **Decisión (2026-09-17):** cada test prueba lo que dice probar. Mutation testing (Stryker) al
  100 % sobre lo que tiene test, en local y en CI; un mutante que sobrevive es una aserción que
  falta, y un equivalente se anota en su línea con el motivo. Detalle en `09-flujo-de-trabajo.md`.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), en inglés.
- Ramas: `main` siempre deployable + `feature/<n>-<slug>` por historia. **Decisión (2026-09-16):**
  PR obligatorio con CI verde y revisión de agentes aunque sea una sola persona; lo mergea el
  batch (ver `09-flujo-de-trabajo.md`).

## Checklist antes de dar por terminado un componente

- [ ] ¿Tiene nombre de dominio?
- [ ] ¿Tiene un solo motivo para cambiar?
- [ ] ¿Es Server por defecto, con `"use client"` solo en la hoja?
- [ ] ¿Recibe el objeto de dominio en vez de campos sueltos?
- [ ] ¿Cargando / vacío / error están diseñados?
- [ ] ¿Ningún string visible hardcodeado?
- [ ] ¿Ningún color hardcodeado?
- [ ] ¿Responde a hover, focus y active? (microinteracciones, ver `07-stack.md`)
- [ ] ¿Se puede renderizar sin Supabase (solo con props)?

## Ejemplo: así se ve una página

```tsx
// app/[locale]/(public)/animales/[slug]/page.tsx
export default async function PetPage({ params }: Props) {
  const { slug } = await params
  const pet = await getPetBySlug(slug)
  if (!pet) notFound()

  return (
    <PetLayout>
      <PetPhotoGallery photos={pet.photos} />
      <PetHeader pet={pet} />
      <PetAttributes pet={pet} />
      <OwnerCard owner={pet.owner} />
      <ApplyButton petId={pet.id} minLevel={pet.minVerificationLevel} />
    </PetLayout>
  )
}
```

Diez líneas, cinco componentes con nombre, cero lógica visual. Si una página no se ve así, algo
está en el lugar equivocado.
