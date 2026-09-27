# 03 — MVP: features

## Hipótesis a validar

> ¿Rescatistas y adoptantes valoran la verificación lo suficiente como para pasar por fricción
> extra en vez de quedarse en Facebook?

Todo lo que no ayuda a responder eso, afuera.

## Features

### 1. Cuentas y confianza (el diferencial)
- Registro con Google o con un enlace al email. Sin contraseñas. Google es la acción principal y
  la única a la vista; el enlace queda escondido como alternativa (decisión 2026-09-22, `docs/10`).
  Al entrar por Google el perfil llega con el nombre escrito y la foto de Google ofrecida, nunca
  puesta (decisión 2026-09-22, FR-030b de la historia 002).
- **Teléfono verificado obligatorio** por OTP (SMS o WhatsApp). Sin esto no se publica ni se solicita.
- **Niveles de verificación con badges visibles:**
  - Nivel 1: email + teléfono.
  - Nivel 2: cédula + selfie, **revisado a mano** las primeras semanas. Consentimiento explícito,
    revisar, borrar imágenes, guardar solo "verificado el día X".
  - Nivel 3: "avalado por" otro usuario verificado (típicamente un rescatista conocido).
- Perfil público: nombre, foto, zona (departamento + localidad), badges, fecha de alta, historial.
- **Teléfono y contacto nunca públicos.** Se revelan solo cuando una solicitud es aceptada.
- Reportar y bloquear usuario.
- **Decisión (2026-09-25, product-owner):** quedarse con el número se ofrece en la misma pantalla
  de «número en uso», con el código que la persona acaba de escribir bien, en vez de mandar otro.
  Motivo: ya demostró tener el número en la mano; un segundo código es fricción y plata sin
  ninguna prueba nueva (docs/01 §Verificación = fricción).
- **Decisión (2026-09-25, product-owner):** la cuenta anterior pierde el número del todo, se entera
  por correo en el momento y lo ve en su perfil, sin saber quién lo tiene. Motivo: si solo quedara
  sin verificar con el número guardado, la historia de M3 podría revelar el teléfono de otra
  persona; el correo llega a tiempo cuando el caso es un chip robado.
- **Decisión (2026-09-25, product-owner):** no se guarda nada que una las dos cuentas; la anterior
  guarda solo el día en que perdió el número. Motivo: el mínimo de datos que alcanza para
  explicarle qué pasó (docs/01 §Legal / datos).

### 2. Publicación de animales
- Ficha: hasta 5 fotos, nombre, especie (**solo perro y gato**), sexo, edad aproximada, tamaño,
  castrado, vacunas, chip, convive con niños / perros / gatos, descripción, zona, urgencia.
- Estado: disponible / en proceso / adoptado / pausado.
- **Expiración automática a los 30-45 días** con recordatorio "¿sigue disponible?".
- El publicador puede exigir nivel mínimo de verificación a los solicitantes (1 o 2).
- Flag "soy rescatista/refugio" en el perfil. Sin roles complejos de organización.
- **Decisión (2026-09-26, product-owner):** una publicación tiene al menos 1 foto y como máximo 5,
  en los mismos formatos y con el mismo tope de 10 MB que la foto del perfil. Motivo: una ficha sin
  foto no compite con un posteo de Facebook, y dos topes distintos para la misma acción de elegir
  una foto confunden.
- **Decisión (2026-09-26, product-owner):** obligatorios son foto, nombre, especie, sexo, edad
  aproximada, tamaño, castrado, vacunas, chip y zona; la descripción es opcional (hasta 2000
  caracteres) y el nombre tiene hasta 30. Convivencia con niños, perros y gatos se contesta con sí,
  no o no se sabe y arranca en no se sabe; vacunas es al día, incompletas o sin vacunar. Motivo: son
  lo que el adoptante pregunta siempre y el rescatista lo sabe; la convivencia muchas veces no se
  sabe, y obligar a inventarla engaña al adoptante.
