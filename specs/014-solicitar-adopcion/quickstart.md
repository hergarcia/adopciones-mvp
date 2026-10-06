# Quickstart — probar la historia #63 en local

1. `pnpm exec supabase start` y `pnpm exec supabase db reset` (migraciones + seed).
2. `pnpm dev` **sin** `RESEND_API_KEY`, así los correos y los enlaces de ingreso van a
   `.artifacts/mail/`.
3. El seed suma (en `supabase/seed.sql`, datos sintéticos `@example.test`) cuatro animales de Ana
   (nivel 1, rescatista): Tobi (disponible, castrado, pide teléfono), Luna (disponible, sin castrar,
   pide identidad), Michi (en proceso) y Nube (disponible); ninguna solicitud. Adoptantes: Dani
   (nivel 2) y Marta (sin teléfono: muestra la puerta de #10; con el teléfono verificado, la de
   identidad). El código de Twilio se escribe a archivo (KL-010).

## Camino feliz (US1)

- Sin sesión, abrir `/animales/<código de Tobi>` → «Quiero adoptar» → ingresar como Dani →
  llega al cuestionario de Tobi, sin la pregunta de castración.
- Elegir «Alquilada» → aparece el permiso del dueño. Escribir un celular en «Por qué este animal» →
  «Enviar solicitud» no manda y marca la respuesta. Corregir, recargar → todo sigue. Enviar → «Tu
  solicitud le llegó a …». `/mis-solicitudes` → Tobi primero, «1 de 3 solicitudes activas».
- La ficha de Tobi dice «Ver mi solicitud».

## Límite, retirar y respuestas propuestas (US2)

- Abrir el cuestionario de Nube → respuestas propuestas, «Por qué este animal» vacía. Enviar. Enviar
  por Michi (aviso de en proceso). Tocar «Quiero adoptar» en un cuarto animal → pantalla de límite →
  retirar una → cuestionario.

## Identidad (US3)

- La ficha de Luna dice que pide identidad verificada. «Quiero adoptar» con Marta → aviso de verificación pendiente →
  verificar el teléfono → vuelve a Luna → pantalla de identidad, sin preguntas → «Verificar mi identidad» → mandar el pedido → aprobarlo con quien
  administra → el correo en `.artifacts/mail/` trae «Ver a Luna».

## Cambios del animal y de las personas (US4)

- Pausar a Tobi → Mis solicitudes: activa, «no está disponible por ahora». Marcarlo adoptado →
  cerrada, «encontró hogar». Bloquear a Dani desde la cuenta de Ana → su solicitud
  por Nube se cierra con «ya no recibe solicitudes».

## Compuertas

`pnpm gates:affected` en las rondas; `pnpm verify` una vez al cerrar el build.
