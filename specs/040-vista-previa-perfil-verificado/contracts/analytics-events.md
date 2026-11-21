# Contrato: los dos momentos con `owner_level`

```ts
profile_link_copied: { from: ProfileLinkOrigin; owner_level?: MeasuredLevel }
public_profile_viewed: { origin: ProfileViewOrigin; with_pets?: boolean; owner_level?: MeasuredLevel }
```

- `owner_level` es el nivel de la dueña del perfil en ese instante: 0, 1, 2 o 3. Falta solo cuando
  no se pudo leer (nunca un valor por defecto).
- Cuándo se mandan no cambia: el enlace copiado o mandado (no al cerrar la hoja sin elegir), la
  visita que hoy se mide (no la dueña, ni una vista previa, ni la vuelta de avalar, ni «Ver más»).
- `trackProfileMoment('profile_link_copied', { from })` sigue con la misma firma: el cliente no manda
  el nivel; lo lee el servidor.
