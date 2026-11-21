# Contracts: Server Actions

## `markPetAdopted(input, back)` — cambia la entrada

```ts
input: {
  petId: string            // uuid
  applicationId: string | null  // null = por fuera del sitio
  attemptId: string        // uuid, uno por apertura de la pantalla
  foundVia: FoundVia | null     // nuevo: null = no eligió; se ignora con una persona
}
→ ActionResult<{ returnTo: string }, HandoverDetail>   // sin cambios
```

- Errores, `detail` y `returnTo`: los de hoy, sin cambios.
- Con `outcome = 'done'`, `handoverEvent` recibe `foundVia` y emite `found_via` según
  data-model.md. Con `already`, `changed` u otro, no se mide nada, como hoy.
- Una entrada sin `foundVia`, con una clave que no es opción o con un campo de más es
  `adoptions.handover.errors.failed`, como cualquier entrada que no pasa el schema.

## Lo que manda la pantalla

`handoverRequest({ petId, attemptId, choice, foundVia })`:

- `choice` es una solicitud → `{ petId, applicationId: choice, attemptId, foundVia: null }`.
- `choice` es `OUTSIDE` → `{ petId, applicationId: null, attemptId, foundVia: foundViaOf(foundVia) }`.
