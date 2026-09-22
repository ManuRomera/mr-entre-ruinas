/**
 * Diálogos de juego. Todos recuerdan dónde se abrieron la última vez.
 * Las sugerencias del manual son chips: al pulsarlas rellenan la casilla,
 * que sigue siendo editable.
 */
import { DialogV2, renderTemplate } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { RUTA, estado, personajes } from "../mesa.mjs";
import { LISTAS, RECUPERACIONES } from "../listas.mjs";
import { sugerirVoz } from "../reglas.mjs";
import { finEpisodio } from "../episodio.mjs";

class DialogoER extends ConMemoria(DialogV2) {
  static DEFAULT_OPTIONS = { classes: ["mr-entre-ruinas", "er-dialogo"], position: { width: 520 } };
  static CAMPOS_MEMORIA = ["left", "top", "width"];
}

/** Chips que rellenan un campo: <button data-rellenar="campo" data-texto="…">. */
function activarChips(event, dialogo) {
  const raiz = dialogo.element;
  for (const chip of raiz.querySelectorAll("[data-rellenar]")) {
    chip.addEventListener("click", () => {
      const campo = raiz.querySelector(`[name="${chip.dataset.rellenar}"]`);
      campo.value = chip.dataset.texto;
      for (const otro of raiz.querySelectorAll(`[data-rellenar="${chip.dataset.rellenar}"]`)) otro.classList.toggle("activo", otro === chip);
      campo.focus();
    });
  }
}

async function preguntar({ memoria, titulo, icono, plantilla, datos, boton, iconoBoton }) {
  return DialogoER.wait({
    memoria,
    window: { title: titulo, icon: icono },
    content: await renderTemplate(`${RUTA}/templates/dialogos/${plantilla}.hbs`, datos),
    buttons: [
      { action: "ok", label: boton, icon: iconoBoton, default: true, callback: (event, b) => Object.fromEntries(new FormData(b.form)) },
      { action: "no", label: "Más tarde", icon: "fa-solid fa-xmark" }
    ],
    render: activarChips,
    rejectClose: false
  });
}

export async function crisis(actor) {
  const r = await preguntar({
    memoria: "dialogo-crisis", titulo: `Crisis · ${actor.name}`, icono: "fa-solid fa-burst", plantilla: "crisis",
    datos: { actor, explosiones: LISTAS.crisis.items, marcas: LISTAS.marcasPermanentes.items },
    boton: "Resolver la Crisis", iconoBoton: "fa-solid fa-burst"
  });
  if (r && r !== "no") await actor.resolverCrisis({ explosion: r.explosion, marca: r.marca });
}

export async function crisisRefugio(refugio) {
  const r = await preguntar({
    memoria: "dialogo-crisis-refugio", titulo: `Crisis del refugio · ${refugio.name}`, icono: "fa-solid fa-people-group", plantilla: "crisis-refugio",
    datos: { refugio, movimientos: LISTAS.movimientosComunidad.items, marcas: LISTAS.marcasRefugio.items },
    boton: "Resolver la Crisis", iconoBoton: "fa-solid fa-burst"
  });
  if (r && r !== "no") await refugio.resolverCrisisRefugio({ movimiento: r.movimiento, marca: r.marca });
}

/** M 14 · R 4: cada personaje elige una forma de recuperarse. */
export async function recuperar(actor) {
  const refugios = game.actors.filter(a => a.type === "refugio" && a.isOwner);
  const s = actor.system;
  const opciones = Object.entries(RECUPERACIONES)
    .filter(([, o]) => !o.refugio || refugios.length)
    .map(([clave, o]) => ({
      clave, ...o,
      deshabilitada: (clave === "estres" && !s.estres.value) || (clave === "marca" && !s.marcas.some(m => !m.suprimida))
    }));
  const r = await preguntar({
    memoria: "dialogo-recuperar", titulo: `Escena de refugio · ${actor.name}`, icono: "fa-solid fa-mug-hot", plantilla: "recuperar",
    datos: {
      actor, opciones, refugios,
      marcas: s.marcas.map((m, i) => ({ ...m, i })).filter(m => !m.suprimida),
      vinculos: [["positivo", s.vinculos.positivo.quien || "Vínculo Positivo"], ["negativo", s.vinculos.negativo.quien || "Vínculo Negativo"]],
      ideas: LISTAS.vidaRefugio.items
    },
    boton: "Recuperarse", iconoBoton: "fa-solid fa-heart-pulse"
  });
  if (r?.opcion) await actor.recuperar(r.opcion, r);
}

/** Desde el chat: la recuperación del personaje propio del usuario. */
export async function recuperarPropio() {
  const mio = game.user.character?.type === "personaje" ? game.user.character : null;
  const propios = mio ? [mio] : game.actors.filter(a => a.type === "personaje" && a.isOwner && !a.system.destino);
  const pendientes = propios.filter(a => !a.recuperadoEnEscena);
  if (!pendientes.length) return ui.notifications.info(propios.length ? "Ya has elegido tu recuperación en esta escena." : "No tienes ningún personaje asignado.");
  if (pendientes.length === 1) return recuperar(pendientes[0]);
  const eleccion = await DialogoER.wait({
    memoria: "dialogo-elegir-personaje",
    window: { title: "¿Quién se recupera?", icon: "fa-solid fa-mug-hot" },
    content: `<div class="er-dialogo-cuerpo er-elegir">${pendientes.map(a => `<img src="${a.img}" alt=""><span>${foundry.utils.escapeHTML(a.name)}</span>`).join("")}</div>`,
    buttons: pendientes.map(a => ({ action: a.id, label: a.nombreCorto })),
    rejectClose: false
  });
  const actor = game.actors.get(eleccion);
  if (actor) return recuperar(actor);
}

/** M 13.5 · M 15: cierre del episodio y relevo de la Voz. */
export async function finEpisodioDialogo() {
  const e = estado();
  const candidatos = personajes();
  const sugerida = sugerirVoz(candidatos.map(a => a.uuid), e.voz, e.vocesTemporada);
  const r = await preguntar({
    memoria: "dialogo-fin", titulo: `Fin del episodio ${e.episodio}`, icono: "fa-solid fa-radio", plantilla: "fin-episodio",
    datos: {
      e, cliffhangers: LISTAS.cliffhangers.items,
      candidatos: candidatos.map(a => ({ uuid: a.uuid, nombre: a.name, sugerida: a.uuid === sugerida, yaFue: e.vocesTemporada.includes(a.uuid) })),
      finTemporada: e.episodio >= 6
    },
    boton: "Cerrar el episodio", iconoBoton: "fa-solid fa-radio"
  });
  if (r && r !== "no") await finEpisodio({ cliffhanger: r.cliffhanger, voz: r.voz });
}

export const dialogos = { crisis, crisisRefugio, recuperar, recuperarPropio, finEpisodio: finEpisodioDialogo };
