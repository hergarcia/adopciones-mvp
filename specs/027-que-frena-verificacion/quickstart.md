# Quickstart — validar «¿Qué te frena?»

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + las cuatro personas sintéticas
pnpm db:types
pnpm dev                          # sin RESEND_API_KEY, así el enlace de ingreso queda en .artifacts/mail/
```

## Comprobar

1. **Identidad, desde un animal (US1)**: con una persona sembrada con teléfono verificado y sin
   identidad, abrir la ficha de un animal que pide nivel 2 → «Quiero adoptar» → «Ahora no» en el
   pedido. Se ve «¿Qué te frena para verificar tu identidad?» con cinco opciones; tocar «No quiero
   mandar fotos de mi cédula» vuelve a la ficha. Repetir «Ahora no»: sale directo.
2. **«Otra cosa»**: con otra persona, en la pregunta, abrir «Otra cosa», escribir `099 123 456` y
   «Enviar»: aviso de contacto, el texto queda. Pasar de 300: «Sobran N». Vacío: se manda y sale.
3. **Teléfono (US2)**: con una persona sin teléfono, «Publicar» → «Ahora no» → la pregunta del
   teléfono; elegir una opción vuelve a la pantalla desde la que tocó Publicar. Con un número a
   medias desde Mi perfil, «Cancelar la verificación» → la pregunta → Mi perfil. Con el teléfono
   verificado, cambiarlo y «Cancelar el cambio»: sin pregunta.
4. **Encuestas (US3)**: entrar como la persona sembrada que administra y abrir `/revision/encuestas`:
   «Por qué no se verificaron» con los dos bloques, las cuentas, las barras, la tabla por origen y el
   texto mandado, sin nombres. Sin sesión o como otra persona: la pantalla no existe.

## Pruebas

```bash
pnpm test -- src/lib/verification/exit-question src/lib/schemas/verification-exit src/lib/surveys/exit-summary src/lib/analytics/verification-exit-events
pnpm test -- tests/db/verification-exits
pnpm gates:affected
node scripts/walk.mjs --story que-frena-verificacion --user /verificar-identidad /revision/encuestas
```

Los detalles de lo que se guarda están en [data-model.md](./data-model.md) y los de las acciones en
[contracts/server-actions.md](./contracts/server-actions.md).
