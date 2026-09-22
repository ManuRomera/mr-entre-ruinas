/**
 * Todo el contenido tabulado de los tres libros, en un solo sitio.
 * Módulo puro (sin globals de Foundry): lo importan el sistema, los tests y
 * `scripts/build.mjs`, que compila estas mismas listas en el compendio de Tablas.
 * Referencias: M = Manual de juego, V = Un Mundo Violento, R = Refugios.
 */

export const ATRIBUTOS = {
  violencia: { nombre: "Violencia", icono: "fa-solid fa-hand-fist", cubre: "Pelea, intimidación, brutalidad, destruir cosas." },
  coco: { nombre: "Coco", icono: "fa-solid fa-brain", cubre: "Improvisar, investigar, analizar, pensar bajo presión." },
  labia: { nombre: "Labia", icono: "fa-solid fa-comment-dots", cubre: "Mentir, convencer, conectar, manipular." },
  aguante: { nombre: "Aguante", icono: "fa-solid fa-heart", cubre: "Resistir el dolor, el miedo, el hambre y el agotamiento." }
};

/** M 5.2: se reparten +2, +1, +1 y 0 sin repetir ninguno. */
export const REPARTO = [2, 1, 1, 0];

/** M 7.2 */
export const RESULTADOS = {
  limpio: { titulo: "Éxito limpio", rango: "10+", texto: "Consigue lo que buscaba y, además, la situación mejora." },
  coste: { titulo: "Éxito con coste", rango: "7–9", texto: "Lo consigue, pero… La Voz elige una consecuencia." },
  fallo: { titulo: "Fallo", rango: "6 o menos", texto: "La Voz ejecuta un Movimiento Duro y la ficción empeora." }
};

