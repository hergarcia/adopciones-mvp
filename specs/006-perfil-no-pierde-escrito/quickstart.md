# Quickstart — validar la historia #35

Prerrequisitos: `pnpm exec supabase start`, `pnpm exec supabase db reset`, `pnpm dev` sin
`RESEND_API_KEY` (el enlace de ingreso se escribe en `.artifacts/mail/`).

1. **Alta sin conexión** (US1): entrar con una dirección nueva, completar nombre, foto,
   departamento, localidad y la marca. DevTools → Network → Offline. Tocar «Guardar»: aparece el
   aviso «No se guardó: no hay conexión…», todo sigue en pantalla, no aparece «Algo se rompió».
   Volver a Online, tocar «Reintentar»: «Perfil guardado» y el próximo paso. En la consola del
   servidor: `[medición] profile_save_failed …`, `account_creation_finished`, `profile_save_recovered`.
2. **Editar sin conexión** (US1): «Mi perfil» → «Editar mi perfil», cambiar la localidad, Offline,
   «Guardar cambios»: el mismo aviso, sin «No pudimos traer tu perfil».
3. **Respuesta perdida** (US2): `pnpm e2e -g "respuesta perdida"`; a mano, con Playwright o un
   proxy que corte la respuesta. Reintentar confirma «Perfil guardado» y la consola muestra un solo
   `account_creation_finished` y ningún `profile_edited`.
4. **Recarga** (US3): en el alta, elegir departamento y localidad, recargar: siguen elegidos. Cerrar
   sesión, entrar con otra dirección: el alta arranca vacía.
5. **Compuerta**: `pnpm lint && pnpm typecheck && pnpm test`, y `pnpm verify` antes del PR.
