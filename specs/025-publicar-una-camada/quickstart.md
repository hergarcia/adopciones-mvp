# Quickstart: probar las camadas (#205)

## Preparar

```bash
pnpm install
pnpm exec supabase start
pnpm exec supabase db reset     # migraciones + seed, con la camada sembrada
pnpm db:types
pnpm dev                        # sin RESEND_API_KEY, para que el enlace de ingreso quede en .artifacts/mail/
```

## Recorrido

1. Entrar como la persona sembrada con nivel 1 (`node scripts/walk.mjs --user`). «Publicar un
   animal» pregunta «¿Es un animal o una camada?». Elegir «Una camada».
2. Cargar lo común con 2 fotos, completar 4 crías con nombre y sexo (una con 1 foto propia) y
   publicar. «Mis animales» muestra el grupo con las 4 crías.
3. Abrir `/animales` en una ventana privada: la camada es una tarjeta «4 crías, 4 disponibles» y el
   total la cuenta una vez. Filtrar por «hembra»: aparece si tiene una hembra.
4. Abrir la tarjeta: la ficha muestra lo común, el publicador y las 4 crías; la que no tiene fotos
   propias muestra las de la camada. «Quiero adoptar» de una cría lleva a ingresar y después al
   cuestionario de esa cría.
5. Pegar el enlace en un lector de vista previa (o abrir `/camadas/{code}/imagen`): portada, nombre
   y zona.
6. Editar: agregar una quinta cría («Cría 5» propuesta) y guardar; quitar una cría con solicitudes
   y ver cuántas se cierran; dejar una sola y quitarla: aviso de que la camada se borra.
7. Como la persona que administra: «Publicaciones por revisar» muestra la camada una vez, con sus
   crías.

## Compuertas

```bash
pnpm gates:affected             # por user story
pnpm test -- tests/db/litters-privacy.test.ts tests/db/litters-rules.test.ts tests/db/listed-pets.test.ts
pnpm e2e -- tests/e2e/camada.spec.ts
pnpm verify                     # una vez, al cerrar el build
node scripts/walk.mjs --story publicar-una-camada --user /mis-animales/publicar?tipo=camada /mis-animales /animales
```
