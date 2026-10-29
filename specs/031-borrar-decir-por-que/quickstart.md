# Quickstart — validar «¿Por qué lo borrás?»

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + las cuatro personas sintéticas
pnpm db:types
pnpm dev                          # sin RESEND_API_KEY, así el enlace de ingreso queda en .artifacts/mail/
```

## Comprobar

1. **Animal (US1)**: entrar como una persona sembrada con animales. En «Mis animales», «Borrar» en
   una hembra disponible: «¿Por qué la borrás?» con cinco opciones, ninguna elegida, entre el aviso y
   «Borrar para siempre». Elegir una, tocarla otra vez (queda sin elegir), elegir otra y borrar. En
   un macho en proceso: «¿Por qué lo borrás?» y «Lo di en adopción…». En uno adoptado o dado de
   baja: la confirmación de hoy. Con la red cortada en las herramientas del navegador: el aviso, la
   opción sigue elegida; con la red, se borra.
2. **Camada (US2)**: «Borrar la camada» en una con alguna cría sin adoptar: la pregunta una vez, en
   femenino. En una con todas adoptadas: la de hoy. «Quitar» una cría: sin pregunta.
3. **Teléfono angosto**: a 390 × 667, la lista corre dentro de la confirmación y los botones se
   alcanzan al terminarla.
4. **Encuestas (US3)**: entrar como la persona sembrada que administra y abrir `/revision/encuestas`:
   «Por qué se borraron animales» con las cuentas, las barras y la tabla de animales y camadas, sin
   nombres. Sin sesión o como otra persona: la pantalla no existe.

## Pruebas

```bash
pnpm test -- src/lib/pets/deletion-reason src/lib/schemas/pet-status src/lib/surveys/deletion-summary src/lib/analytics/deletion-reason-events
pnpm test -- tests/db/deletion-reasons
pnpm gates:affected
node scripts/walk.mjs --story borrar-decir-por-que --user /mis-animales /revision/encuestas
```

Lo que se guarda está en [data-model.md](./data-model.md) y las acciones en
[contracts/server-actions.md](./contracts/server-actions.md).
