export const FONT_LATER_CLASS = 'font-later'

// Mientras `<html>` tiene la clase, ningún texto nombra a Bricolage y el navegador no la pide: la
// primera pantalla se pinta con el respaldo y la fuente baja recién después, sin competir con el
// HTML, el CSS y el código por la red del teléfono (historia #320). Sin JavaScript la clase nunca
// se pone y la fuente baja como siempre. `load` cubre al navegador que no avisa el primer pintado.
// Corto a propósito: viaja dos veces en el HTML de cada pantalla.
export const fontAfterFirstPaintScript = `(function(d,c,g){d.add(c);g=function(){d.remove(c)};addEventListener("load",g);new PerformanceObserver(g).observe({type:"paint"})})(document.documentElement.classList,"${FONT_LATER_CLASS}")`
