# Contrato de navegación: el destino a través de un enlace que no sirvió

`<d>` es un destino válido, codificado. `<x>` es uno inválido (otra URL, `//host`, control).

| Desde | Con | Va a |
|---|---|---|
| `/auth/confirm?link=L&token_hash=T&next=<d>` (enlace vencido, usado o reemplazado) | — | `/entrar/enlace?motivo=M&link=L&next=<d>` |
| `/auth/confirm?link=L&token_hash=T&next=<d>` (sin fila o consumo fallido) | — | `/entrar/enlace?motivo=unknown[&link=L]&next=<d>` |
| `/auth/confirm?…&next=<x>` o sin `next` | — | `/entrar/enlace?motivo=M[&link=L]` (sin `next`) |
| `/entrar/enlace?…&next=<d>` | «Enviarme otro enlace» | correo con `/auth/confirm?link=L2&token_hash=T2&next=<d>` |
| `/entrar/enlace?motivo=unknown&next=<d>` (sin `link`) | «Escribir mi correo» | `/entrar?next=<d>` |
| `/entrar/enlace?…` sin `next` | «Escribir mi correo» | `/entrar` |
| `/entrar?next=<d>` | pedir enlace | `/entrar/revisa-tu-correo?next=<d>` |
| `/entrar/revisa-tu-correo?next=<d>` | pedir otro | correo con `…&next=<d>` |
| `/entrar/revisa-tu-correo?next=<d>` | volver | `/entrar?next=<d>` |
| `/entrar/enlace?motivo=otra-cuenta…` | — | sin cambios (sin destino) |

Ningún correo sale con `next=<x>`: el servidor lo filtra antes de armar el enlace.
