# Cambios

## 1.1.0

**Automatismos nuevos**

- **«Activar una Crisis»** (Movimiento Duro, M 12) llena de verdad el Estrés de quien ha fallado y abre su Crisis. Funciona también si lo pulsa la Voz.
- **Umbrales del refugio con consecuencia a un clic**: Seguridad 0 → amenaza al azar; Moral 0 → quiebra al azar; Ruido 5 → quién llega; Suministros 0 → «el refugio gana 1 Estrés» (R 3, falta comida).
- **Relojes desde el chat** (R 7): cuando el refugio empeora (Estrés, umbrales) la tarjeta ofrece avanzar uno de los relojes en marcha.
- **Revelar una verdad**: al elegir esa recuperación se ofrece sacar a la luz la pregunta incómoda del personaje.
- **Hambre en una sola tarjeta**: todos los personajes ganan su Estrés y el chat recibe un resumen; quien llega a la Crisis conserva su tarjeta con botón.
- **Fin de episodio**: la tarjeta trae «Revisar mis vínculos», que abre la ficha con la sección Vínculos desplegada (M 6.4).
- **Demasiadas Marcas** (M 16): al resolver una Crisis, si el personaje llega al límite (ajuste *Aviso de «demasiadas Marcas»*, 5 por defecto, 0 lo apaga) la tarjeta ofrece las salidas de Abandonar el juego.

**Diseño y usabilidad**

- **Refugio sin desplazamiento** a su tamaño por defecto: las secciones se reparten en tres columnas (dos en anchos medios, una en estrechos) y la Crónica queda al final de la tercera.
- **Contraste**: el borde de las casillas de Estrés, las fichas de Caos y los puntos de los valores del refugio sube a 3,5:1 (WCAG 1.4.11).
- **Pestañas del Panel de la Voz** accesibles con teclado: son botones con `role="tab"`, `aria-selected` y navegación con las flechas.

**Accesibilidad, retratos y arreglos** (de la primera ronda)

- **Iconos de la cabecera de ventana arreglados** (cerrar, menú, ficha): el CSS propio les pisaba la fuente Font Awesome y se veían como cuadrados. Los botones con icono ya no se tocan.
- **Accesibilidad**: icono nuevo en la cabecera de todas las ventanas del sistema (fichas, Panel de la Voz, asistente, diálogos y diarios del manual), justo antes del de cerrar. Abre un panel con tamaño del texto (85–160 %), alto contraste, fuente de alta legibilidad, reducir movimiento y ayuda inmediata. Son ajustes de cliente y también están en *Configuración → Ajustes del sistema*. Respeta `prefers-reduced-motion`.
- **Encuadre del retrato**: botón en la ficha (personaje, refugio, comunidad y PNJ) para elegir la zona y el zoom de la imagen. Se guarda en `flags.mr-entre-ruinas.retrato` y se ve igual en la ficha, el Panel de la Voz, los vínculos, el chat y el directorio de Actores.
- Una Crisis provocada por otra persona o por el GM (p. ej. el hambre) ya no abre el diálogo en la pantalla del GM: se abre sola a quien lleva el personaje.
- Los relojes del refugio se pueden manejar con el teclado.
- El asistente de creación ya no deja enlazado a un Actor un vínculo cuyo nombre se ha cambiado.
- Los PNJ y las comunidades ya no declaran una barra de token de Estrés que no tienen.

## 1.0.0

Primera versión publicada.

- **Ficha de personaje** con columna fija (atributos que tiran con un clic, Estrés y Fichas de Caos) y columna de interpretación (Marcas, Vínculos, relaciones iniciales, objeto importante, pregunta incómoda y diario). Modo compacto, candado de edición y diseño adaptable a cualquier ancho.
- **Tiradas** 2d6 + atributo con tarjeta de resultado: en un 7–9 la Voz elige la consecuencia con un clic; en un fallo aparecen los Movimientos Duros y se marca 1 Estrés (configurable).
- **Crisis** guiada: cómo explota el personaje y su nueva Marca permanente. **Fichas de Caos** para ganar con motivo y gastar en detalle, flashback, giro o alterar la escena.
- **Refugio** (suplemento Refugios): cinco valores con avisos de umbral, Estrés colectivo, Crisis con Movimiento de comunidad y Marca, relojes de amenaza, roles y expediciones. Suministros a 0 = hambre al empezar cada episodio.
- **Comunidades** y **PNJ** (con los estados de violencia de Un Mundo Violento).
- **Panel de la Voz**: temporada y episodio, la Voz rotatoria, las cinco fases del episodio, corte de escena, escena de refugio, cierre de episodio con cliffhanger y relevo, preparación con ejemplos del libro, escenarios listos y todos los oráculos.
- **Asistente de creación** con los seis pasos del manual.
- **Compendios**: el manual y los dos suplementos completos, cuatro supervivientes pregenerados y 37 tablas.
- **Memoria de ventanas**: posición, tamaño (normal y compacto), pestaña, secciones plegadas y desplazamiento por usuario y mundo. El texto que se está escribiendo sobrevive a los repintados provocados por otros jugadores.
- **Compatibilidad** Foundry 13 y 14 enrutada en `module/compat.mjs` (modo de mensajes `rollMode`/`messageMode`, `applyRollMode`/`applyMode` y APIs V2 en sus espacios de nombres).
- Errata corregida del suplemento Refugios: «Terry abandonado» → «Ferry abandonado».