- **Decisión (2026-09-26, product-owner):** la edad aproximada se carga en meses (1 a 11) o años
  (1 a 25), vale para el día en que se publica y avanza sola. Motivo: así la escribe un rescatista
  ("2 meses", "unos 3 años"), y un cachorro no puede quedar con 2 meses para siempre en una ficha
  que vive semanas.
- **Decisión (2026-09-26, product-owner):** el tamaño es el de adulto (chico, mediano o grande),
  estimado en un cachorro. Motivo: el adoptante decide por el perro que va a tener en su casa, no
  por el que ve en la foto.
- **Decisión (2026-09-26, product-owner):** la urgencia es una marca, sí o no. Motivo: es el
  "URGENTE" del posteo de Facebook, y docs/10 ya la dibuja como una sola etiqueta.
- **Decisión (2026-09-26, product-owner):** la zona del animal se propone desde el perfil y se puede
  cambiar. Motivo: casi siempre es la misma, pero los animales en hogar de tránsito están en otro
  lado.
- **Decisión (2026-09-26, product-owner):** el nombre y la descripción no aceptan teléfonos,
  correos ni enlaces, y se explica por qué. Motivo: si el rescatista deja su WhatsApp en la ficha,
  la solicitud no pasa por la plataforma, la verificación no se usa y la hipótesis no se puede medir
  (docs/03 §3, «la solicitud pasa por la plataforma, con verificación»).
- **Decisión (2026-09-26, product-owner):** no hay tope de animales publicados por persona, y
  publicar otro con el mismo nombre y especie avisa pero no frena. Motivo: un rescatista puede
  tener muchos en tránsito, y la primera métrica de éxito es justamente que publique más de uno; el
  aviso evita el duplicado por error sin trabar al que tiene dos Lunas.
