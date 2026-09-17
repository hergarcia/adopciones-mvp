---
name: Historia
about: Una feature completa, contada desde la persona que la usa. El qué, nunca el cómo.
title: ""
labels: historia
---

## Historia
**Como** <rol> **quiero** <capacidad> **para** <valor>.

## Contexto
<qué problema resuelve y por qué ahora; cita de docs/01 o docs/03>

## Alcance
- Incluye: <lo que entra>
- No incluye (explícito): <lo que NO entra, aunque parezca obvio>

## Reglas de negocio
- <en lenguaje de producto: "el contacto de ambos se muestra solo cuando la solicitud fue aceptada">

## Criterios de aceptación
### Camino feliz
- **Dado** <situación> **cuando** <acción> **entonces** <lo que la persona ve o puede hacer>
### Casos borde (al menos 3)
- **Dado** <límite, vacío, duplicado, repetición, expiración> **cuando** … **entonces** …
### Errores y rechazos
- **Dado** <entrada inválida, sin permiso, vencido> **cuando** … **entonces** <qué ve y qué puede hacer>

## Pantallas
- <pantallas o secciones nuevas o cambiadas; para cada una, qué muestra cuando no hay nada>

## Datos personales
- <qué se guarda de la persona, quién lo ve, cuándo se borra — o "no aplica">

## Medición
- <eventos del funnel que emite (docs/03 §7) — o "no aplica">

## Dependencias
- #<historia previa> · <doc citado>

<!-- Palabras prohibidas (el cómo): tabla, columna, RLS, endpoint, trigger, código HTTP, Server Action, componente, hook, zod, Supabase, Postgres, migración, rutas de archivo. -->
