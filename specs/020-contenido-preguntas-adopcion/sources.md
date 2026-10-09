# Fuentes — «¿Qué exige Uruguay sobre el chip, el registro (RENAC) y la castración?»

La comprobación de cada dato legal de `questions.que-exige-uruguay.*` (spec, casos borde «Cada
afirmación legal se comprueba»; SC-004). Una fila por dato: lo que dice la página, la fuente
oficial que lo respalda (la misma que enlaza la página), la parte del texto que lo dice y el día
de la consulta.

**Cómo se consultó (2026-10-09).** Desde el contenedor del build las direcciones de IMPO y de
gub.uy no abren (el proxy de salida rechaza la conexión), así que las citas salen del texto de
esas mismas páginas oficiales tal como lo devuelve el buscador, no de una nota de prensa ni de
otro sitio. **Antes de la beta, quien revisa abre cada enlace y compara la cita** (quickstart paso
10); si una no coincide, el dato sale de la página. Lo que no se pudo citar del texto oficial no
se escribió (por ejemplo, quién coloca el chip y cómo se activa: no se afirma).

| # | Dato en la página | Fuente oficial | Cita | Consulta |
|---|---|---|---|---|
| 1 | Castrar (esterilizar) a todos los perros y gatos es obligatorio, por la Ley 19.889. (`answer`, `sections.neuter.p1`) | [Decreto 57/023, art. 3 (IMPO)](https://www.impo.com.uy/bases/decretos/57-2023/3) | «La esterilización de todos los perros y gatos en el territorio nacional, así como su registro en el Registro nacional de Animales de Compañía a través de la identificación, tienen carácter obligatorio» (en aplicación de los arts. 386 y 388 de la Ley 19.889). | 2026-10-09 |
| 2 | La ley declara el programa de esterilización y hace obligatorias las esterilizaciones que dispone. (`sections.neuter`, segunda fuente) | [Ley 19.889, art. 386 (IMPO)](https://www.impo.com.uy/bases/leyes/19889-2020/386) | Texto original de la Ley 19.889 de 09/07/2020, art. 386 (Programa Nacional de Control Reproductivo), «Reglamentado por: Decreto Nº 57/023 de 17/02/2023». | 2026-10-09 |
| 3 | Exceptuados: los criaderos registrados que pidan la exclusión por un motivo fundado, y los animales para los que la cirugía sea un riesgo de vida, con certificado de un veterinario. (`answer` «salvo pocas excepciones, como que la cirugía sea un riesgo para la vida del animal», `sections.neuter.p2`) | [Decreto 57/023, art. 3 (IMPO)](https://www.impo.com.uy/bases/decretos/57-2023/3) | «Estarán exceptuados de la obligación de esterilizar aquellos que, estando registrados en el Registro de Prestadores de Servicios como Criaderos de animales, soliciten la exclusión por motivo fundado», y «aquellos animales que por su estado de salud, la esterilización pueda representar un riesgo a su vida, lo que deberá acreditarse mediante certificado de Médico Veterinario». | 2026-10-09 |
| 4 | Identificar y registrar en el RENAC a todos los perros y gatos es obligatorio. (`answer`, `sections.renac.p1`, `sections.chip.p1`) | [Decreto 57/023, art. 3 (IMPO)](https://www.impo.com.uy/bases/decretos/57-2023/3) | La misma cita de la fila 1: «… así como su registro en el Registro nacional de Animales de Compañía a través de la identificación, tienen carácter obligatorio». | 2026-10-09 |
| 5 | La obligación de registrar sigue aunque el animal esté exceptuado de castrarse. (`sections.renac.p2`) | [Decreto 57/023, art. 3 (IMPO)](https://www.impo.com.uy/bases/decretos/57-2023/3) | «La excepción a la obligación de esterilizar, no comprende a la obligación de identificar y registrar al animal en el Registro Nacional de Animales de Compañía, la que permanece en vigencia para todos los animales de compañía.» | 2026-10-09 |

**Lo que salió de la página (revisión, 2026-10-09).** Tres datos no tenían la cita literal del
texto oficial que pide la spec, y salieron hasta tenerla:

- Qué guarda el RENAC (los datos del animal y de su tenedor responsable), respaldado por el
  Decreto 106/023: la fila tenía una paráfrasis, no una cita.
- Que el registro se hace con un microchip, «único sistema de Registro individual de animales de
  compañía a nivel nacional», y qué es un microchip, respaldados por la Resolución 2/017 de la
  COTRYBA: la cita era parcial, y una segunda búsqueda atribuye esa frase a la Resolución 1/017,
  no a la 2/017, así que el enlace podía ser el equivocado.

Sin una norma comprobada, la página sigue el caso borde «Una fuente oficial que no se puede
encontrar o no respalda un requisito»: dice que el decreto pide identificar al animal para
registrarlo y que todavía no se comprobó en el texto oficial si esa identificación tiene que ser
un microchip, sin decir que lo sea ni que no. Para volver a afirmarlo: abrir la resolución de la
COTRYBA que lo dice, copiar su texto literal en una fila nueva, enlazar esa misma dirección y
sumarla a `SOURCES` en `src/lib/questions/pages.ts`.

Las filas 1, 3, 4 y 5 son el texto del artículo 3 tal como lo devuelven dos consultas al buscador
sobre la misma página de IMPO, la de la build y la de la revisión: las dos coinciden en lo que
citan las filas 1, 4 y 5, y la segunda excepción de la fila 3 sale de la de la revisión. Desde la
revisión tampoco abrió IMPO (el proxy rechaza la conexión), así que abrir cada enlace y comparar la
cita sigue pendiente antes de la beta (quickstart paso 10, KL-8-4).

**Perros y gatos.** Las tres obligaciones valen igual para los dos: el decreto dice «todos los
perros y gatos». La página no los separa.

**docs/06.** La fila «chip / RENAC» del glosario decía «Microchip obligatorio y registro
nacional». Sin una fila que respalde el microchip, la misma entrega la corrige para que diga lo
mismo que la página: identificación y registro obligatorios, el microchip sin comprobar.