export const LISTAS = {
  // ─── Manual de juego ───────────────────────────────────────────────
  conceptos: {
    titulo: "Conceptos", origen: "M 5.1",
    items: ["Exprofesor incapaz de callarse.", "Repartidora paranoica.", "Vigilante agotado.", "Enfermero sin esperanza.",
      "Friki obsesionado con las radios.", "Dependienta que intenta mantener la normalidad."]
  },
  marcasIniciales: {
    titulo: "Marcas iniciales", origen: "M 5.3",
    items: ["Necesita aprobación.", "Tiene ataques de ira.", "Miente constantemente.", "No soporta el silencio.",
      "Humor inapropiado.", "Se bloquea bajo presión.", "Nunca abandona a nadie.", "Siempre espera lo peor."]
  },
  objetos: {
    titulo: "Objetos importantes", origen: "M 5.5",
    items: ["Una radio.", "Una Game Boy.", "Un mechero.", "Una fotografía.", "Una sudadera.",
      "Un manojo de llaves que ya no abre nada.", "Un walkman."]
  },
  preguntasPersonaje: {
    titulo: "Preguntas incómodas del personaje", origen: "M 5.6",
    items: ["¿A quién abandonaste?", "¿Qué hiciste el primer día del colapso?", "¿Qué mentira sigues sosteniendo?",
      "¿Qué parte de ti murió ya?", "¿A quién sigues buscando?", "¿Qué hiciste para sobrevivir?"]
  },
  consecuencias: {
    titulo: "Consecuencias (7–9)", origen: "M 7.3",
    items: ["El personaje hace ruido.", "Alguien sale herido.", "Se pierde algo importante.", "Se gana Estrés.",
      "Se atrae atención no deseada.", "Otra situación empeora en paralelo.", "El personaje queda expuesto.",
      "Alguien empieza a desconfiar de él."]
  },
  causasEstres: {
    titulo: "Cuándo se gana Estrés", origen: "M 8.1",
    items: ["Falla una tirada.", "Presencia violencia extrema.", "Pasa hambre.", "No descansa.",
      "Discute violentamente con alguien.", "Hace algo horrible.", "Pierde a alguien importante.",
      "Atraviesa una situación traumática."]
  },
  crisis: {
    titulo: "Cómo explota un personaje en Crisis", origen: "M 8.2",
    items: ["Un ataque de pánico.", "Un estallido de violencia irracional.", "Un bloqueo total.", "Una huida.",
      "Un episodio de paranoia.", "Una confesión emocional que no pensaba hacer.", "Un colapso completo."]
  },
  marcasPermanentes: {
    titulo: "Marcas permanentes", origen: "M 8.3",
    items: ["Ya no duerme bien.", "Desconfía de todos.", "Habla solo.", "Se vuelve agresivo bajo presión.",
      "Necesita controlar todo lo que le rodea.", "Ya no soporta estar a solas."]
  },
  ganarCaos: {
    titulo: "Cómo ganar Fichas de Caos", origen: "M 5.3 · 6.3 · 9.1",
    items: ["Complica voluntariamente la situación de su propio personaje.", "Interpreta activamente una de sus Marcas.",
      "Acepta una consecuencia especialmente dura sin discutirla.", "Empeora una escena por iniciativa propia.",
      "Su Marca inicial le mete en un lío en vez de sacarle de él.",
      "Empeora deliberadamente la vida de su Vínculo Negativo.", "Genera drama interesante para la mesa."]
  },
  vozPuede: {
    titulo: "La Voz puede", origen: "M 10.2",
    items: ["Abrir escenas.", "Interpretar a los personajes secundarios que aparezcan.", "Mantener el ritmo de la partida.",
      "Introducir problemas.", "Lanzar las consecuencias de las tiradas.",
      "Cortar una escena cuando ya ha dado de sí todo lo que tenía que dar.", "Hacer preguntas incómodas al resto de la mesa."]
  },
  vozNoPuede: {
    titulo: "La Voz no puede", origen: "M 10.3",
    items: ["Escribir de antemano una trama cerrada que el resto de la mesa deba seguir.",
      "Controlar las decisiones de los demás personajes.", "Bloquear las ideas que proponga cualquier otro jugador.",
      "Imponer un resultado que no haya salido de una tirada o de un acuerdo de mesa."]
  },
  lugares: {
    titulo: "Lugares", origen: "M 11.1 · R 1",
    items: ["Un supermercado.", "Un parking.", "Un hospital.", "Un edificio abandonado.", "Una gasolinera.",
      "Un ferry abandonado.", "Una urbanización cerrada.", "Una estación de radio."]
  },
  problemas: {
    titulo: "Problemas", origen: "M 11.2",
    items: ["Alguien ha desaparecido.", "Faltan medicinas.", "Una transmisión de radio pide ayuda."]
  },
  amenazas: {
    titulo: "Amenazas", origen: "M 11.3",
    items: ["Saqueadores.", "El hambre.", "La violencia.", "Otra comunidad.", "La paranoia del propio grupo."]
  },
  preguntasSesion: {
    titulo: "Preguntas incómodas de la sesión", origen: "M 11.4",
    items: ["¿A quién dejaríais atrás?", "¿Merece la pena ayudar?", "¿Qué estáis ocultando?"]
  },
  frasesVoz: {
    titulo: "Frases que ayudan a la Voz a improvisar", origen: "M 11",
    items: ["¿Quién empeora esto?", "¿Qué detalle horrible notas?", "¿Por qué esto te afecta tanto?", "¿Qué recuerdas ahora?",
      "Vale… pero alguien paga el precio.", "¿Quién se queda atrás?"]
  },
  movimientosDuros: {
    titulo: "Movimientos Duros", origen: "M 12",
    items: ["Separar al grupo.", "Agotar sus recursos.", "Revelar una verdad incómoda.", "Introducir violencia.",
      "Romper algo importante.", "Forzar una decisión moral.", "Introducir a otra facción en la escena.", "Activar una Crisis.",
      "Hacer desaparecer a alguien.", "Convertir un éxito aparente en un problema nuevo.", "Sacar a la luz un secreto.",
      "Cambiar el objetivo de la escena.", "Introducir un silencio o un ruido inquietante.", "Hacer llegar a alguien de forma inesperada."]
  },
  puntoRuptura: {
    titulo: "Punto de ruptura", origen: "M 13.4",
    items: ["Colapsa.", "Miente abiertamente.", "Desaparece.", "Traiciona a los demás.", "Pierde el control por completo."]
  },
  cliffhangers: {
    titulo: "Cliffhangers", origen: "M 13.5",
    items: ["Una transmisión extraña.", "Unos golpes en la puerta.", "La desaparición de alguien.", "Una comunidad inesperada.",
      "Una voz conocida sonando de nuevo en la radio."]
  },
  abandonar: {
    titulo: "Abandonar el juego", origen: "M 16",
    items: ["Retirarlo de la partida.", "Sacrificarlo en una escena con sentido.", "Hacerlo desaparecer sin más explicación.",
      "Convertirlo en un personaje no jugador con el que la mesa siga topándose.", "Transformarlo por completo en otra cosa."]
  },
  // ─── Un Mundo Violento ─────────────────────────────────────────────
  teorias: {
    titulo: "Lo que nadie entiende", origen: "V 10",
    items: ["Todo empezó como un experimento.", "Fue una guerra.", "La violencia estaba dormida.", "Las radios transportan algo.",
      "El mundo anterior merecía desaparecer."]
  },
  tiposComunidad: {
    titulo: "Tipos de comunidades", origen: "V 19 · R 6",
    items: ["Refugios cerrados — Nadie entra. Nadie sale.", "Comunidades violentas — Sobreviven saqueando.",
      "Cultos — Interpretan la violencia como algo espiritual.", "Ciudadelas — Pequeños territorios organizados mediante fuerza y control.",
      "Campamentos móviles — Nunca permanecen demasiado tiempo en el mismo lugar.",
      "Estaciones de radio — Comunidades construidas alrededor de transmisiones."]
  },
  estadosViolencia: {
    titulo: "Estados de violencia", origen: "V 22",
    items: ["Rabia — Ataques impulsivos y brutales.", "Paranoia — Miedo constante y agresividad preventiva.",
      "Obsesión — Conductas repetitivas y peligrosas.", "Histeria colectiva — Multitudes que reaccionan violentamente.",
      "Colapso emocional — Personas incapaces de controlar el miedo o la desesperación."]
  },
  transmisiones: {
    titulo: "Tipos de transmisiones", origen: "V 25",
    items: ["Peticiones de ayuda.", "Emisiones militares.", "Señales pirata.", "Mensajes grabados.", "Confesiones.",
      "Música repetida.", "Frecuencias extrañas.", "Ruido blanco."]
  },
  preguntasCampana: {
    titulo: "Preguntas incómodas", origen: "V 33",
    items: ["¿Quién está mintiendo?", "¿Qué parte del refugio ya no es segura?", "¿Qué escucháis en la radio?",
      "¿Quién no debería estar aquí?", "¿Quién está a punto de perder el control?", "¿Qué secreto acaba de salir a la luz?",
      "¿A quién abandonaríais?", "¿Qué estáis fingiendo no ver?"]
  },
  escenasIniciales: {
    titulo: "Escenas iniciales", origen: "V 34",
    items: ["Una puerta golpeada durante la noche.", "Una transmisión pidiendo ayuda.", "Un incendio lejano.",
      "Un generador que deja de funcionar.", "Una discusión que escala demasiado rápido.", "Un coche llegando al refugio.",
      "Un cadáver en la carretera.", "Alguien llamando por vuestro nombre."]
  },
  rumores: {
    titulo: "Rumores sobre el mundo", origen: "V 39",
    items: ["Dicen que algunas ciudades siguen funcionando.", "Dicen que el ejército todavía controla zonas seguras.",
      "Dicen que las radios transmiten algo más que sonido.", "Dicen que los violentos recuerdan cosas.", "Dicen que existe una cura.",
      "Dicen que el mar está lleno de barcos abandonados.", "Dicen que algunas personas nunca se vieron afectadas.",
      "Dicen que todavía queda música en la radio."]
  },
  // ─── Refugios ──────────────────────────────────────────────────────
  sustentos: {
    titulo: "Qué mantiene vivo el refugio", origen: "R 1 · Paso 2",
    items: ["Un generador.", "Un pozo.", "Un médico.", "Una emisora.", "Un huerto.", "Una persona concreta.", "Combustible.",
      "Una ruta de suministros.", "Un vehículo.", "Paneles solares.", "Una antena."]
  },
  secretos: {
    titulo: "Qué oculta la comunidad", origen: "R 1 · Paso 3",
    items: ["Esconden a alguien violento.", "Expulsaron a alguien injustamente.", "Apenas queda comida.",
      "Alguien manipula las transmisiones.", "Parte del refugio ya no es segura.", "Un grupo quiere tomar el control.",
      "Alguien desapareció y nadie habla de ello.", "La comunidad depende del saqueo.", "Están ocultando una infección."]
  },
  miedos: {
    titulo: "Qué teme este lugar", origen: "R 1 · Paso 4",
    items: ["El hambre.", "Las invasiones.", "Quedarse aislados.", "Los incendios.", "Quedarse sin combustible.",
      "La violencia interna.", "Otra comunidad.", "El invierno.", "Las transmisiones de radio.", "Perder el control."]
  },
  estresRefugio: {
    titulo: "Cuándo gana Estrés el refugio", origen: "R 3",
    items: ["Muere alguien importante.", "Falta comida.", "Llega demasiada gente.", "Una expedición fracasa.",
      "Alguien roba recursos.", "Ocurre violencia interna.", "Desaparece una persona.", "El refugio queda expuesto.",
      "Una transmisión amenaza a la comunidad.", "Los personajes toman decisiones terribles."]
  },
  movimientosComunidad: {
    titulo: "Movimientos de comunidad", origen: "R 3",
    items: ["Hacer que alguien robe suministros.", "Enfrentar a dos grupos entre sí.", "Expulsar a un miembro.",
      "Hacer aparecer a un líder radical.", "Dejar que una parte del refugio deje de ser segura.", "Hacer desaparecer a alguien.",
      "Provocar un incendio.", "Dejar que alguien abra las puertas.", "Permitir que una facción tome el control.",
      "Hacer que una transmisión revele un secreto.", "Convertir el miedo en violencia."]
  },
  marcasRefugio: {
    titulo: "Marcas del refugio", origen: "R 3",
    items: ["Nadie duerme tranquilo.", "Las armas siempre están visibles.", "Ya no aceptan desconocidos.", "La radio nunca se apaga.",
      "Todo el mundo sospecha de todos.", "Nadie habla del ala norte.", "Las puertas se cierran antes del anochecer.",
      "Siempre hay alguien vigilando.", "Las discusiones terminan en violencia.", "Los niños ya no juegan."]
  },
  vidaRefugio: {
    titulo: "Escenas tranquilas del refugio", origen: "R 4",
    items: ["Cocinar.", "Dormir.", "Discutir.", "Reparar cosas.", "Compartir recuerdos.", "Escuchar la radio.", "Cortarse el pelo.",
      "Fumar juntos.", "Llorar.", "Reír.", "Limpiar sangre.", "Enterrar a alguien.", "Jugar a cartas.", "Mirar el exterior.",
      "Hablar sobre el pasado."]
  },
  objetivosExpedicion: {
    titulo: "Objetivos de una expedición", origen: "R 5",
    items: ["Conseguir suministros — Comida, medicinas, combustible.", "Buscar personas — Desaparecidos, familiares o supervivientes.",
      "Investigar transmisiones — Radios, señales o llamadas de auxilio.", "Explorar — Nuevos refugios o rutas.",
      "Robar — A otras comunidades.", "Huir — Porque el refugio ya no se puede mantener."]
  },
  preguntasExpedicion: {
    titulo: "Preguntas antes de salir", origen: "R 5",
    items: ["¿Quién se queda atrás?", "¿Qué necesita realmente el refugio?", "¿Qué no estáis diciendo?", "¿Quién no debería venir?",
      "¿Qué pasa si no regresáis?"]
  },
  complicacionesExpedicion: {
    titulo: "Complicaciones en expediciones", origen: "R 5",
    items: ["El vehículo falla.", "Se escuchan disparos.", "Alguien os sigue.", "Una transmisión dice vuestro nombre.",
      "Encontráis supervivientes.", "Alguien desaparece.", "Aparece otra comunidad.", "Alguien pierde el control.",
      "Encontráis algo imposible de ignorar.", "Descubrís que alguien os mintió."]
  },
  relojes: {
    titulo: "Relojes narrativos", origen: "R 7",
    items: ["El generador va a morir.", "La comunidad vecina prepara algo.", "La radio os ha localizado.", "Alguien está enfermando.",
      "El invierno se acerca.", "El refugio se está fragmentando."]
  },
  cambiosTemporada: {
    titulo: "Al terminar la temporada", origen: "M 15 · R 7",
    items: ["El refugio cambia.", "Alguien se marcha.", "Alguien muere.", "Aparecen nuevas normas.", "El espacio se deteriora.",
      "La comunidad evoluciona.", "El mundo, en conjunto, empeora."]
  },
  eventosTemporada: {
    titulo: "Eventos entre temporadas", origen: "R 7",
    items: ["Llega un grupo nuevo.", "El invierno destruye parte del refugio.", "Desaparecen recursos.", "Alguien toma el control.",
      "Nace un niño.", "La radio deja de emitir.", "Aparece una enfermedad.", "Encontráis otra comunidad.",
      "Una parte del refugio colapsa.", "Alguien regresa cambiado."]
  },
  preguntasRefugio: {
    titulo: "Preguntas para la Voz", origen: "R 8",
    items: ["¿Qué parte del refugio ya no parece un hogar?", "¿Quién está fingiendo que todo va bien?", "¿Quién está a punto de explotar?",
      "¿Qué norma acaba de aparecer?", "¿Quién duerme peor últimamente?", "¿Qué habitación evita todo el mundo?",
      "¿Quién está empezando a perder la esperanza?", "¿Qué sonido ya nadie soporta escuchar?", "¿Quién quiere abandonar el refugio?",
      "¿Qué sacrificio parece inevitable?"]
  }
};

