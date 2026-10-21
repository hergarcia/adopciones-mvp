# Research — Pie del sitio con los enlaces que más se buscan

## R1. Qué decide qué grupos y enlaces van

**Decisión:** una función pura, `footerGroups({ scope, supportHref })` en `src/lib/footer/groups.ts`,
devuelve los grupos en orden, cada uno con sus enlaces en orden (`id`, `href`, `external`), ya
filtrados: `scope: 'help'` deja solo Ayuda; `supportHref === null` saca el WhatsApp; un grupo sin
enlaces no sale. `SiteFooter` solo traduce y pinta.

**Por qué:** es la regla de la spec que, si se rompe, le muestra a una persona lo que no debe ver
(una cuenta suspendida con enlaces a pantallas que no puede usar) o un enlace sin destino (FR-006,
FR-007, FR-014). Pura, se prueba entera sin renderizar y se sostiene al 100 % de mutación.

**Descartado:** armar los grupos con condicionales en el JSX de `PaperFrame`, como hoy se arman los
tres renglones: la regla quedaría repartida en el layout y no se podría probar sin una página.

## R2. Cómo sabe el pie que es el de la cuenta suspendida

**Decisión:** la prop `questions?: boolean` de `PaperFrame` pasa a `footer?: 'site' | 'help'`
(por omisión `'site'`), y el layout del grupo `(suspended)` pasa `footer="help"`. `SiteFooter`
recibe ese `scope`.

**Por qué:** la prop actual nombra un renglón que deja de existir. Derivarlo de `menu={false}`
ataría dos cosas distintas (la cabecera y el pie) por casualidad: hoy coinciden en una sola
pantalla, pero son reglas diferentes de la spec (§Edge Cases, «Una cuenta suspendida en Opinar»).

## R3. El enlace marcado como pantalla actual (FR-010)

**Decisión:** `NavLink` compara hoy `usePathname()` con el `href` sin consulta. Esa comparación se
extrae a `useIsCurrentPath(href)` en `src/hooks/use-is-current-path.ts`, y la usan `NavLink` y el
nuevo `FooterLink`, la hoja cliente más chica del pie.

**Por qué:** segunda repetición de la misma lógica (CLAUDE.md §Componentizar). El pie vive en el
layout, que no sabe en qué pantalla está, igual que la cabecera.

## R4. La voz de los enlaces y de los nombres de grupo

**Decisión:** el nombre del grupo es un `h2` en voz de afiche (`.afiche`, `--text-lg`, tinta); los
enlaces van en la voz de lectura, con la receta `textLink` `medium` `block` (subrayado de 2 px que
engrosa a 4 al hover, 44 px de alto). El actual lleva `aria-current="page"` y el subrayado de 4 px
quieto, como el del menú.

**Por qué:** docs/10 §Tipografía reserva la voz de afiche para títulos, nombres y botones; seis
enlaces en afiche pesarían más que el contenido de la pantalla. El WhatsApp de soporte ya usa
`textLink` `medium` `block` (`SupportWhatsAppLink`), así que los seis enlaces se ven iguales sin
tocarlo. El nombre del grupo no es una etiqueta encima de un bloque (docs/10 §Antipatrones): es el
título de una lista, en tinta y en el tamaño de un subtítulo, sin mayúsculas ni tracking.

**Descartado:** `NavLink` en el pie, como hoy: es `ghost` sobre la receta de `Button`, que trae la
voz de afiche y `cn` no la puede sacar (no resuelve conflictos de clases).

## R5. La marca del pie

**Decisión:** se extrae `BrandSignature` (`src/app/[locale]/_components/brand-signature.tsx`): el
`span.firma` con `BrandMark` `compacta` y `APP_NAME`, en `.afiche` `--text-xl`. `Wordmark` lo
envuelve en su enlace a la portada; el pie lo pone sin enlace (spec FR-008).

**Por qué:** la firma es la misma pieza en los dos lugares y tiene nombre en el dominio (docs/10
§Marca, `.firma`). A `--text-xl` la pata mide 1,75 veces la altura de mayúsculas, unos 30 px: el
dibujo compacto (24–31 px), el mismo de la cabecera.

