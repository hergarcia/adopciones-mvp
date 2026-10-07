---
description: "Tareas de la historia #119 — Que el enlace nuevo del correo lleve a publicar, no a Mi perfil"
---

# Tasks: Que el enlace nuevo del correo lleve a publicar, no a Mi perfil

**Input**: `specs/014-enlace-nuevo-conserva-destino/` — spec.md, plan.md (§Diseño técnico, §Qué se
testea y por qué), research.md (R1–R4), contracts/navegacion.md, quickstart.md

**Tests**: sí, y solo los de plan.md §Qué se testea y por qué. Lo que tiene test unitario se
sostiene al 100 % de mutación (`next-destination.ts`, `link-problem.ts`).

**Organización**: por user story, en orden de prioridad. Sin cambios visibles: antes de tocar TSX se
abre `docs/10-design-system.md` solo para confirmar que nada visual cambia; después de los TSX,
`vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1, US2). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: las funciones puras que deciden qué destino se arrastra y cómo se arma cada URL.
Bloquea las fases 2 y 3.

- [X] T001 [P] Escribir primero en `src/lib/auth/next-destination.test.ts` los casos de `carriedDestination` (destino válido con query → igual; `null`, `''`, `undefined` → `null`; `/mi-perfil` → `null`; `https://otro.com`, `//otro.com`, `/\otro.com`, relativa, salto de línea → `null`), `signInPath` (`null` → `/entrar`; destino → `/entrar?next=<codificado>`) y `checkEmailPath` (`null` → `/entrar/revisa-tu-correo`; destino → `…?next=<codificado>`) (plan §1, contracts/navegacion.md)
- [X] T002 Implementar `carriedDestination`, `signInPath` y `checkEmailPath` en `src/lib/auth/next-destination.ts` hasta que T001 pase
- [X] T003 [P] Escribir primero en `src/lib/auth/link-problem.test.ts` los casos de `linkProblemPath(motivo, linkId, next)`: con y sin `linkId`; con destino válido (aparece codificado como `next`); sin destino y con destino inválido (no aparece `next`); un destino con `?` y `&` no rompe los otros parámetros (plan §2)
- [X] T004 Implementar `linkProblemPath` en `src/lib/auth/link-problem.ts` con `URLSearchParams` y `carriedDestination` hasta que T003 pase

**Checkpoint**: `pnpm gates:affected` verde; nada cambia todavía en las pantallas.

---

## Fase 2: User Story 1 — «Enviarme otro enlace» lleva al destino al que iba (P1) 🎯 MVP

**Objetivo**: el destino del enlace que no sirvió llega a «El enlace no sirve» y al enlace nuevo que
se pide desde ahí.

**Prueba independiente**: quickstart.md §US1.

### Tests de US1

- [X] T005 [US1] Escribir en `tests/e2e/enlace-no-sirve.spec.ts` el flujo 1 de plan.md §Qué se testea: portada → «Publicar un animal» → pedir enlace con una dirección nueva → abrirlo → abrirlo otra vez **en un contexto nuevo del navegador** (otra ventana: cubre US1-AS8 y evita el minuto de espera entre pedidos, que se cuenta por navegador) → «El enlace no sirve» → «Enviarme otro enlace» → abrir el último → `completar-perfil?next=%2Fmis-animales%2Fpublicar` → guardar → `verificar-telefono?para=publicar` → código → `Publicar un animal`; borrar la persona al final (US1-AS1, AS2, AS4, AS8)

### Implementación de US1

- [X] T006 [US1] En `src/app/auth/confirm/route.ts`, pasar el `next` crudo a `problem()` en las tres salidas a «El enlace no sirve» y armar la URL con `linkProblemPath`; el caso `otra-cuenta` queda igual (plan §3)
- [X] T007 [US1] En `src/app/[locale]/(auth)/entrar/enlace/page.tsx`, leer `next` de `searchParams`, filtrarlo con `carriedDestination` y pasarlo como prop `next` a `LinkProblemScreen` (`null` cuando `!canResend(problem)`) (plan §4)
- [X] T008 [US1] En `src/components/auth/link-problem-screen.tsx`, sumar la prop `next: string | null` y llamar `resendLinkFor(linkId, next ?? undefined)` (plan §4, FR-002, FR-007)
- [X] T009 [US1] En `src/actions/auth.ts`, que `issueLink` ponga en el enlace `carriedDestination(next)` y omita `next` cuando es `null` (plan §6, research R2)

**Checkpoint**: T005 verde; `portada.spec.ts` y `alta.spec.ts` siguen verdes.

---

## Fase 3: User Story 2 — «Escribir mi correo» lleva al destino al que iba (P2)

**Objetivo**: la salida «Escribir mi correo» y el reenvío desde «Revisá tu correo» conservan el
destino.

**Prueba independiente**: quickstart.md §US2.

### Tests de US2

- [ ] T010 [US2] Sumar a `tests/e2e/enlace-no-sirve.spec.ts` el flujo 2 de plan.md §Qué se testea: `/auth/confirm` con id desconocido y `next=%2Fmis-animales%2Fpublicar` → «Escribir mi correo» lleva a `/entrar?next=%2Fmis-animales%2Fpublicar` → pedir enlace → `revisa-tu-correo?next=…` → pedir otro, adelantando el reloj de la página con `page.clock` y borrando solo la cookie `link-requests` para no esperar el minuto real → abrir el último → `completar-perfil?next=%2Fmis-animales%2Fpublicar`; y con `next=https%3A%2F%2Fotro.com` → «Escribir mi correo» lleva a `/entrar` a secas (US2-AS1, AS3, AS5)

### Implementación de US2

- [ ] T011 [US2] En `src/components/auth/link-problem-screen.tsx`, `href={signInPath(next)}` en «Escribir mi correo» (plan §4, FR-003)
- [ ] T012 [US2] En `src/components/auth/email-link-form.tsx`, navegar a `checkEmailPath(carriedDestination(next))` después de un pedido que salió (plan §5)
- [ ] T013 [US2] En `src/app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx`, leer `next`, filtrarlo con `carriedDestination`, pasarlo a `ResendLinkButton` y usar `signInPath(next)` en «volver»; en `src/components/auth/resend-link-button.tsx`, prop `next: string | null` y `requestLoginLink(email, next ?? undefined)` (plan §5, FR-004)

**Checkpoint**: T010 verde; los flujos de US1 siguen verdes.

---

## Fase 4: Pulido

- [ ] T014 Correr `vercel:react-best-practices` sobre los TSX tocados y `node scripts/walk.mjs --story enlace-nuevo-conserva-destino /entrar/enlace?motivo=expired /entrar/revisa-tu-correo` para confirmar que nada visual cambió (FR-009, SC-004)
- [ ] T015 Correr `pnpm gates:affected` y `pnpm mutation` sobre `next-destination.ts` y `link-problem.ts` al 100 %; validar quickstart.md a mano

---

## Dependencias

- Fase 1 bloquea las fases 2 y 3. US2 (fase 3) usa la prop `next` que crea T008, así que va después
  de US1.
- Dentro de cada fase, el test antes que la implementación.
