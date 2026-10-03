# Auditoría de MR- Entre Ruinas (octubre 2026)

Sistema revisado entero (código, plantillas, CSS, compendios) y contrastado con los dos PDF:
*Manual de juego Entre ruinas 2026* (M) y *suplemento Entre ruinas refugios 2026* (R).
*Un Mundo Violento* (V) no estaba entre los PDF facilitados: sus listas y los estados de violencia **no se han podido contrastar**.

Probado en Foundry 13.351 con un mundo de pruebas aparte (un solo usuario, GM). No se ha cambiado nada del diseño gráfico.

## 1. Hecho

| Qué | Dónde |
|---|---|
| **Iconos de cabecera rotos.** `.mr-entre-ruinas button { font-family: … }` pisaba la fuente de los botones `header-control fa-solid` (cerrar, menú, ficha) → cuadrados. Ahora solo afecta a botones sin icono. Comprobado: los cuatro botones de la cabecera usan «Font Awesome 6 Pro». | `styles/mr-entre-ruinas.css` |
| **Icono de accesibilidad** en toda ventana del sistema, antes del de cerrar (fichas, Panel de la Voz, asistente, diálogos, editor de retrato y diarios del manual). Tamaño del texto 85–160 %, alto contraste, fuente de alta legibilidad, reducir movimiento (y `prefers-reduced-motion`), ayuda inmediata. Ajustes de cliente, también en la configuración. Los 108 tamaños de letra del CSS pasan a `calc(Npx * var(--er-escala, 1))`: al 100 % el resultado es idéntico. | `module/accesibilidad.mjs`, final del CSS |
| **Encuadre del retrato** (zona + zoom, recorte cuadrado con `object-view-box`, flag `flags.mr-entre-ruinas.retrato`). Botón en la ficha de personaje, refugio, comunidad y PNJ. Se ve igual en ficha, Panel de la Voz, vínculos, asistente, tarjetas de chat y directorio. Comprobado guardando un encuadre y leyéndolo en directorio, chat y ficha. | `module/retrato.mjs` |
| Crisis provocada por el GM (hambre al empezar el episodio) abría el diálogo en la pantalla del GM. Ahora se abre sola a quien lleva el personaje (hook `createChatMessage` con el flag `crisis`). | `module/actor.mjs`, `module/chat.mjs` |
| Relojes del refugio sin teclado (porciones SVG sin `role`/`tabindex`). | `module/hojas/refugio.mjs` |
| El asistente dejaba el `uuid` de un vínculo apuntando al Actor anterior al renombrarlo (la foto del vínculo no cambiaba). | `module/apps/asistente.mjs` |
| PNJ y comunidades declaraban `bar1 = estres` sin tener Estrés. | `module/actor.mjs` |

## 2. Reglas del manual contra la implementación

Todo lo verificable coincide. Las 34 listas de M y R se han comparado con el texto de los PDF: las únicas diferencias son reformulaciones de verbo («que llegue un grupo nuevo» → «Llega un grupo nuevo») y la errata deliberada *Terry → Ferry*.

| Regla | Estado |
|---|---|
| M 5 · creación en seis pasos, reparto +2/+1/+1/0 validado | ✔ asistente |
| M 6.3 · +1 al ayudar al Vínculo Positivo; +1 Caos al empeorar el Negativo | ✔ botones en la ficha |
| M 7 · 2d6 + atributo, bandas 10+ / 7–9 / ≤6, consecuencias y Movimientos Duros clicables | ✔ |
| M 8 · 5 espacios, Estrés al fallar (opcional), Crisis, Marca permanente | ✔ |
| M 9 · 2 Fichas al empezar, máximo 5, gastar 1/2/3, flashback = 1 | ✔ |
| M 13–15 · fases, corte de escena, cliffhanger, 6 episodios por temporada, Voz rotativa | ✔ |
| M 14 / R 4 · una recuperación por escena, 7 opciones, Marcas en suspenso vuelven al cerrar el episodio | ✔ |
| M 16 · abandonar el juego | ✔ (selector de destino) |
| R 1–2 · tipo, sustento (perderlo = Crisis), secreto, miedo, liderazgo; 5 valores 0–5, inicio en 2 | ✔ |
| R 2 · umbrales: Seguridad 0, Suministros 0, Moral 0, Ruido 5, Confianza 0 | ✔ aviso en el chat al llegar |
| R 2 · Suministros 0 = 1 Estrés a todos al empezar cada episodio | ✔ (comprobado: pasa de Preparación a Cold Open) |
| R 3 · Estrés del refugio (6), Crisis → Movimiento de comunidad, Estrés a 0 y Marca | ✔ |
| R 4 · roles como cargas, visibles en la ficha del personaje | ✔ |
| R 5 · expediciones (objetivo, pregunta, complicación) | ✔ oráculos; «Fracasa» suma Estrés al refugio |
| R 6–7 · otras comunidades, relojes (al completarse, la amenaza ocurre), eventos entre temporadas | ✔ |

## 3. Automatismos