- **Decisión (2026-09-26, product-owner):** un guardado que falla por la conexión conserva todo en
  pantalla y reintentar no duplica; lo escrito, sin las fotos, sobrevive a una recarga en el mismo
  navegador. Motivo: se carga desde el celular con señal que va y viene, y es la misma regla que el
  perfil (#35); perder cinco fotos y doce datos es volver a Facebook.
- **Decisión (2026-09-26, product-owner):** borrar la cuenta borra sus publicaciones y sus fotos.
  Motivo: una ficha sin un publicador verificado detrás contradice el diferencial, y guardar lo
  mínimo es la regla de datos (docs/01 §Legal / datos).

### 3. Búsqueda y difusión
- Listado con filtros: especie, sexo, tamaño, edad, departamento, castrado.
- **Fichas visibles sin registrarse**, link limpio, preview lindo al compartir (imagen OG con
  foto + nombre + zona).

> No vamos a reemplazar Facebook, lo vamos a usar de canal. El rescatista sigue posteando en su
> grupo, pero postea nuestro link. La solicitud pasa por la plataforma, con verificación.
> Ese es el mecanismo de crecimiento sin gastar.

### 4. Solicitud de adopción (el corazón)
- "Quiero adoptar": exige verificación y abre el **cuestionario estándar** (10-12 preguntas): tipo de
  vivienda, propia/alquilada (¿permite mascotas?), patio o balcón con red, quiénes viven, otras
  mascotas, horas solo por día, qué pasa si te mudás o viajás, experiencia previa, compromiso de
  castración, presupuesto veterinario, por qué este animal.
- **Bandeja de solicitudes** para el publicador: perfil + badges + respuestas; aceptar / rechazar /
  pedir más info.
- **Al aceptar se revela el contacto** de ambos + botón "abrir WhatsApp". Antes, nada.
- Límite de **3 solicitudes activas** por adoptante.
- Al rechazar, el publicador elige un motivo de una lista (dato clave).
- **Decisión (2026-09-25, product-owner):** no se vuelve a confirmar cada tanto un número
  verificado; la historia de M3 que revela el contacto decide si lo confirma antes de revelarlo.
  Motivo: confirmar cada tanto le cobra fricción a cada rescatista por un caso raro, y el daño
  aparece recién al revelar el contacto.

> Diseñar el cuestionario **con** 3-4 rescatistas antes de codearlo.

### 5. Cierre y seguimiento
- Marcar "Adoptado" eligiendo a qué solicitante se entregó (vínculo histórico).
- **Compromiso de adopción**: texto corto que ambos aceptan (castración, no abandono, devolver al
  rescatista si no puede tenerlo). Queda por email.
- **Un seguimiento automático a los 30 días**: foto + "¿cómo va?". El rescatista lo ve.
  Si responde, badge "adopción con seguimiento".

### 6. Panel de admin
- Cola de verificaciones de cédula.
- Cola de publicaciones nuevas (revisión manual las primeras semanas).
- Reportes, suspender usuarios.

### 7. Instrumentación (el objetivo real)
- Funnel: vio ficha, clic adoptar, completó cuestionario, aceptado, adoptado.
  Plausible / Umami / PostHog.
- Encuesta de 2 preguntas post-adopción y post-rechazo.
- Botón de feedback siempre visible + WhatsApp de soporte en el footer.

### 8. Multilingüe (transversal)
- Se lanza solo en español, pero **ningún texto vive hardcodeado**: todo en `messages/es.json`.
- Enums en DB como claves en inglés, traducidos al mostrar.
- Sin selector de idioma hasta que exista un segundo idioma.
- Detalle y convenciones en `06-i18n.md`.

## Fuera del MVP (a propósito)

| Feature | Por qué no |
|---|---|
| Perdidos/encontrados, donaciones, sitters | Cada una es otro producto. Ver 05-ideas-futuras.md |
| Chat in-app | Se habla por WhatsApp. Caro y la gente lo esquiva. |
| App nativa | PWA mobile-first alcanza. |
| Otras especies | Perros y gatos son el 95%. |
| KYC con proveedor | Manual hasta que el volumen obligue. |
| Mapa / geolocalización | Departamento de lista + localidad en texto. |
| Notificaciones push | Email + WhatsApp manual. |
| Pagos de cualquier tipo | Ni tarifa simbólica. Cero regulación. |
| Matching automático | No hay datos. |
| Favoritos, comentarios, likes | Ruido. |

## Decisiones

- **Decisión (2026-09-19):** la zona de una persona es **departamento + localidad**, no
  "departamento + barrio". El departamento se elige de una lista cerrada de 19; la localidad se
  escribe libre, con sugerencias filtradas por departamento. Motivo: no existe ninguna API de
  barrios de Uruguay confiable, "barrio" es concepto oficial solo en Montevideo y el resto del país
  se organiza por localidades. Para que Montevideo no quede como una sola entrada, sus barrios
  oficiales entran en la misma lista de sugerencias; la pantalla llama "Barrio" al campo en
  Montevideo y "Localidad" en los otros 18 departamentos. Detalle en la spec de la historia #9.

## Métricas de éxito (beta 2-3 meses, 3-5 rescatistas)

- ¿Al menos 3 rescatistas publicaron más de un animal **por su cuenta**?
- ¿Qué % de adoptantes completa nivel 2 cuando se lo exigen? (menos de 30% = fricción mal calibrada)
- ¿Qué % de solicitudes llega a aceptación y en cuánto tiempo responde el rescatista?
- ¿Algún rescatista dijo, sin que se le pregunte, "esto me ahorró trabajo"?

## Orden de construcción

1. Auth + perfil + verificación
2. Publicación + listado + link compartible
3. Solicitud + bandeja + aceptación
4. Cierre + seguimiento + admin
5. Beta cerrada

Estimación: 6-8 semanas part-time con Next.js + Supabase.
Costo: dominio + OTP (centavos por SMS) + tiers gratuitos. Menos de US$30/mes.
