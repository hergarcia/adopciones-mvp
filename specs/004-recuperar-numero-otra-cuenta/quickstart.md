# Quickstart: ver quedarse con un número en local

```sh
pnpm exec supabase start
pnpm exec supabase db reset     # migraciones + seed: Ana verificada con 099 123 456, Marta sin teléfono
pnpm dev                        # sin RESEND_API_KEY: los correos quedan en .artifacts/mail/
```

Sin Twilio, cada mensaje de texto se escribe en `.artifacts/sms/<fecha>.json`; el código está en
`body`.

## Qué mirar

1. **Los tres caminos** — entrá como `marta@example.test`, «Verificar mi teléfono», escribí
   `099 123 456` (el de Ana), escribí el código de `.artifacts/sms/`. Llegás a «Ese número está en
   otra cuenta» con «Verificar otro número», «Entrar con esa cuenta» y «Es mío y no puedo entrar a
   esa cuenta», y la hora hasta la que podés quedártelo.
2. **Volver** — «Es mío…» → leé la confirmación → «Volver»: estás otra vez en los tres caminos y
   Ana no cambió.
3. **Quedarse con el número** — «Es mío…» → «Quedarme con este número»: llegás a «Mi perfil» con
   «Teléfono verificado» y «Nivel 1 desde» hoy. En `.artifacts/mail/` hay un correo para
   `ana@example.test` que dice que su teléfono quedó sin verificar, desde hoy, sin el número.
4. **El aviso** — entrá como Ana: «Mi perfil» dice «Sin verificar», desde hoy, porque otra cuenta
   demostró tener tu número. Nada de Marta.
5. **De vuelta** — como Ana, verificá `099 123 456`, elegí «Es mío…» y confirmá: el número vuelve a
   Ana, su aviso desaparece, y ahora Marta tiene el correo y el aviso.
6. **La prueba vence** — repetí el paso 1 y esperá más de 10 minutos con la pantalla abierta: pasa
   sola a «Hace falta un código nuevo», con el pedido a un toque.
7. **Entrar con esa cuenta** — desde los tres caminos, «Entrar con esa cuenta»: quedás en «Entrar»
   sin sesión; Ana sigue verificada.
