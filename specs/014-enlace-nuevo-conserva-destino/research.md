# Research: Que el enlace nuevo del correo lleve a publicar

## R1. Dónde viaja el destino entre «El enlace no sirve» y el enlace nuevo

- **Decision**: en la query de la URL (`next`), igual que ya viaja en `/entrar` y en el enlace del
  correo, filtrado por `safeDestination` en cada lectura.
- **Rationale**: la decisión 2026-10-07 del product-owner prohíbe guardarlo en la cuenta; la URL
  ya es el canal de #9, sobrevive a otro dispositivo (el destino va dentro del enlace) y no suma
  estado.
- **Alternatives considered**: guardarlo en la fila del enlace de ingreso (reenviar lo leería del
  servidor, sin confiar en el cliente) — descartado: es guardar el destino del lado del servidor,
  justo lo que la decisión evita, y suma una migración; cookie httpOnly — descartado: no viaja a
  otro dispositivo ni a otra ventana privada (US1-AS8) y sería estado escondido.

## R2. Confiar en el destino que manda el cliente a la Server Action

- **Decision**: `issueLink` filtra con `safeDestination`/`carriedDestination` antes de ponerlo en
  el enlace.
- **Rationale**: el argumento de una Server Action lo controla el cliente; hoy el route handler ya
  filtra al usar, pero un correo nuestro con un `next` de otro sitio adentro es un enlace de
  phishing con nuestra firma aunque al final no redirija.
- **Alternatives considered**: confiar en el filtro del route handler solamente — descartado por lo
  anterior.

## R3. «Revisá tu correo» pide otro sin destino

- **Decision**: se pliega a esta historia (FR-004): el formulario navega con `next` y el botón de
  reenviar lo usa.
- **Rationale**: sin esto US2 se rompe en cuanto la persona pide un segundo enlace antes de abrir el
  primero; sin cambio visible, tres líneas.
- **Alternatives considered**: seguimiento aparte — descartado, no pasa el umbral de docs/09 por sí
  solo y es la misma promesa.

## R4. «Sin destino» vs «a Mi perfil»

- **Decision**: `carriedDestination` devuelve `null` cuando el destino filtrado es
  `DEFAULT_DESTINATION`, para que las URLs sin destino queden idénticas a las de hoy.
- **Rationale**: FR-006 y FR-009 (nada cambia para quien entra sin destino); evita `?next=%2Fmi-perfil`
  en todas partes.