/** M 9.2 y 9.3 */
export const GASTOS_CAOS = {
  detalle: { coste: 1, titulo: "Detalle pequeño", texto: "Introducir un detalle pequeño.", ejemplo: "«La puerta ya estaba abierta», «reconozco esta calle»." },
  flashback: { coste: 1, titulo: "Flashback", texto: "Narrar un recuerdo que revele, complique o altere la escena actual.", ejemplo: "Un recuerdo, una escena del pasado, una relación previa." },
  giro: { coste: 2, titulo: "Giro de mayor peso", texto: "Introducir un giro de mayor peso.", ejemplo: "«Ese saqueador me conoce», «la radio sigue funcionando»." },
  alterar: { coste: 3, titulo: "Alterar la escena", texto: "Alterar radicalmente una escena entera.", ejemplo: "«Las luces vuelven», «el edificio empieza a derrumbarse», «llega otra facción»." }
};

/** M 14 y R 4. `refugio: true` = solo tiene sentido si hay un Refugio en juego. */
export const RECUPERACIONES = {
  estres: { titulo: "Borrar 1 Estrés", icono: "fa-solid fa-feather" },
  vinculo: { titulo: "Fortalecer un vínculo", icono: "fa-solid fa-heart" },
  verdad: { titulo: "Revelar una verdad", icono: "fa-solid fa-eye" },
  esperanza: { titulo: "Recuperar temporalmente la esperanza", icono: "fa-solid fa-sun" },
  marca: { titulo: "Eliminar temporalmente una Marca", icono: "fa-solid fa-moon" },
  moral: { titulo: "Mejorar la Moral del refugio en 1", icono: "fa-solid fa-people-group", refugio: true },
  estresRefugio: { titulo: "Reducir el Estrés del refugio en 1", icono: "fa-solid fa-house-chimney-crack", refugio: true }
};

