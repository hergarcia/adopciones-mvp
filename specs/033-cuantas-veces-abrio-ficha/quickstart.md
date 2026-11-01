# Quickstart — validar «Cómo le va a…»

## Preparar

```bash
pnpm exec supabase start
pnpm exec supabase db reset      # migraciones + las cuatro personas sintéticas
pnpm db:types
pnpm dev                          # sin RESEND_API_KEY, así el enlace de ingreso queda en .artifacts/mail/
```

## Comprobar

1. **Un animal (US1)**: entrar como una persona sembrada que publicó un animal que pide el teléfono.
   Abrir su página en «Mis animales»: «Cómo le va a <nombre>», «desde que lo publicaste» (la
   semilla corre después de la migración, así que sus animales cuentan como nuevos), el vacío «Todavía nadie abrió la ficha de <nombre>» con «Copiar el texto
   para el grupo». En una ventana privada, abrir su ficha dos veces y pasar por su tarjeta del
   listado sin abrirla. Con otra persona sin teléfono, tocar «Quiero adoptar». Volver a la página:
   2 aperturas, 1 toque, 1 frenado por el teléfono, 0 solicitudes, «Pedís el teléfono verificado» y
   ningún renglón de identidad. Abrir la ficha propia y volver: siguen 2.
2. **Vista previa**: `curl -A "WhatsApp/2.23" http://localhost:3000/animales/<código>` y volver:
   las aperturas no subieron.
3. **Identidad**: editar el animal para pedir la identidad; con una persona de nivel 1, tocar «Quiero
   adoptar»: aparece el renglón de identidad con 1 y «Pedís la identidad verificada». Volver a pedir
   solo el teléfono: el renglón sigue, con 1.
4. **Una camada (US2)**: abrir la ficha de una camada sembrada y el enlace de una cría como otras
   personas, tocar «Quiero adoptar» en una cría: la página de la camada suma 2 aperturas y 1 toque.
5. **Error**: el estado de error se prueba con `readPetStats` devolviendo error (la prueba de la
   acción o un `id` ajeno en desarrollo). Con el bloque en error, «Probar de nuevo» vuelve a pedir
   solo los números; editar, pausar y compartir siguen andando.
6. **Privacidad**: como otra persona, abrir `/mis-animales/<id>` del animal ajeno: «Este animal no
   existe»; la ficha pública, el perfil y el listado no muestran ningún número.
7. **Anchos**: a 390 px el bloque va debajo de las acciones; a 1280, debajo de la foto, en la columna
   angosta.

## Pruebas

```bash
pnpm test -- src/lib/pet-stats src/lib/schemas/pet-stats
pnpm test -- tests/db/publication-stats
pnpm gates:affected
node scripts/walk.mjs --story cuantas-veces-abrio-ficha --user /mis-animales
```

Lo que se guarda está en [data-model.md](./data-model.md) y lo que se llama en
[contracts/server-actions.md](./contracts/server-actions.md).