## R6. La precarga de los enlaces del pie

**Decisión:** los seis enlaces internos van con `prefetch={false}`.

**Por qué:** el listado, «Qué dice cada nivel», el índice de preguntas y publicar registran algo al
abrirse (`listing_viewed`, `levels_explained`, `questions_index_viewed`, el toque desde la portada);
traerlos por adelantado lo contaría sin que nadie los abra. Es la regla que ya sigue el pie con
«Preguntas y respuestas» y Opinar.

## R7. La medición no cambia

Las lecturas que miran de qué pantalla se llegó (`home_publish_tapped`, el `origin` de
`listing_viewed`, `question_action_used`, el `origin: 'footer'` de `questions_index_viewed`) leen el
`Referer`, no el enlace. Ya cuentan los toques del menú, y van a contar igual los del pie. No se
agrega ningún evento (spec §Assumptions, story §Medición).

## R8. Los textos

**Decisión:** un namespace nuevo `footer` en `messages/es.json`:

```json
"footer": {
  "groups": { "animals": "Animales", "trust": "Confianza", "help": "Ayuda" },
  "links": {
    "listing": "Animales en adopción",
    "publish": "Publicar un animal",
    "levels": "Qué dice cada nivel",
    "questions": "Preguntas y respuestas",
    "feedback": "Opinar",
    "support": "Escribinos por WhatsApp"
  }
}
```

Se borran `feedback.footer`, `support.footer` y `questions.footer`, que solo usaba `PaperFrame`
(las preguntas de cada renglón dejan de mostrarse, FR-009). Los nombres de los enlaces son los
mismos que hoy tienen en el menú y en el pie.

## R9. Las pruebas que ya existen y se cruzan con el pie

El pie suma enlaces con nombres que ya están en el menú o en la pantalla. Las pruebas de punta a
punta que los buscan en toda la página encontrarían dos y fallarían por modo estricto. Se acotan a
su región, sin cambiar lo que afirman:

- `tests/e2e/animales.spec.ts:88` y `:128` («Animales en adopción») → a `getByRole('navigation')`.
- `tests/e2e/portada.spec.ts:18` («Publicar un animal») → a `getByRole('main')`.
- `tests/e2e/enlace-no-sirve.spec.ts:54` («Publicar un animal» en la portada, sin sesión) → a
  `getByRole('main')`, el de la portada que toca hoy.

Antes de acotar, el build corre `grep` por los seis nombres en `tests/e2e/` para no dejar ninguno
suelto que esta lista no vio.

`tests/e2e/suspension.spec.ts:77-79` y `tests/e2e/preguntas.spec.ts:36` ya buscan dentro del pie
(`contentinfo`) y siguen valiendo.

## R10. Qué se testea (docs/09 §Qué vale la pena testear)

- **`src/lib/footer/groups.test.ts`** (unit): la regla de visibilidad y orden. Afirma la lista
  exacta de grupos y enlaces (ids y `href`) con soporte y sin él, con `scope` `site` y `help`; que
  sin soporte Ayuda tiene solo `feedback`; que `help` sin soporte deja un grupo con un enlace; que
  `external` es `true` solo para el WhatsApp. Al 100 % de mutación.
- **`tests/e2e/suspension.spec.ts`** (se amplía la prueba que ya mira el pie): en la pantalla de la
  cuenta suspendida el pie tiene el encabezado «Ayuda» y no tiene «Animales» ni «Confianza», ni los
  enlaces «Animales en adopción», «Publicar un animal» ni «Qué dice cada nivel». Prueba que el
  layout le pasa al pie el `scope` correcto, que la unidad no ve.
- **Nada** para `SiteFooter`, `FooterLink`, `BrandSignature` ni `useIsCurrentPath`: pintan o son
  una comparación fina; las puertas de publicar ya tienen sus pruebas (#9, #10, `portada.spec.ts`).