/** M 13 */
export const FASES = {
  preparacion: { titulo: "Preparación", texto: "Lugar, problema, amenaza y pregunta incómoda. Nada más." },
  cold: { titulo: "Cold Open", texto: "La Voz abre la sesión directamente con tensión, sin ninguna introducción previa." },
  escenas: { titulo: "Escenas rápidas", texto: "De 5 a 15 minutos cada una. Cualquiera puede pedir «corte de escena»." },
  escalada: { titulo: "Escalada", texto: "Cada escena empeora algo, revela algo o rompe algo." },
  ruptura: { titulo: "Punto de ruptura", texto: "Alguien llega a su límite: colapsa, miente, desaparece, traiciona o pierde el control." },
  cliffhanger: { titulo: "Cliffhanger final", texto: "La sesión termina dejando una pregunta abierta." }
};

/** R 1 · Paso 1 */
export const TIPOS_REFUGIO = {
  supermercado: { nombre: "Supermercado", ventaja: "Todavía quedan recursos escondidos.", problema: "Demasiadas entradas." },
  gasolinera: { nombre: "Gasolinera", ventaja: "Acceso a combustible y carretera.", problema: "Todo el mundo puede verla." },
  ferry: { nombre: "Ferry abandonado", ventaja: "Aislado y relativamente seguro.", problema: "Difícil abandonar el lugar rápidamente." },
  parking: { nombre: "Parking subterráneo", ventaja: "Oculto y resistente.", problema: "Oscuridad, humedad y mala ventilación." },
  urbanizacion: { nombre: "Urbanización cerrada", ventaja: "Espacio y viviendas separadas.", problema: "Conflictos entre vecinos." },
  radio: { nombre: "Estación de radio", ventaja: "Comunicación con otros supervivientes.", problema: "Las transmisiones atraen atención." },
  hospital: { nombre: "Hospital improvisado", ventaja: "Acceso médico parcial.", problema: "Heridos constantes y medicinas insuficientes." },
  otro: { nombre: "Otro lugar", ventaja: "", problema: "" }
};

