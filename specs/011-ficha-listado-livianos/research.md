# Research — Que la ficha y el listado de animales abran livianos en el teléfono

Historia #95. Las decisiones técnicas del plan, con lo que se midió antes de decidir.

## R0 — Qué pesa hoy, por pedazo

Medido sobre el build de producción de `main` (2026-10-05, `next build` con Turbopack, Next 16.3.5),
leyendo `page_client-reference-manifest.js` de cada ruta y comprimiendo cada chunk de entrada con
gzip 9. Son tamaños estáticos, no `transferSize` (que suma los encabezados de cada respuesta y no
cuenta los polyfills `nomodule`), así que sirven para comparar pedazos, no como valor del freno. La
diferencia contra la portada sí coincide con lo medido en el navegador (KL-57-4).

| Pantalla | Estático | Sobre la portada | `transferSize` al cerrar #57 |
|---|---|---|---|
| Portada | 184,3 KB | — | 145 KB |
| Listado | 205,7 KB | +21,4 | 167 KB |
| Ficha | 223,6 KB | +39,3 | 188 KB |

Lo que suma la ficha sobre la portada:

| Chunk | KB | Qué tiene |
|---|---|---|
| `0m8u…` | 11,8 | `NextIntlClientProvider` y el formateador de mensajes (`IntlMessageFormat`): solo lo usan los dos `error.tsx` de `animales/` a través de `ErrorTextsProvider` |
| `0ulel…` | 13,0 | Radix compartido: `DismissableLayer`, `Portal`, `FocusScope`, `RemoveScroll`, `hideOthers`, y el `DialogContent` del `Sheet` de copiar a mano: Turbopack lo sube a la entrada aunque `ShareManualSheet` sea `lazy`, porque comparte dependencias con el `Toast` |
| `3mu0…` | 11,6 | `@radix-ui/react-toast`, `ShareButton` (con la referencia a `trackShare`), `GalleryPosition`, `PetPhoto`, `StaleImagesRefresh` |
| `1krr…` | 1,5 | `animales/[code]/error.tsx` |
| otros | 0,4 | |

Lo que suma el listado: el mismo `0m8u…` (11,8), `1rh-…` (8,4: `ListingController`, `useListing`,
el snapshot en `sessionStorage`, filtros, pared, «Ver más») y `animales/error.tsx` (1,0).

El piso común de toda pantalla pública (portada incluida) ya lleva `clsx` + `tailwind-merge`
(`0rkz…`, 8,5) y `nav-link` + `public-error-copy` + `(public)/error.tsx` con `ErrorScreen`
(`343d…`, 4,9).

**Conclusión:** la ficha tiene que bajar ~38 KB y el listado ~17. Ningún pedazo solo alcanza; hacen
falta las palancas R2 a R5, medidas una por una (R6).

## R1 — Qué cuenta como peso de apertura

**Decisión:** el peso de apertura es la suma de `transferSize` de los recursos `script` cuyo
`startTime` es anterior a `loadEventEnd` de la navegación; el peso total es la misma suma sobre
todos los `script` cuando la red quedó quieta (`networkidle` y 1 s más). Los dos, en la misma
corrida, con la red y la CPU de `throttleLikeAPhone`.

**Por qué:** es la lectura de la spec (Assumptions): «lo que el teléfono baja para abrir» y lo que
llega después medido aparte con tope. `loadEventEnd` es lo que el navegador llama «cargada», e
incluye la foto principal. La prueba de hoy suma todo lo que hay a los ~1,5 s de `load`, que
mezclaría las dos cosas.

**Descartado:** medir con Lighthouse (`resource-summary:script:size`): cuenta hasta que la red
queda quieta, o sea el peso total, y sumar pantallas a `.lighthouserc.json` espera a Hernán
(KL-57-3). Medir solo lo pedido antes de hidratar: no hay una marca estándar de «hidratado».

## R2 — Los textos de error de `animales/` sin next-intl en el cliente

**Decisión:** los dos `error.tsx` de `animales/` leen sus textos de `PublicErrorCopyProvider`, el
contexto de tres strings que ya usa el `error.tsx` de `(public)` (perfil), en lugar de
`useTranslations`. `animales/layout.tsx` monta el proveedor con el texto del listado y un
`animales/[code]/layout.tsx` nuevo lo monta con el de la ficha y «Ver animales en adopción»
(`PublicErrorCopy` suma `toListing?: string`). `ErrorTextsProvider` deja de envolver `animales/`, y
sus claves `pets.listing.load_error`, `pets.page.load_error` y `pets.page.to_listing` salen de su
lista (las siguen leyendo el servidor y los mensajes, no el proveedor).

