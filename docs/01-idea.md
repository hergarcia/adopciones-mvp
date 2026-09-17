# 01 — La idea

## Qué es

Plataforma que conecta personas que dan animales en adopción (rescatistas, refugios, particulares)
con personas que quieren adoptar.

**Diferencial:** validación de la persona. Un mínimo de seguridad entre las partes *antes* de
intercambiar datos de contacto.

**Objetivo inicial:** no ganar dinero ni consumir capital. Construir un MVP, probarlo y entender
qué necesita la gente, qué le gusta y qué le falta.

## Por qué tiene sentido

- Hoy la adopción en Uruguay/LatAm pasa por grupos de Facebook, Instagram y WhatsApp. Es un caos:
  estafas ("pagá el flete y te lo mando"), gente que adopta para revender o criar, abandonos a la
  semana, rescatistas haciendo entrevistas manuales por WhatsApp.
- La confianza es exactamente lo que le falta a Facebook.
- **Insight clave:** una identidad verificada dentro de la comunidad animalista es un activo
  reutilizable. Es lo que hace posible después sitters, donaciones, perdidos. La verificación no es
  una feature, es la infraestructura.
- El competidor real no es otra plataforma de adopción: es Facebook + WhatsApp.

## Riesgos y cosas a tener en cuenta

### "Validación" esconde el problema difícil
Verificar identidad (cédula, teléfono) es lo fácil. Una persona verificada puede ser un pésimo
adoptante. Lo que le importa a un rescatista: ¿casa estable? ¿va a castrar? ¿tiene plata para el
veterinario? ¿va a mandar fotos?

- Pensar en **sistema de confianza por niveles**, no en un checkbox "verificado":
  teléfono, cédula, referencias, historial de adopciones con seguimiento positivo.
- **El que da en adopción también se verifica.** Hay vendedores disfrazados de rescatistas y gente
  que junta donaciones con fotos robadas.

### Verificación = fricción
Cada paso tira usuarios. Si se pide cédula antes de ver un perro, la gente vuelve a Facebook.
La verificación aparece justo cuando aporta valor: mirar es libre, *solicitar* o abrir chat exige
verificación.

### Huevo y gallina
Marketplace de dos lados. Los rescatistas ya tienen grupos con miles de miembros; no se mudan por
"seguridad" en abstracto. Se mudan si les das **una herramienta que les ahorre trabajo**: gestión de
solicitantes, cuestionario estándar, ficha del animal con historial, contrato digital, recordatorios
de seguimiento.

Al principio, el producto real es un **CRM para rescatistas con verificación incluida**.
Si los rescatistas traen los animales, los adoptantes vienen solos.

### Monetización (no aplica ahora, pero conviene saberlo)
La adopción es y debe ser gratis. Cobrar al adoptante es feo y mata la adopción; cobrar al
rescatista es cobrarle a quien pone plata de su bolsillo. Si algún día hay ingresos, vienen de los
bordes: sitters, alianzas con veterinarias/petshops, sponsors. El core es un loss leader.

### Legal / datos
- Guardar cédulas: Ley 18.331 (protección de datos personales).
- Al principio: revisión manual, consentimiento explícito, borrar imágenes después de revisar,
  guardar solo "verificado el día X".
- Más adelante: proveedor de verificación (Truora, Didit, Metamap, Veriff) que devuelva sí/no sin
  almacenar el documento.
- Pensar qué pasa cuando alguien "verificado" resulta ser un abusador: responsabilidad y comunicación.

### Ventaja local
En Uruguay el microchip es obligatorio y existe el RENAC (INBA). Facilitar el **traspaso de
titularidad del chip** al concretar la adopción es un diferencial que ninguna plataforma genérica
tiene. Investigar.

## Opinión sincera (2026-09-16)

Buena idea con el diferencial correcto, en un mercado donde el competidor real es Facebook.
El riesgo no es técnico sino de distribución y sostenibilidad. Vale la pena **si se encara como un
producto para rescatistas primero** y se resiste la tentación de construir las otras verticales.

## Antes de escribir código

1. Hablar con 10-15 rescatistas y refugios: cómo filtran hoy, peor experiencia, ¿usarían una
   herramienta?
2. Hablar con adoptantes: qué los frustró.
3. MVP concierge: verificar gente a mano por WhatsApp para 2-3 rescatistas y ver si lo valoran.

## Decisiones

- **Decisión (2026-09-16):** proyecto sin objetivo de lucro inicial, capital mínimo, foco en aprender.
- **Decisión (2026-09-16):** Uruguay primero (implícito por contexto; confirmar).