/** R 1 · Paso 5 */
export const LIDERAZGOS = {
  fuerte: { nombre: "Liderazgo fuerte", texto: "Una persona toma las decisiones." },
  consejo: { nombre: "Consejo", texto: "Varias personas discuten constantemente entre ellas." },
  caotica: { nombre: "Supervivencia caótica", texto: "Nadie tiene verdadero control." },
  violento: { nombre: "Control violento", texto: "La comunidad se mantiene unida mediante el miedo." },
  emocional: { nombre: "Dependencia emocional", texto: "Todos siguen a alguien porque necesitan creer en él." }
};

/** R 2: todos empiezan en 2, mínimo 0, máximo 5. `critico` es el valor que dispara el efecto. */
export const VALORES_REFUGIO = {
  seguridad: {
    nombre: "Seguridad", icono: "fa-solid fa-shield-halved", critico: 0,
    texto: "Protección, vigilancia, barreras y capacidad defensiva.",
    efecto: "El refugio deja de ser seguro: la Voz introduce de inmediato una invasión, una ruptura, una infiltración o una amenaza imposible de ignorar."
  },
  suministros: {
    nombre: "Suministros", icono: "fa-solid fa-box-open", critico: 0,
    texto: "Comida, agua, medicinas, combustible y herramientas.",
    efecto: "La gente pasa hambre: todos los personajes ganan 1 Estrés al inicio de cada episodio y las discusiones se vuelven frecuentes."
  },
  moral: {
    nombre: "Moral", icono: "fa-solid fa-fire-flame-curved", critico: 0,
    texto: "Esperanza, cohesión y ganas de seguir adelante.",
    efecto: "Colapso emocional: la Voz puede introducir motines, violencia interna, suicidios, huidas, traiciones o paranoia colectiva."
  },
  ruido: {
    nombre: "Ruido", icono: "fa-solid fa-volume-high", critico: 5,
    texto: "Visibilidad: actividad, transmisiones, movimiento, incendios, generadores.",
    efecto: "Alguien encuentra el refugio. Siempre."
  },
  confianza: {
    nombre: "Confianza", icono: "fa-solid fa-handshake", critico: 0,
    texto: "Unidad, cooperación y estabilidad social.",
    efecto: "Nadie cree ya en nadie: toda escena social importante genera automáticamente tensión."
  }
};