**Por qué:** el contexto propio cuesta menos de 0,3 KB y los textos viajan en el HTML de la página:
no hay nada que bajar después y anda sin señal desde el primer momento, que cumple la decisión de
la historia sin esperar. Es el patrón que el repo ya tiene para la zona pública
(`public-error-copy.tsx`), no uno nuevo.

**Descartado:** bajar los textos de error después de abrir: funciona, pero agrega un pedido y una
ventana sin textos para ganar lo mismo. Cambiar `ErrorTextsProvider` en todo el producto: las
pantallas con sesión no son de esta historia (KL-57-4 ya lo decía).

## R3 — Lo que solo hace falta después de un toque, después de abrir

**Decisión:** un hook `useAfterOpen(load)` y la función `afterOpen()` que usa, los dos en
`src/hooks/use-after-open.ts` (es lógica cliente con estado del navegador, no lógica pura de
`lib/`). `afterOpen()` resuelve después del evento `load`
de la ventana (o ya, si pasó) y del siguiente `requestIdleCallback` con `timeout: 1000` (FR-007: a
más tardar 1 s; `setTimeout` donde no existe). `useAfterOpen` llama a `load()` —un `import()`
dinámico— recién entonces, y devuelve el módulo o `null`. Lo usan las hojas cliente que se parten
en dos:

- **`ShareButton`** queda como cáscara: mientras no llegó su parte viva dibuja el mismo `Button`
  invisible que hoy (`aria-hidden`, `tabIndex=-1`, lugar reservado) y, cuando llegó, dibuja
  `ShareButtonLive` (`share-button-live.tsx`), que es el `ShareButton` de hoy con su `Toast`, el
  `Sheet` de copiar a mano y `trackShare`. «Compartir» aparece cuando puede avisar (FR-012).
- **El `ToastProvider` de la ficha** sale de la página: `ShareButtonLive` lleva el suyo cuando la
  página no tiene uno (`region` por prop, `'own' | 'page'`; la ficha pasa `'own'`, Mis animales sigue
  con el de la página y no cambia).
- **`ShareManualSheet`** deja de ser `lazy` adentro de la parte viva: llega con ella, después de
  abrir, así copiar a mano anda sin señal (FR-007). Ya no pesa en la apertura.

**Por qué:** la cáscara reproduce exactamente el HTML del servidor de hoy (el botón ya sale invisible
hasta hidratar), así que no hay salto ni diferencia visible, y cambiar de cáscara a parte viva es un
render del cliente, no una hidratación: nada depende de cómo el servidor parte el HTML. El
`import()` dinámico deja la parte viva en un chunk asíncrono que no se precarga.

**Descartado:** `next/dynamic`: en el App Router precarga los chunks en el HTML, o sea que vuelven a
la apertura. `React.lazy` sobre el HTML del servidor con hidratación diferida: si la promesa no
resuelve antes de que React vacíe el primer pedazo del HTML, el contenido llega como segmento
aparte que solo se ve ejecutando el script de React: sin JavaScript (FR-010) y para los crawlers se
vería el fallback. Bajar la parte viva al primer toque: es lo que la decisión de la historia
descarta (la señal se puede perder).

## R4 — El listado: la vista se hidrata, el motor llega después

**Decisión:** `ListingController` se parte en la vista y el motor. La vista (total, filtros, pared,
vacíos, avisos, «Ver más») sigue hidratando como hoy y dibuja con `hydrated=false` mientras el motor
no llegó: el formulario de filtros es un GET con su botón y «Ver más» es un enlace, exactamente el
camino sin JavaScript de hoy (FR-010, FR-011). El motor (`listing-engine.ts`: el reducer de
`useListing`, los pedidos a `/api/animales`, el snapshot en `sessionStorage` y la sincronización de
la dirección) llega con `useAfterOpen`; cuando llega, `useListing` lo usa y `hydrated` pasa a `true`,
que es lo que hoy pasa al hidratar. La vista no se desmonta: es el mismo árbol con otro estado, así
que lo que la persona eligió en un filtro antes de que llegue el motor queda elegido.

**Por qué:** filtrar sin recargar y «Ver más» sin recargar solo hacen falta después de un toque
(spec, Assumptions), y el camino sin JavaScript ya existe y ya está probado por #57. Lo que gana es
el motor (~4 KB de los 8,4 de `1rh-…`); la vista no se puede diferir sin desmontar el DOM.

