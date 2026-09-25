# 11 — Criterio de Hernán

Lo que usa `hernan-proxy` para predecir si Hernán aprobaría una historia, una decisión de
producto o una pantalla (`09-flujo-de-trabajo.md` §El enjambre). No reemplaza a los otros docs:
la guía de diseño es `10-design-system.md`, el alcance es `03-mvp-features.md`, y cada
«Descartado» de `docs/` es un veto que ya se dio. Acá va lo que esos docs no dicen: cómo mira
Hernán, en sus palabras cuando las hay.

**Este doc solo crece.** El enjambre le agrega líneas y nunca borra ni cambia una
(`scripts/protected/rules.mjs`). Un criterio que deja de valer no se borra: se agrega una línea
nueva que lo reemplaza y dice a cuál. Cada línea lleva la fecha y de dónde sale.

## Cómo mira

- (2026-09-20, #21) Juzga rápido y bien lo que puede ver: la app corriendo o una maqueta con
  contenido real. Elegir en abstracto le cuesta («me cuesta mucho elegir, siento que no estoy
  capacitado para hacerlo», ante tres direcciones de layout para pantallas que no existían). Una
  propuesta que le pide elegir una arquitectura en prosa está mal hecha; una que le muestra la
  cosa, bien.
- (2026-09-17) Lo que depende de él lo quiere como preguntas con opciones y una recomendación
  primero, no como prosa de la que tenga que sacar qué se le pregunta.
- (2026-09-25) Prefiere que el trabajo avance y él vete después, antes que firmar cada paso.

## Identidad y pantallas

- (2026-09-18, F00) «Demasiado genérico, hay miles de páginas con ese estilo.» Correcto y
  accesible no alcanza: quiere que se note «que hay trabajo y cariño». Una pantalla que podría
  ser de cualquier SaaS con otro color se rechaza aunque cumpla la guía. La identidad está en la
  forma, la tipografía y los recursos del cartel, no solo en los colores.
- (2026-09-20, #21) «Está muy enfocado a móvil, en web se ve MUY MAL.» La pantalla ancha vale
  tanto como el teléfono. Una columna perdida en espacio vacío, una cabecera lejos del contenido
  al que pertenece o una grilla que no ganó columnas es un rechazo.
- (2026-09-22, #24) Una pieza de terceros con el formato literal de su marca (el botón de Google
  con tema oscuro y Google Sans) es «nada que ver con nuestro diseño». Se integra en la voz del
  cartel, y de la marca ajena se respeta solo lo innegociable (la G oficial a color, sobre blanco).

## Producto

- (2026-09-23, #27) Un alta que le vuelve a pedir a la persona lo que ya sabemos «se siente
  precaria»: si entró con Google, su nombre ya está escrito. Pero nada se elige por ella: la foto
  de Google se ofrece con un toque, no se pone.
- (2026-09-16) Una historia dice el qué en lenguaje de producto y tiene tamaño de feature. Si
  habla de tablas, endpoints o componentes, está contando el cómo.

## Vetos

Una línea por veto, que agrega el Director: la fecha, qué se vetó (issue o PR), el motivo en
palabras de Hernán y qué criterio de arriba confirma o suma.