/** R 4: no son clases, son cargas. */
export const ROLES_REFUGIO = {
  radio: { nombre: "La Voz de la Radio", carga: "Mantiene contacto con el exterior." },
  vigilante: { nombre: "El Vigilante", carga: "Siempre está despierto demasiado tiempo." },
  medica: { nombre: "La Médica", carga: "Decide quién recibe tratamiento." },
  cocinero: { nombre: "El Cocinero", carga: "Administra la comida." },
  mecanico: { nombre: "El Mecánico", carga: "Mantiene vivo el generador." },
  puerta: { nombre: "Quien Decide Quién Entra", carga: "El trabajo más horrible del refugio." },
  enterrador: { nombre: "Quien Entierra a los Muertos", carga: "Nadie quiere hacerlo demasiado tiempo." }
};

/** V 19 · R 6 */
export const TIPOS_COMUNIDAD = {
  cerrado: { nombre: "Refugio cerrado", texto: "Nadie entra. Nadie sale." },
  violenta: { nombre: "Comunidad violenta", texto: "Sobreviven saqueando." },
  culto: { nombre: "Culto", texto: "Interpretan la violencia como algo espiritual." },
  ciudadela: { nombre: "Ciudadela", texto: "Pequeños territorios organizados mediante fuerza y control." },
  movil: { nombre: "Campamento móvil", texto: "Nunca permanecen demasiado tiempo en el mismo lugar." },
  radio: { nombre: "Estación de radio", texto: "Comunidades construidas alrededor de transmisiones." }
};