**Ya automatizados:** tirada y banda; Estrés al fallar y Crisis; consecuencia «Se gana Estrés» aplicada al personaje; Caos ganar/gastar con tarjeta; +1 de vínculo; suspensión y retorno de Marcas; hambre; umbrales del refugio; Crisis del refugio; relojes completos; relevo de la Voz sugerido; contador de temporada; recuperación de una sola vez por escena.

**Candidatos que faltan** (ordenados por valor; ninguno implementado, decides tú):

1. **«Activar una Crisis»** (Movimiento Duro, M 12) solo publica texto. Debería llenar el Estrés de quien falló y abrir la Crisis.
2. **Umbrales con consecuencia a un clic.** La tarjeta de umbral solo informa. Seguridad 0 → botón de amenaza/invasión (oráculo), Moral 0 → eventos de colapso, Ruido 5 → «alguien encuentra el refugio», Suministros 0 → «el refugio gana 1 Estrés» (R 3: «falta comida»).
3. **«Revelar una verdad»** (recuperación) no ofrece sacar a la luz la pregunta incómoda del personaje; hoy es un paso aparte.
4. **Hambre = 5 tarjetas de chat** (una por personaje). Una sola tarjeta agrupada gastaría menos chat.
5. **Evolución de vínculos al cerrar el episodio** (M 6.4): el diálogo solo lo recuerda; podría abrir las fichas o el asistente.
6. **Relojes ligados a la ficción** (R 7: «cada vez que una situación empeora, el reloj avanza»): hoy se avanzan a mano.
7. **«Demasiadas Marcas»** (M 16): sin umbral ni aviso. El manual no fija el número; si quieres un aviso, hay que elegirlo.

## 4. Diseño y usabilidad: propuestas (sin aplicar)

Nada de esto se ha tocado. Mediciones con 1280×860 en Foundry 13.

1. **Panel de la Voz: la cabecera fija ocupa 258 px de 782** (un 33 % de la ventana) con la ventana en 480 px de ancho. Quedan ~490 px para el contenido, que mide ~800 y obliga a desplazar. Opciones: pasar el texto de la fase a tooltip (ya existe), o unir «Corte / Escena de refugio / Siguiente fase» con las pestañas en una sola fila.
2. **Tamaños por defecto**: personaje 920×760, refugio 940×780, asistente 760×820. Foundry exige 1024×768, y una ventana de 760 de alto no cabe bajo la barra del navegador en un portátil de 768. La memoria de ventanas lo corrige tras la primera vez, pero el tamaño inicial podría bajar a ~900×700.
3. **Refugio**: a 780 de alto la columna derecha (relojes, roles, expediciones, crónica) necesita desplazamiento; los siete roles ocupan casi la mitad de la columna. Podrían ir en dos columnas o plegados por defecto (hoy abiertos).
4. **Retrato de la ficha**: 230 px fijos (30 % de la altura). Con el nombre largo y el texto al 160 % el nombre ocupa tres líneas sobre la imagen. Sugerencia: altura mínima, no fija.
5. **Contraste de elementos no textuales**: el borde de las casillas de Estrés y de las fichas de Caos (`#5b5247` sobre `#151412`) da 2,4:1; WCAG pide 3:1. Subir a ~`#7a6f60` lo resuelve sin cambiar la estética. El texto de ayuda `--er-hueso-3` con placeholder al 75 % queda en ~3,6:1.
6. **Texto muy pequeño**: los rótulos de fase del Panel (10,5 px) y sus números (10 px), y los `small` (11 px). El control de tamaño de texto lo compensa, pero el valor base podría subir a 11–12.
7. **Pestañas del Panel de la Voz** son `<a data-action="tab">` sin `href`: no se llegan con tabulador (igual que en el núcleo de Foundry). Cambiar a `<button role="tab">`.
8. **Editor de retrato nuevo**: hereda botones y tokens del sistema (ámbar sobre carbón). Revísalo tú: es la única pieza visual nueva.

## 5. Sin comprobar

- **Foundry 14**: el código enruta v13/v14 en `compat.mjs`, pero solo hay 13.351 instalado.
- **Dos o más usuarios**: la apertura automática de la Crisis a su jugador depende del hook de chat y de `hasPlayerOwner`; en el mundo de pruebas solo había GM. Probar con un jugador conectado: hambre al pasar a Cold Open con un personaje a 4 de Estrés.
- **Un Mundo Violento**: sin PDF no se han contrastado sus listas ni los estados de violencia.
- Sin publicar: no se ha subido versión ni etiqueta.

## 6. Segunda ronda (1.1.0)

Implementados los siete automatismos de la sección 3 (el 7 con un ajuste de mundo para el número de Marcas) y tres propuestas de la sección 4:

- **Refugio sin desplazamiento** (4.3): tres columnas a 900 px o más; medido a 940×780, el contenido ocupa 437 de 437 px.
- **Contraste de casillas y fichas** (4.5): borde `#7a6f60`, 3,5:1 sobre el fondo de la ficha (antes 2,4:1).
- **Pestañas del Panel de la Voz con teclado** (4.7).

Siguen abiertas las propuestas 4.1, 4.2, 4.4 y 4.6, y la verificación con dos usuarios y en Foundry 14.
