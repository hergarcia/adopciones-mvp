# Quickstart — Un solo tamaño de hoja y el menú quieto al navegar

## Preparar

```sh
pnpm exec supabase start
pnpm exec supabase db reset
pnpm dev          # sin RESEND_API_KEY, para que walk.mjs encuentre el enlace
```

## 1. La hoja mide lo mismo y el menú no se corre (US1, SC-001–SC-004)

En el navegador, a 1280 de ancho, en cada pantalla —`/`, `/animales`, una ficha, `/entrar`,
`/opinar`, `/preguntas`, `/cuenta-borrada`, `/animales/NOEXISTE` y, con sesión, `/mis-animales`,
`/mi-perfil`, `/completar-perfil` (persona sin perfil)— pegar en la consola:

```js
const nav = document.querySelector('nav')
const sheet = nav.parentElement
;({
  sheet: Math.round(sheet.getBoundingClientRect().width),
  links: [...nav.querySelectorAll('a')].map((a) => {
    const r = a.getBoundingClientRect()
    return `${a.textContent.trim()}@${Math.round(r.left)},${Math.round(r.top)}`
  }),
})
```

Esperado: `sheet` es 1200 en todas; la lista `links` es idéntica entre pantallas con la misma
sesión. En `/opinar`, todos los `top` son iguales al del nombre del sitio (un renglón).

Repetir a 1100 (`sheet` igual al ancho de la ventana menos la barra, igual en todas) y a 1920
(`sheet` 1200). En Windows, comparar `/opinar` (corta) con `/animales` (larga): los `left` son los
mismos.

## 2. Las pantallas de una sola tarea (US2, SC-005)

A 1280: `/opinar`, `/entrar`, `/entrar?motivo=expired` (con aviso), `/entrar/revisa-tu-correo`
(después de pedir un enlace), `/completar-perfil`, `/cuenta-borrada`. En cada una, el título y la
bajada a la izquierda, la tarea arrancando en el mismo renglón pasada la mitad de la hoja (x > 600
en la medición de la hoja). En `/completar-perfil`, al bajar, el título sigue a la vista.

`/entrar/enlace?motivo=expired`: el bloque sigue centrado, ahora en el centro de la hoja.

## 3. Lo que no cambia (SC-006, SC-007)

- A 390, cada pantalla de arriba con las mismas piezas, en el mismo orden y alineación que en
  `main`.
- `/cuenta-suspendida` con una persona suspendida a 1280: la hoja angosta y sin menú.

## 4. Capturas para la revisión

```sh
node scripts/walk.mjs --story un-solo-tamano-hoja / /animales /entrar /opinar /preguntas /cuenta-borrada
node scripts/walk.mjs --story un-solo-tamano-hoja --user /mis-animales /mi-perfil
```
