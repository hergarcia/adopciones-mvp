# Data Model: Que el enlace nuevo del correo lleve a publicar

Sin cambios en la base. No hay tablas, columnas ni políticas nuevas.

## Destino (valor en tránsito, no persistido)

- **Qué es**: una ruta de este sitio (`/…`), con su query.
- **Validación**: `safeDestination` — empieza con una sola `/`, no `//` ni `/\`, sin caracteres de
  control. Lo que no pasa se trata como sin destino.
- **Ciclo**: nace en `/entrar?next=…` → va en el enlace del correo → si el enlace no sirve, en
  `/entrar/enlace?…&next=…` → en el pedido del enlace nuevo (`resendLinkFor` o `/entrar?next=…` →
  `/entrar/revisa-tu-correo?next=…` → `requestLoginLink`) → en el enlace nuevo → se usa al entrar
  (o pasa por `/completar-perfil?next=…`) y no queda en ningún lado.
