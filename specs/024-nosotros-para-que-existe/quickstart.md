# Quickstart: «Nosotros»

Cómo comprobar la historia #201 en local.

1. `pnpm exec supabase start` y `pnpm dev`.
2. Sin sesión, abrir `http://localhost:3000/animales`, bajar al pie: en **Confianza**, «Nosotros»
   es el último enlace. Tocarlo.
3. En `/nosotros`: el título «Nosotros», la bajada y las cuatro partes en orden (Para qué existe,
   En qué se diferencia, Lo que no promete, La marca); en la segunda, cinco renglones con el
   tilde, el cuarto con los días de `FOLLOW_UP_DAYS`.
4. La marca: la suma (la pata + la huella digital = la marca) dentro de su parte, en todos los anchos
   y sin repetirse al costado (decisión 2026-10-25); con el
   lector de pantalla (o el árbol de accesibilidad de DevTools) se anuncia «Una pata con una
   huella digital en la almohadilla». «Qué dice cada nivel» lleva a `/niveles`.
5. El cierre: «Actualizada el …» y la tirita «Ver los animales en adopción», que lleva a
   `/animales`.
6. `curl -s http://localhost:3000/nosotros | grep og:title` trae el título;
   `curl -s http://localhost:3000/robots.txt` deja `/nosotros` a los lectores de vista previa.
7. Con una persona sembrada suspendida (`node scripts/walk.mjs --user`, ver `docs/09`), abrir
   `/nosotros`: aparece la pantalla de la cuenta suspendida, y su pie no tiene Confianza.
8. Capturas: `node scripts/walk.mjs --story nosotros-para-que-existe /nosotros /animales`.
9. `pnpm gates:affected`; al cerrar, `pnpm verify`.