**Riesgo:** es la palanca más delicada. Si el motor no se deja separar de `useListing` sin romper
sus tests, la construcción mide primero R2 + R5: si el listado ya entra, R4 no se hace (R6).

## R5 — Hojas chicas que pueden esperar

**Decisión, en este orden y solo si hace falta (R6):**

1. `GalleryPosition` y `StaleImagesRefresh` pasan a cáscara + `useAfterOpen`. Los puntos ya se
   dibujan recién al hidratar sobre un renglón reservado, y refrescar las firmas de las fotos es algo
   que pasa después de abrir. Ninguno cambia lo que se ve.
2. Las tres pantallas de error públicas (`(public)/error.tsx`, `animales/error.tsx`,
   `animales/[code]/error.tsx`) dibujan `ErrorScreen` desde un módulo que llega con `useAfterOpen`;
   mientras no llegó, nada (que es lo que hoy dibuja `(public)/error.tsx` sin textos). Le baja peso
   también a la portada, que el freno permite.

**R5.2, descartada en la revisión (2026-10-05):** mientras la pantalla no llegaba, el límite no
dibujaba nada, ni en el HTML del servidor: una falla con la señal cortada quedaba en una hoja en
blanco, sin el mensaje ni «Reintentar», y el perfil público ni siquiera la pedía por adelantado. Los
tres `error.tsx` vuelven a dibujar `ErrorScreen` desde el primer momento (§R6, Revisión).

**Descartado:** sacar `tailwind-merge` del cliente (8,5 KB del piso de todo el sitio): cambia cómo
se resuelven las clases en conflicto en todas las primitivas y es un cambio transversal, que pide su
propio PR y un `aviso` (docs/07). Queda anotado como la palanca siguiente si M3 no entra.

## R6 — Medir antes de cada palanca

**Decisión:** la construcción mide primero `main` con la prueba nueva (T001) y anota los valores de
partida (apertura y total de ficha, «no está publicado», listado y portada) en el PR; esos son los
topes del peso total (FR-008) si difieren de 188/167/145. Después aplica R2, R3, R4, R5.1 y R5.2 en
ese orden, mide después de cada una y para cuando las tres pantallas entran en 150 KB con al menos 2
KB de aire. Una palanca que no hizo falta no se aplica, y se dice en el PR.

**Partida medida (2026-10-05, T002)** con `scriptWeight` sobre el código de `main` (`next build` +
`next start`, `throttleLikeAPhone`, cada pantalla sin caché del navegador):

| Pantalla | Apertura | Total | LCP |
|---|---|---|---|
| Ficha a la vista | 188 KB | 188 KB | 840 ms |
| Ficha de un código que no existe | 188 KB | 188 KB | 704 ms |
| Listado `?departamento=rocha` | 169 KB | 169 KB | 944 ms |
| Listado sin filtros | 169 KB | 169 KB | 968 ms |
| Portada | 147 KB | 147 KB | 700 ms |

