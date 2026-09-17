# 04 — Nombre

**Estado: sin definir.** Ninguno de los candidatos convenció. Se construye con codename.

## Criterios

1. Una o dos sílabas, se dice por teléfono sin deletrear.
2. Dice "confianza" u "hogar", no "adopción" (para poder crecer a otras verticales).
3. Suena rioplatense, no traducido del inglés.
4. `.uy` disponible.

## Candidatos evaluados (2026-09-16), descartados por gusto

| Nombre | Grupo | Pro | Contra | .uy |
|---|---|---|---|---|
| Fiel | confianza | Doble sentido perro/persona | - | libre? |
| Confiá | confianza | Voseo, casi eslogan | Sin tilde pierde; suena a fintech | libre? |
| Aval | confianza | "Avalado por" (nivel 3) | Garantía de alquiler | libre? |
| Lazo | hogar | Corto, bonito | Genérico | libre? |
| Querencia | hogar | Palabra gaucha, historia linda | 4 sílabas, literaria | libre? |
| Amparo | hogar | Cálido | Nombre de persona, recurso legal | libre? |
| Bicho | local | Cariño uruguayo, memorable | Informal | libre? |
| Hocico | local | Simpático | No dice confianza | libre? |
| Garra | local | "Garra charrúa" | - | **ocupado** |
| Manada | comunidad | Comunidad | - | **ocupado** |

"libre?" = no resuelve DNS; confirmar en nic.uy. Todos los .com están ocupados.

## Cómo construir sin nombre

- Codename del repo: `adopciones-mvp`.
- Una sola constante `APP_NAME` / `APP_URL` (config o env). Todo lo que muestra el nombre lee de ahí.
- Cero nombre en identificadores de código (tablas, componentes, rutas genéricos).
- Deploy en `*.vercel.app` hasta tener dominio.
- Logo: placeholder de texto.

Lo único que se fija con el nombre: dominio e Instagram. No se necesitan para construir.

## Cuándo y cómo elegirlo

- Antes de la beta con rescatistas (van a compartir links).
- El tono (serio/confiable vs. cercano/con onda) se descubre construyendo y mostrando la primera
  pantalla de perfil verificado a un rescatista.
- Opción: llegar a la beta con 3 candidatos y que los primeros rescatistas voten. Se apropian del
  proyecto.

## Checklist cuando haya candidato

1. nic.uy: confirmar .uy libre y registrar. Comprar también .com.uy.
2. Instagram: @nombre.uy o @nombreuy libre.
3. DNPI: buscar marca registrada.
4. Test de teléfono: 3 personas, "entrá a X punto uy", ¿lo escriben bien a la primera?
