# Quickstart: levantar el proyecto de cero

Este archivo es la fuente del paso de preparación que FR-009 pide y que el README va a reproducir
(FR-045). Los valores y las trampas reales se confirman al construir; lo que está acá es el
contrato: **qué hace falta para que `pnpm verify` corra completo en un clon limpio.**

## Requisitos de la máquina

| Herramienta | Versión | Por qué |
|---|---|---|
| Node | 26.x | La misma mayor que el runner de CI (FR-008) |
| pnpm | 12.x | Gestor del proyecto; un solo `package.json` |
| Supabase CLI | ya viene en las dependencias | Base local; el lockfile la fija igual en la máquina y en CI |
| Docker | corriendo | Supabase local vive en contenedores |

## Preparación, una sola vez

```bash
pnpm install                          # dependencias y el gancho de pre-commit
pnpm exec playwright install chromium # el navegador que usan e2e y el driver
pnpm exec supabase start              # la primera vez baja imágenes: tarda
cp .env.example .env.local            # PowerShell: Copy-Item .env.example .env.local
pnpm exec supabase status -o env      # imprime los valores; se copian a .env.local
```

`.env.local` queda con las tres variables que `.env.example` lista. La clave de servicio va **sin**
prefijo `NEXT_PUBLIC_`: cualquier variable con ese prefijo viaja al browser, y hay una compuerta que
falla si aparece así (FR-023).

## Correr

```bash
pnpm dev                     # desarrollo, puerto 3000; la muestra vive en /muestra
pnpm verify                  # las siete etapas, en orden, igual que CI
```

## Qué pasa si falta algo

| Estado | Qué hace `pnpm verify` |
|---|---|
| Todo listo | Verde, nombra las siete etapas y dice que no omitió nada |
| Sin base local y sin `.env.local` | Verde, y el resumen final nombra cada check omitido y por qué |
| Con base local y sin `.env.local` | **Falla** nombrando la variable que falta y cómo obtenerla |
| En CI, sin base local | **Falla** diciendo que falta la base: en CI nada se omite |

Esa precedencia es FR-024 y FR-025, y existe para que un verde nunca esconda un check que no corrió.

## Capturas para la revisión de diseño

Con `pnpm dev` levantado, y no contra el build de producción: la muestra no existe ahí.

```bash
node scripts/walk.mjs --story scaffold-y-compuertas / /muestra
```

Deja `home.png`, `muestra.png` y `muestra.hover.png` a 390 × 844 en
`.artifacts/scaffold-y-compuertas/`, que está ignorada por git. `--desktop` agrega las de
1280 × 800 con sufijo `.desktop`. La portada no tiene elementos interactivos, así que no produce
`home.hover.png` y lo dice.

Códigos de salida: `0` todo bien · `1` una ruta falló · `2` la app no está levantada · `3` la
invocación no es válida para este milestone (sin `--story`, slug inválido, o `--user`, que llega con
la historia de registro e ingreso).

## Trampas observadas

_Se completa al construir, con lo que realmente pase en Windows 11 / PowerShell 7. Va también a la
sección «Verified» de `.claude/skills/run-app/SKILL.md` (FR-046)._