Los topes del peso total (FR-008) quedan en 188 KB para la ficha y 169 KB para el listado (el
listado mide 2 KB más que los 167 de #57); la portada parte de 147 KB.

**US1 (2026-10-05, T012)**, medido igual, una palanca por vez:

| Después de | Ficha (apertura / total) | No disponible | Listado | Portada |
|---|---|---|---|---|
| R2 + R3 | 153 / 175 KB | 153 KB | 155 KB | 145 KB |
| + R5.1 | 150 / 176 KB | 150 KB | 155 KB | 145 KB |
| + R5.2 | 148,7 / 176,3 KB | 148,7 KB | 154,5 KB | 144,8 KB |

Se aplicaron las cuatro palancas de la ficha. Queda en 148,7 KB: entra en 150, con 1,3 KB de aire y
no 2; no queda otra palanca de la ficha en este plan (la siguiente es `tailwind-merge`, descartada
en R5). R5.2 baja la pantalla de error apenas abre aunque nada falle (`public-error-screen.tsx`), así
los textos se ven aunque la señal se haya cortado (FR-014). Turbopack copia `afterOpen` y
`PublicErrorScreen` en el pedazo de cada `error.tsx` (~0,6 KB cada uno) en lugar de compartirlos.

**US2 (2026-10-05, T015–T017)**, medido igual:

| Después de | Listado (apertura / total) | Ficha | Portada |
|---|---|---|---|
| US1 (R2 + R5.2) | 154,5 KB | 148,7 KB | 144,8 KB |
| + R4 como estaba (motor aparte) | ~154 KB (estático: −0,3 KB) | — | — |
| + `ListingController` entero después de abrir | 146,7 / 156,7 KB | 148,7 / 176,3 KB | 144,8 KB |

R4 como estaba escrito no alcanzaba (plan §Cambios durante la construcción de US2): se reemplazó por
la vista entera en `<Activity>` + `lazy`. El listado queda con 3,3 KB de aire y su total (156,7) por
debajo del de partida (169). T017 no hizo falta: R5.2 ya estaba aplicada desde US1.

**US3 (2026-10-05, T019–T021)**: el freno afirma. Partida otra vez sobre `main`, con la prueba de
US3 y un decimal: ficha 188,2 KB, listado 169,4 KB, portada 146,7 KB; esos son los topes del total
(los 188 y 169 de arriba eran el mismo valor redondeado, y `main` los pasaba por 0,2 y 0,4 KB). Con
sesión, `main` abre la ficha en 188,2 y el listado en 169,4, y su total cambia de una corrida a otra
(209 a 218 KB: lo que se precarga después de abrir), así que con sesión se afirma la apertura y el
total solo se anota.

| Pantalla | Apertura | Total | «Compartir» después de abrir |
|---|---|---|---|
| Ficha | 148,7 KB | 176,3 KB | ~720 ms |
| No publicado | 148,7 KB | 149,9 KB | — |
| Listado (con y sin filtro) | 146,7 KB | 156,7 KB | — |
| Ficha, con la sesión de quien publica | 148,7 KB | ~209 KB | — |
| Listado, con sesión | 146,7 KB | ~203–211 KB | — |
| Portada | 144,8 KB (partida 146,7) | 146,0 KB | — |

La portada abre 1,9 KB más liviana que en `main` (FR-005, SC-004): R5.2 le saca la pantalla de error.
Demostración del freno (SC-005, sin commitear): 4,5 KB que no se comprimen sumados a la cáscara de
«Compartir» → `Ficha: 153.4 KB de apertura, 3.4 KB por encima de 150`. Corrida sobre `main`, el
mismo freno dice `Ficha: 188.2 KB de apertura, 38.2 KB por encima de 150` y
`Listado: 169.4 KB de apertura, 19.4 KB por encima de 150`.

**Revisión (2026-10-05)**, medido igual, sin R5.2 (`ErrorScreen` en el peso de apertura otra vez)
y con `ListingShell` pidiendo el listado de nuevo en el próximo montaje si no llegó:

| Pantalla | Apertura | Total |
|---|---|---|
| Ficha | 149,6 KB | 176,1 KB |
| No publicado | 149,6 KB | 149,6 KB |
| Listado (con y sin filtro) | 147,3 KB | 156,2 KB |
| Portada | 145,1 KB | 145,1 KB |

La ficha entra con 0,4 KB de aire: la próxima hoja cliente de la ficha tiene que traer su propia
palanca (la siguiente sigue siendo `tailwind-merge`, §R5).

Estimación con los tamaños de R0: la ficha baja ~12 (R2) + ~21 (R3) + ~2 (R5.1) + ~3 (R5.2) ≈ 38 KB
→ ~150; el listado ~12 (R2) + ~4 (R4) + ~3 (R5.2) ≈ 19 KB → ~148. Es justo: por eso se mide.

## R7 — El freno

**Decisión:** `tests/e2e/animales-rendimiento.spec.ts` mide con `scriptWeight(page)` (nuevo en
`tests/e2e/support/web-vitals.ts`, devuelve `{ open, total }` según R1) la ficha de un animal a la
vista, una ficha de un código que no existe, el listado sin filtros, el listado con un filtro y la
portada. Para cada una afirma `open <= 150 KB` con un mensaje que dice la pantalla, los KB medidos y
los KB de más; para la ficha y el listado sin sesión afirma `total <=` su valor de partida, con el
mismo mensaje (con sesión el total varía entre corridas y solo se anota, R6 §US3). La portada se afirma contra 150 KB (el freno no congela la portada en su valor de hoy: la
comparación contra el de antes se hace en esta corrida, R6). Además mide el tiempo desde
`loadEventEnd` hasta que «Compartir» está a la vista (≤ 1,5 s, FR-012). Las anotaciones
`rendimiento` siguen, con apertura y total.

**KB** son 1024 bytes, como en `perfil-rendimiento.spec.ts` y en `.lighthouserc.json` (153600).
