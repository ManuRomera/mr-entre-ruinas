/**
 * Estado compartido de la mesa: temporada, episodio, fase, quién es la Voz,
 * preparación de la sesión y escena de refugio abierta.
 *
 * En Entre Ruinas no hay director: la Voz rota entre jugadores (M 3.2). Un ajuste
 * de mundo solo lo escribe un GM, así que los jugadores piden el cambio por socket
 * y lo aplica el GM activo. Mismo camino para las pocas operaciones que tocan
 * documentos ajenos (p. ej. la Voz marca Estrés a otro personaje).
 */
import { olvidarTodo } from "./memoria.mjs";
import { ApplicationV2 } from "./compat.mjs";

export const ID = "mr-entre-ruinas";
export const SOCKET = `system.${ID}`;
export const RUTA = `systems/${ID}`;

const ESTADO_INICIAL = {
  temporada: 1,
  episodio: 1,
  fase: "preparacion",
  voz: "",
  lugar: "",
  problema: "",
  amenaza: "",
  pregunta: "",
  cliffhanger: "",
  refugio: "",
  vocesTemporada: []
};

/** Abrir el ajuste desde el menú borra la memoria de ventanas sin abrir nada. */
class RestablecerVentanas extends ApplicationV2 {
  async render() {
    olvidarTodo();
    ui.notifications.info("Posiciones, tamaños y pestañas olvidadas en este navegador.");
    return this;
  }
}

export function registrarAjustes() {
  game.settings.register(ID, "estado", {
    scope: "world", config: false, type: Object, default: ESTADO_INICIAL,
    onChange: () => Hooks.callAll("mrEntreRuinas.estado", estado())
  });
  game.settings.register(ID, "estresAlFallar", {
    name: "Estrés automático al fallar",
    hint: "Un fallo (6 o menos) marca 1 Estrés al personaje (M 8.1).",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "mesaCompartida", {
    name: "Mesa sin director",
    hint: "Refugios, comunidades y PNJ nuevos pertenecen a toda la mesa, y cualquiera puede ver las fichas de los demás: la Voz rota cada sesión (M 3.2).",
    scope: "world", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "asistente", {
    name: "Asistente al crear personaje",
    hint: "Abre el asistente de seis pasos al crear un personaje nuevo.",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(ID, "bienvenida", { scope: "world", config: false, type: String, default: "" });
  game.settings.registerMenu(ID, "ventanas", {
    name: "Memoria de ventanas",
    label: "Olvidar posiciones",
    hint: "Las ventanas del sistema recuerdan posición, tamaño, pestaña y secciones plegadas en este navegador.",
    icon: "fa-solid fa-window-restore",
    type: RestablecerVentanas,
    restricted: false
  });
}

export function estado() {
  return { ...ESTADO_INICIAL, ...game.settings.get(ID, "estado") };
}

/** Personaje que es la Voz ahora mismo, si lo hay. */
export function voz() {
  const uuid = estado().voz;
  return uuid ? fromUuidSync(uuid) : null;
}

/** Personajes jugadores: los que tienen algún dueño no GM. Si no hay ninguno, todos. */
export function personajes() {
  const todos = game.actors.filter(a => a.type === "personaje" && !a.system.destino);
  const jugados = todos.filter(a => game.users.some(u => !u.isGM && a.testUserPermission(u, "OWNER")));
  return jugados.length ? jugados : todos;
}

const OPERACIONES = {
  // Lo que llega por socket se filtra: solo claves conocidas del estado y Estrés de 1 en 1.
  async estado({ cambios }) {
    const validos = Object.fromEntries(Object.entries(cambios ?? {}).filter(([k]) => k in ESTADO_INICIAL));
    await game.settings.set(ID, "estado", { ...estado(), ...validos });
  },
  async estres({ uuid, motivo }) {
    const actor = await fromUuid(uuid);
    if (actor?.type === "personaje") await actor.ganarEstres(1, String(motivo ?? ""));
  }
};

/** Otros módulos añaden operaciones que solo puede ejecutar un GM (p. ej. el cierre de episodio). */
export function registrarOperacion(nombre, fn) {
  OPERACIONES[nombre] = fn;
}

/** Ejecuta la operación aquí si se puede; si no, se la pide al GM activo. */
export async function pedir(op, datos) {
  if (game.user.isGM) return OPERACIONES[op](datos);
  if (!game.users.activeGM) {
    ui.notifications.warn("Hace falta un GM conectado para cambiar el estado compartido de la mesa.");
    return;
  }
  game.socket.emit(SOCKET, { op, datos });
}

export const cambiarEstado = cambios => pedir("estado", { cambios });

export function escucharSocket() {
  game.socket.on(SOCKET, ({ op, datos } = {}) => {
    if (game.users.activeGM?.isSelf && OPERACIONES[op]) OPERACIONES[op](datos);
  });
}