/** V 18: las cuatro preguntas que definen una comunidad. */
export const PREGUNTAS_COMUNIDAD = {
  necesita: { titulo: "Qué necesita", sugerencias: ["Comida.", "Medicinas.", "Combustible.", "Seguridad.", "Información."] },
  teme: { titulo: "Qué teme", sugerencias: ["La violencia.", "El hambre.", "Otras comunidades.", "El aislamiento."] },
  sacrifica: { titulo: "Qué está dispuesta a sacrificar", sugerencias: ["Libertad.", "Personas.", "Secretos.", "Moralidad."] },
  oculta: { titulo: "Qué oculta", sugerencias: [] }
};

/** V 22 */
export const ESTADOS_VIOLENCIA = {
  ninguno: { nombre: "Sin síntomas", texto: "" },
  rabia: { nombre: "Rabia", texto: "Ataques impulsivos y brutales." },
  paranoia: { nombre: "Paranoia", texto: "Miedo constante y agresividad preventiva." },
  obsesion: { nombre: "Obsesión", texto: "Conductas repetitivas y peligrosas." },
  histeria: { nombre: "Histeria colectiva", texto: "Multitudes que reaccionan violentamente." },
  colapso: { nombre: "Colapso emocional", texto: "Personas incapaces de controlar el miedo o la desesperación." }
};

/** M 16 */
export const DESTINOS = {
  "": { nombre: "Sigue en juego" },
  retirado: { nombre: "Retirado" },
  sacrificado: { nombre: "Sacrificado" },
  desaparecido: { nombre: "Desaparecido" },
  pnj: { nombre: "Convertido en PNJ" },
  transformado: { nombre: "Transformado" }
};

/** V 36–38 */
export const ESCENARIOS = [
  { titulo: "El supermercado", situacion: "Quedan suministros. Pero no sois los únicos que lo sabéis.", pregunta: "¿Quién merece comer?" },
  { titulo: "La emisora abandonada", situacion: "Una radio sigue emitiendo música.", pregunta: "¿Quién sigue ahí dentro?" },
  { titulo: "La gasolinera encendida", situacion: "Hay luz. Y eso nunca es buena señal.", pregunta: "¿Por qué alguien quiere ser encontrado?" }
];

/** Grupos del panel de la Voz: qué listas aparecen y en qué orden. */
export const ORACULOS = [
  { id: "episodio", titulo: "Abrir y cerrar", listas: ["escenasIniciales", "lugares", "problemas", "amenazas", "preguntasSesion", "cliffhangers"] },
  { id: "improvisar", titulo: "Improvisar", listas: ["frasesVoz", "preguntasCampana", "puntoRuptura", "rumores", "transmisiones", "teorias", "estadosViolencia", "tiposComunidad"] },
  { id: "refugio", titulo: "Refugio y expediciones", listas: ["preguntasRefugio", "movimientosComunidad", "marcasRefugio", "objetivosExpedicion", "preguntasExpedicion", "complicacionesExpedicion", "relojes", "vidaRefugio"] },
  { id: "temporada", titulo: "Temporadas", listas: ["cambiosTemporada", "eventosTemporada"] }
];
