# Contrato: la vista previa del perfil y su imagen

Lo que lee un lector de vista previa (WhatsApp, Facebook) y lo que ofrece el sitio. Lo prueban
`profileShareMetadata` (Vitest) y `tests/e2e/aval.spec.ts`.

## `GET /perfil/<id>` (lector de vista previa)

Siempre, como hoy: `<title>{nombre} · {sitio}</title>` o `Este perfil no existe · {sitio}`,
`robots: noindex, nofollow`, `og:type=profile`, `og:site_name`, `og:title`. Sin fotos en la página.

Con nivel 1 a 3, además:

```html
<meta name="description" content="Identidad verificada"/>
<meta property="og:description" content="Identidad verificada"/>
<meta property="og:image" content="{APP_URL}/perfil/nivel/2/imagen?v={8 hex}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:alt" content="Identidad verificada"/>
<meta name="twitter:card" content="summary_large_image"/>
```

Nunca: zona, localidad, fecha de alta, animales, quién avala ni cuántos, foto, `/foto`.

Con nivel 0, «no existe» o suspendida: ninguna de las líneas de arriba.

## `GET /perfil/nivel/<n>/imagen?v=…`

- `n` ∈ {1, 2, 3} → 200, `image/jpeg`, 1200 × 630, `cache-control: public, max-age=31536000,
  immutable`. No lee la base ni la sesión.
- Cualquier otro `n` → 404 sin cuerpo.

## `robots.txt`

La regla de `LINK_PREVIEW_AGENTS` suma `/perfil` a su `allow`; la de `*` no cambia.
