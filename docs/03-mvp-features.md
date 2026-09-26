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
- **Decisión (2026-09-25, product-owner):** se pide solo el frente de la cédula y una selfie con la
  cédula en la mano. Motivo: el frente alcanza para ver que es vigente y de quién es la cara, pedir
  el dorso es juntar datos que no hacen falta (Ley 18.331), y sostenerla en la selfie es lo que un
  revisor a mano tiene para distinguir a quien tiene la cédula de quien encontró una foto de ella.
- **Decisión (2026-09-25, product-owner):** el nivel 2 certifica que hay una persona real con cédula
  uruguaya vigente, no el nombre para mostrar, que sigue siendo libre. Motivo: muchos rescatistas
  se muestran con el nombre de su grupo o refugio, y guardar el nombre legal para compararlo sería
  guardar un dato de la cédula que docs/01 §Legal / datos dice que no se guarda.
- **Decisión (2026-09-25, product-owner):** números: fotos de hasta 10 MB, la espera anunciada es de
  hasta 2 días, el pedido vence a los 7 días sin resolver, y el tope es de 3 pedidos rechazados en
  30 días; retirar o vencer no cuenta. Motivo: la revisión es a mano y part-time, una semana sin
  respuesta ya es un pedido que la persona abandonó, y el tope tiene que frenar a quien prueba
  cédulas ajenas sin castigar a quien sacó una foto borrosa.
- **Decisión (2026-09-25, product-owner):** el resultado y el vencimiento se avisan por correo,
  sin imágenes ni datos de la cédula. Motivo: la persona no va a volver sola al sitio a mirar si ya
  la aprobaron, y sin aviso el nivel 2 se abandona en la espera; las notificaciones push están
  fuera del MVP y el correo es el canal que ya existe.
- **Decisión (2026-09-25, product-owner):** de un rechazo quedan el día y el motivo durante 30 días, lo
  que dura el tope, y quien administra los ve al revisar. Motivo: sin eso no hay tope de intentos
  ni forma de ver a alguien que prueba cédulas distintas; no guarda nada de la cédula y no dura más
  que lo que el tope necesita, que es lo más cerca de «guardar solo verificado el día X» (docs/01
  §Legal / datos).
- **Decisión (2026-09-25, product-owner):** cambiar de teléfono baja la cuenta como dice #10, pero
  al confirmar el nuevo vuelve a nivel 2 sin subir la cédula otra vez. Motivo: la identidad no
  cambió con el número, y volver a pedir la cédula por un cambio de chip es fricción que no compra
  confianza.

### 2. Publicación de animales
- Ficha: hasta 5 fotos, nombre, especie (**solo perro y gato**), sexo, edad aproximada, tamaño,
  castrado, vacunas, chip, convive con niños / perros / gatos, descripción, zona, urgencia.
- Estado: disponible / en proceso / adoptado / pausado.
- **Expiración automática a los 30-45 días** con recordatorio "¿sigue disponible?".
- El publicador puede exigir nivel mínimo de verificación a los solicitantes (1 o 2).
- Flag "soy rescatista/refugio" en el perfil. Sin roles complejos de organización.

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
- **Decisión (2026-09-25, product-owner):** quién administra lo designa el equipo por fuera del
  sitio, y nadie resuelve su propio pedido. Motivo: es la primera pantalla de administración y el
  nivel 2 no vale nada si quien lo da puede dárselo a sí mismo.

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
