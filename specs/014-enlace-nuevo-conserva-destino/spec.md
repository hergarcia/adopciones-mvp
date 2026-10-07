# Feature Specification: Que el enlace nuevo del correo lleve a publicar, no a Mi perfil

**Feature Branch**: `feature/119-enlace-nuevo-conserva-destino`

**Created**: 2026-10-07

**Status**: Draft

**Input**: Historia #119 del backlog, milestone «M2 - Publicación y difusión». Seguimiento de #61
(criterio US1-AS9 de la portada, severidad alta). El cuerpo verbatim de la historia acompaña a esta
spec (`story.md`).

**Ya construido** (historia #9): el ingreso con enlace por correo ya acepta un destino y el enlace
que sale lo lleva; al abrir un enlace que sirve, la persona llega a ese destino, y si es su primera
vez pasa por completar el perfil y después sigue a ese destino. El filtro que solo admite destinos
de este sitio ya existe y descarta cualquier otro, dejando a la persona en Mi perfil. «El enlace no
sirve», con sus motivos (vencido, ya usado, reemplazado por uno más nuevo, desconocido) y sus dos
salidas («Enviarme otro enlace» y «Escribir mi correo»), ya existe. Publicar ya exige el teléfono
verificado y ya conserva el destino a través de esa verificación (#10). Esta spec no rehace nada de
eso. Lo que falta, y es lo que esta historia construye:

- cuando el enlace abierto no sirve, «El enlace no sirve» no se entera de a dónde iba la persona;
- «Enviarme otro enlace» pide el enlace nuevo sin destino, y el nuevo deja a la persona en Mi perfil;
- «Escribir mi correo» la lleva a escribir su dirección sin destino, y el enlace que le llega
  también la deja en Mi perfil.

**Vocabulario de esta spec**: el **destino** es la pantalla de este sitio a la que iba la persona
cuando pidió el enlace (por ejemplo, publicar un animal, o la ficha de un animal). El **enlace que
no sirvió** es el que la persona abrió y la llevó a «El enlace no sirve». El **enlace nuevo** es el
que le llega después de usar una de las dos salidas de esa pantalla. **Un destino válido** es una
pantalla de este sitio, con el mismo criterio que ya aplica el ingreso de #9; cualquier otra cosa
(otro sitio, algo que no es una pantalla) es **un destino inválido**. **«Escribir mi correo»** es la salida de
«El enlace no sirve» que lleva a la pantalla de ingreso de #9, donde la persona escribe su dirección
(o entra con Google); esta spec la nombra igual que la historia, por el botón. **Sin destino** quiere decir
que la persona pidió el enlace sin venir de ningún lado, por ejemplo desde «Entrar» en la cabecera.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - «Enviarme otro enlace» lleva al destino al que iba (Priority: P1)

Valeria tocó «Publicar un animal» en la portada sin sesión, pidió el enlace por correo y lo abrió
dos horas después, cuando ya había vencido. Ve «El enlace no sirve» y toca «Enviarme otro enlace».
Abre el correo nuevo y llega a publicar un animal; como todavía no verificó su teléfono, pasa
primero por verificarlo y después sigue a publicar. Si es su primera vez, completa el perfil y
sigue hacia publicar, no a Mi perfil.

**Why this priority**: es el camino más común de quien abre el correo tarde, y es la rescatista
nueva que la portada trajo a publicar. Cortarle ese primer paso mueve en contra la primera métrica
de docs/03 §Métricas de éxito (rescatistas que publican por su cuenta). Es la salida que «El enlace
no sirve» ofrece cuando el enlace se reconoce, que es casi siempre.

**Independent Test**: sin sesión, pedir un enlace desde «Publicar un animal» de la portada, dejarlo
vencer (o usarlo, o pedir uno más nuevo), abrirlo, tocar «Enviarme otro enlace» y abrir el enlace
nuevo: se llega a publicar (o a verificar el teléfono y después a publicar). Repetir con una
persona nueva y comprobar que, al completar el perfil, sigue a publicar. Repetir pidiendo el primer
enlace desde «Entrar» en la cabecera y comprobar que el nuevo lleva a Mi perfil.

**Acceptance Scenarios**:

1. **Given** que toqué «Publicar un animal» en la portada sin sesión y el enlace del correo venció,
   **When** pido otro con «Enviarme otro enlace» y lo abro, **Then** llego a publicar un animal (o a
   verificar mi teléfono y después a publicar, si todavía no lo verifiqué).
2. **Given** lo anterior y que además es mi primera vez, **When** abro el enlace nuevo y completo
   el perfil, **Then** sigo hacia publicar y no a Mi perfil.
3. **Given** que pedí un enlace sin destino (desde «Entrar» en la cabecera) y venció, **When** pido
   otro desde «El enlace no sirve» y lo abro, **Then** llego a Mi perfil, como hoy.
4. **Given** que el enlace que abrí ya se había usado, **When** pido otro desde esa pantalla y lo
   abro, **Then** llego al destino al que iba.
5. **Given** que abro un enlace viejo después de haber pedido uno más nuevo, **When** veo «El enlace
   no sirve» y abro el último que me llegó, **Then** llego al destino al que iba.
6. **Given** que pido otro enlace dos veces seguidas desde esa pantalla (pasado el tiempo de espera
   entre pedidos), **When** abro el último, **Then** llego al destino al que iba.
7. **Given** que iba a la ficha de un animal y no a publicar, **When** el enlace vence, pido otro y
   lo abro, **Then** llego a esa ficha.
8. **Given** que abro el enlace nuevo en otro teléfono o en otra ventana, **When** entro, **Then**
   llego igual al destino al que iba.
9. **Given** que el destino del enlace que no sirvió es un destino inválido, **When** pido otro y lo
   abro, **Then** llego a Mi perfil y nunca a otro sitio.
10. **Given** que pedí demasiados enlaces seguidos, **When** intento pedir otro desde esa pantalla,
    **Then** veo cuánto tengo que esperar, como hoy; **and when** lo pido pasado ese tiempo y lo
    abro, **then** llego al destino al que iba.
11. **Given** que el correo no se pudo mandar, **When** pido otro, **Then** veo el aviso de que no
    salió, como hoy; **and when** reintento con éxito y abro el enlace, **then** llego al destino al
    que iba.
12. **Given** que mi cuenta está suspendida, **When** abro el enlace nuevo, **Then** veo la pantalla
    de cuenta suspendida, como hoy, y no llego al destino.

---

### User Story 2 - «Escribir mi correo» lleva al destino al que iba (Priority: P2)

Martín abrió un enlace de ingreso que el sitio ya no reconoce. «El enlace no sirve» le ofrece
«Escribir mi correo». Escribe su dirección, abre el enlace que le llega y llega a la pantalla a la
que iba cuando pidió el primero, no a Mi perfil.

**Why this priority**: es la misma promesa de #9 («no perdés a dónde ibas») por la otra salida de la
pantalla (decisión 2026-10-07 del product-owner). Aparece menos que la de US1, porque «El enlace no
sirve» ofrece escribir el correo solo cuando no puede mandar otro enlace por su cuenta.

**Independent Test**: sin sesión, llegar a «El enlace no sirve» desde un enlace con destino que el
sitio no reconoce, tocar «Escribir mi correo», escribir la dirección, abrir el enlace que llega y
llegar al destino. Repetir pidiendo de nuevo el enlace desde «Revisá tu correo» antes de abrirlo, y
llegar igual al destino.

**Acceptance Scenarios**:

1. **Given** que el enlace que abrí no sirve y la pantalla me ofrece «Escribir mi correo», **When**
   la elijo, escribo mi dirección y abro el enlace que me llega, **Then** llego al destino al que
   iba (publicar, o verificar el teléfono y después publicar).
2. **Given** lo anterior y que además es mi primera vez, **When** abro el enlace y completo el
   perfil, **Then** sigo hacia el destino y no a Mi perfil.
3. **Given** que ya escribí mi dirección y estoy en «Revisá tu correo», **When** pido que me manden
   otro enlace desde ahí y abro el último, **Then** llego al destino al que iba.
4. **Given** que el enlace que no sirvió no tenía destino, **When** elijo «Escribir mi correo»,
   escribo mi dirección y abro el enlace, **Then** llego a Mi perfil, como hoy.
5. **Given** que el destino del enlace que no sirvió es un destino inválido, **When** elijo
   «Escribir mi correo» y abro el enlace que me llega, **Then** llego a Mi perfil y nunca a otro
   sitio.
6. **Given** que el enlace que no sirvió llevaba un destino, **When** elijo «Escribir mi correo» y en
   esa pantalla entro con Google en lugar de pedir el enlace, **Then** llego igual al destino al que
   iba.

---

### Edge Cases

- **Destino inválido en el enlace que no sirvió**: se descarta antes de ofrecerlo a cualquier
  salida; el enlace nuevo lleva a Mi perfil (US1-AS9, US2-AS5).
- **Sin destino**: todo sigue como hoy, a Mi perfil (US1-AS3, US2-AS4).
- **Destino que la persona no puede ver al llegar** (por ejemplo, una ficha que ya no está a la
  vista): la persona llega a esa pantalla y ve lo que esa pantalla ya muestra a cualquiera en ese
  caso; esta historia no lo cambia.
- **Publicar sin teléfono verificado**: llega primero a verificar el teléfono y después sigue a
  publicar, como hoy (US1-AS1).
- **«El enlace no sirve» porque hay otra cuenta con sesión**: este motivo no ofrece pedir otro
  enlace y queda como hoy, sin destino; cambiar ese motivo está fuera del alcance (la historia
  excluye cambiar los motivos de «El enlace no sirve»).
- **La persona ya tiene sesión con la misma dirección al abrir el enlace nuevo**: llega al destino,
  como ya pasa con cualquier enlace que sirve.
- **Varias salidas seguidas** (pedir otro, que falle, reintentar; o esperar el tiempo de espera y
  volver a pedir): cada enlace que sale lleva el mismo destino (US1-AS6, US1-AS10, US1-AS11).
- **Otro dispositivo o ventana**: el destino viaja con el enlace, así que se respeta donde sea que
  se abra (US1-AS8).
- **Cuenta suspendida**: gana la pantalla de cuenta suspendida, como hoy (US1-AS12).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cuando la persona abre un enlace de ingreso que no sirve, «El enlace no sirve» MUST
  conocer el destino que traía ese enlace, ya filtrado: un destino inválido se trata como sin
  destino.
- **FR-002**: «Enviarme otro enlace» MUST pedir el enlace nuevo con el mismo destino que traía el
  enlace que no sirvió, sin cambiarlo ni inventar uno.
- **FR-003**: «Escribir mi correo» MUST llevar a la persona a escribir su dirección conservando ese
  mismo destino, de modo que el enlace que le llegue la lleve a él; también si en esa pantalla
  entra con Google.
- **FR-004**: Pedir otro enlace desde «Revisá tu correo» MUST conservar el destino con el que se
  pidió el enlace anterior.
- **FR-005**: Al abrir el enlace nuevo, la persona MUST llegar al destino; si es su primera vez,
  MUST pasar por completar el perfil y después seguir al destino.
- **FR-006**: Sin destino, o con un destino inválido, la persona MUST llegar a Mi perfil, como hoy;
  nunca a otro sitio.
- **FR-007**: El tiempo de espera entre pedidos, el aviso de que el correo no salió y la pantalla de
  cuenta suspendida MUST seguir como hoy, y un pedido hecho después de cualquiera de ellos MUST
  conservar el destino.
- **FR-008**: El destino MUST NOT guardarse en la cuenta de la persona: viaja con el pedido del
  enlace y deja de importar al usarlo (decisión 2026-10-07 del product-owner).
- **FR-009**: Las pantallas «El enlace no sirve», «Escribir mi correo», «Revisá tu correo» y
  «Completar el perfil» MUST NOT cambiar nada visible: mismos textos, mismos botones, mismo orden.
  En particular, el destino nunca aparece escrito en el contenido de ninguna de esas pantallas.
- **FR-010**: «El enlace no sirve» MUST seguir sin mostrar la dirección de correo a la que se mandó
  el enlace (regla de #9): conservar el destino no la expone.

### Key Entities

- **Destino**: la pantalla de este sitio a la que iba la persona. Acompaña al pedido del enlace y a
  cada enlace que sale de él; no queda guardado en la cuenta.
- **Enlace de ingreso**: el que se manda por correo, con su motivo de no servir (vencido, ya usado,
  reemplazado, desconocido) y, ahora, el destino que lleva consigo hasta la salida que la persona
  elija.

## Pantallas

- **El enlace no sirve** (de #9): sin cambios visibles; sus dos salidas conservan el destino. Sus
  estados (enviando, enviado, error, tiempo de espera) quedan como hoy. Vacío: no aplica.
- **Escribir mi correo** (de #9): sin cambios visibles; el pedido conserva el destino. Vacío: no
  aplica.
- **Revisá tu correo** (de #9): sin cambios visibles; pedir otro desde ahí conserva el destino.
  Vacío: no aplica.
- **Completar el perfil** (de #9): sin cambios visibles; al terminar sigue al destino. Vacío: no
  aplica.

## Datos personales

- No agrega datos ni cambia quién ve qué. Solo se recuerda a qué pantalla del sitio iba la persona,
  mientras dura el pedido del enlace; no queda en su cuenta (FR-008).
- La dirección de correo sigue sin mostrarse en «El enlace no sirve» (FR-010).

## Medición

- No agrega eventos. Se lee en los que ya registran #9 y #61: los ingresos desde «Publicar un
  animal» de la portada que terminan en una publicación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En los 12 escenarios de US1 y los 6 de US2, el 100 % de los enlaces nuevos llevan al
  destino esperado (el que iba, o Mi perfil cuando no había destino o era inválido).
- **SC-002**: Ningún destino inválido lleva a la persona a otro sitio, en ninguna de las dos
  salidas ni desde «Revisá tu correo» (0 casos).
- **SC-003**: Desde «El enlace no sirve», quien venía de «Publicar un animal» llega a publicar con
  un solo correo nuevo abierto y sin volver a la portada: cero toques extra frente a quien abrió el
  primer enlace a tiempo.
- **SC-004**: Ninguna de las cuatro pantallas tocadas cambia lo que muestra: una comparación antes y
  después de cada una no muestra diferencias.
- **SC-005**: Los ingresos desde «Publicar un animal» que terminan en una publicación suben respecto
  de antes de este arreglo, leído en los eventos que ya existen.

## Assumptions

- Lo ya construido por #9 y #10 (destino en el pedido del enlace, filtro de destinos del sitio,
  completar el perfil siguiendo al destino, verificación de teléfono conservando el destino) se usa
  tal cual; esta historia no lo rehace.
- «Escribir mi correo» es la salida que «El enlace no sirve» ofrece cuando no puede mandar otro
  enlace por su cuenta (el enlace no se reconoce); conservar el destino ahí significa llevarlo en
  esa ida a escribir el correo, y vale igual si la persona entra con Google desde esa pantalla.
- Pedir otro enlace desde «Revisá tu correo» también conserva el destino (FR-004). La historia no
  lo nombra, pero sin esto «Escribir mi correo» rompe la promesa en cuanto la persona pide un
  segundo enlace antes de abrir el primero; es barato y no cambia nada visible, así que se pliega.
- El motivo «hay otra cuenta con sesión» queda como hoy, sin destino: la historia excluye cambiar
  los motivos de «El enlace no sirve».
- Las referencias a docs/09 §Umbral y docs/03 §1 en la historia son citas a documentos de
  producto, no detalles de implementación.
- El destino no se recuerda entre dispositivos ni días si la persona vuelve a entrar desde cero sin
  pasar por «El enlace no sirve» (fuera del alcance de la historia).
