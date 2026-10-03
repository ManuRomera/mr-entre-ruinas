/**
 * Tarjetas de chat. Una sola plantilla para todo: tiradas, Estrés, Caos, Crisis,
 * avisos del refugio, fases del episodio y oráculos de la Voz.
 */
import { ID, RUTA, pedir, voz } from "./mesa.mjs";
import { aplicarModo, alRenderizarMensaje, renderTemplate } from "./compat.mjs";
import { LISTAS } from "./listas.mjs";
import { alAzar } from "./reglas.mjs";
import { pintarRetratos } from "./retrato.mjs";

/**
 * @param {object} tarjeta  Datos para templates/chat/tarjeta.hbs
 * @param {object} [op]
 * @param {Actor}  [op.actor]   Quién habla
 * @param {Roll}   [op.tirada]  Tirada incluida (respeta el modo de visibilidad del chat)
 */
export async function publicar(tarjeta, { actor, tirada } = {}) {
  const conAtributos = b => ({ ...b, attrs: atributosData(b.datos) });
  const vista = {
    ...tarjeta,
    lista: tarjeta.lista && { ...tarjeta.lista, items: tarjeta.lista.items.map(conAtributos) },
    botones: tarjeta.botones?.map(conAtributos),
    retrato: tarjeta.img && actor ? actor.id : undefined,
    estres: tarjeta.estres && { ...tarjeta.estres, casillas: Array.from({ length: tarjeta.estres.max }, (_, i) => i < tarjeta.estres.valor) }
  };
  const content = await renderTemplate(`${RUTA}/templates/chat/tarjeta.hbs`, vista);
  const datos = {
    content,
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker({ alias: tarjeta.alias ?? firmaVoz() }),
    flags: { [ID]: { tipo: tarjeta.tipo, crisis: tarjeta.botones?.find(b => b.accion === "crisis")?.datos.uuid } }
  };
  if (tirada) {
    datos.rolls = [tirada];
    datos.sound = CONFIG.sounds.dice;
    aplicarModo(datos);
  }
  return ChatMessage.create(datos);
}

/** Lo que no dice un personaje lo dice la Voz de esta sesión, si la hay. */
function firmaVoz() {
  const actual = voz();
  return actual ? `La Voz · ${actual.nombreCorto}` : game.user.name;
}

/** Lista de opciones clicables dentro de una tarjeta. */
export const opciones = (clave, accion, datos = {}) => ({
  titulo: LISTAS[clave].titulo,
  items: LISTAS[clave].items.map(texto => ({ texto, accion, datos: { ...datos, texto } }))
});

/** `datos` → atributos data-* para la plantilla. */
export function atributosData(datos = {}) {
  return Object.entries(datos).map(([k, v]) => `data-${k}="${foundry.utils.escapeHTML(String(v))}"`).join(" ");
}

/** Publica un elemento al azar de una lista (oráculos de la Voz). */
export function oraculo(clave, texto = alAzar(LISTAS[clave].items)) {
  return publicar({ tipo: "oraculo", tono: "voz", icono: "fa-solid fa-radio", etiqueta: LISTAS[clave].titulo, titulo: texto, pie: LISTAS[clave].origen });
}

const ACCIONES = {
  async consecuencia(ds) {
    const actor = await fromUuid(ds.uuid);
    await publicar({ tipo: "consecuencia", tono: "coste", icono: "fa-solid fa-scale-unbalanced", etiqueta: "La Voz elige", titulo: ds.texto, subtitulo: actor?.name });
    if (ds.texto === "Se gana Estrés." && actor) await pedirEstres(actor, "Consecuencia de un éxito con coste.");
  },
  async movimiento(ds) {
    const texto = ds.texto || alAzar(LISTAS.movimientosDuros.items);
    await publicar({ tipo: "movimiento", tono: "fallo", icono: "fa-solid fa-bolt", etiqueta: "Movimiento Duro", titulo: texto });
    // M 12: «Activar una Crisis» llena el Estrés de quien ha fallado.
    if (texto === "Activar una Crisis." && ds.uuid) {
      const actor = await fromUuid(ds.uuid);
      if (actor?.type === "personaje" && !actor.system.enCrisis) await pedirCrisis(actor);
    }
  },
  oraculo(ds) {
    return oraculo(ds.lista);
  },
  async estresRefugio(ds) {
    const refugio = await fromUuid(ds.uuid);
    if (!refugio) return;
    if (refugio.isOwner) return refugio.ganarEstresRefugio(ds.texto);
    return pedir("estresRefugio", { uuid: ds.uuid, motivo: ds.texto });
  },
  async reloj(ds) {
    const refugio = await fromUuid(ds.uuid);
    const reloj = refugio?.system.relojes[Number(ds.indice)];
    if (!reloj || reloj.marcados >= reloj.segmentos) return;
    if (refugio.isOwner) await refugio.fijarReloj(Number(ds.indice), reloj.marcados + 1);
    else await pedir("reloj", { uuid: ds.uuid, indice: Number(ds.indice) });
    ui.notifications.info(`${reloj.nombre || "Reloj"}: ${reloj.marcados + 1}/${reloj.segmentos}.`);
  },
  async destino(ds) {
    const actor = await fromUuid(ds.uuid);
    await publicar({ tipo: "destino", tono: "voz", icono: "fa-solid fa-door-open", etiqueta: "Abandonar el juego", subtitulo: actor?.name, titulo: ds.texto });
  },
  /** M 6.4: al cerrar el episodio cada jugador revisa sus vínculos. */
  async vinculos() {
    const mio = game.user.character?.type === "personaje" ? [game.user.character] : [];
    const propios = mio.length ? mio : game.actors.filter(a => a.type === "personaje" && a.isOwner && !a.system.destino && !game.user.isGM);
    if (!propios.length) return ui.notifications.info("No tienes ningún personaje asignado.");
    for (const actor of propios) {
      await actor.sheet.render(true);
      const bloque = actor.sheet.element?.querySelector('details[data-memoria="vinculos"]');
      if (bloque) { bloque.open = true; bloque.scrollIntoView({ block: "nearest" }); }
    }
  },
  async crisis(ds) {
    const actor = await fromUuid(ds.uuid);
    if (actor?.isOwner) game.mrEntreRuinas.dialogos.crisis(actor);
  },
  async crisisRefugio(ds) {
    const refugio = await fromUuid(ds.uuid);
    if (refugio?.isOwner) game.mrEntreRuinas.dialogos.crisisRefugio(refugio);
  },
  recuperar() {
    return game.mrEntreRuinas.dialogos.recuperarPropio();
  },
  voz() {
    return game.mrEntreRuinas.abrirVoz();
  },
  async manual() {
    const manual = await game.packs.get(`${ID}.manual`)?.getDocument("manualEntreRuina");
    manual?.sheet.render(true);
  },
  async pregenerados() {
    game.packs.get(`${ID}.pregenerados`)?.render(true);
  }
};

/** Estrés a un personaje que quizá no es mío: lo aplica quien pueda. */
export function pedirEstres(actor, motivo) {
  if (actor.isOwner) return actor.ganarEstres(1, motivo);
  return pedir("estres", { uuid: actor.uuid, motivo });
}

/** La Crisis a la fuerza: la aplica quien lleve el personaje o, si no, el GM conectado. */
export function pedirCrisis(actor) {
  if (actor.isOwner) return actor.fijarEstres(actor.system.estres.max);
  return pedir("crisis", { uuid: actor.uuid });
}

export function escucharChat() {
  // Una Crisis provocada por otra persona (o por el GM) se abre sola a quien lleva el personaje.
  Hooks.on("createChatMessage", mensaje => {
    const uuid = mensaje.getFlag(ID, "crisis");
    if (!uuid || mensaje.author?.id === game.user.id) return;
    const actor = fromUuidSync(uuid);
    if (actor?.isOwner && !game.user.isGM && actor.system.enCrisis) game.mrEntreRuinas.dialogos.crisis(actor);
  });
  alRenderizarMensaje((mensaje, html) => {
    if (!mensaje.getFlag(ID, "tipo")) return;
    pintarRetratos(html);
    // Los botones de Crisis solo sirven a quien lleva el personaje y mientras la Crisis siga abierta.
    for (const b of html.querySelectorAll("[data-dueno]")) {
      const doc = fromUuidSync(b.dataset.dueno);
      if (!doc?.isOwner || (b.dataset.erAccion.startsWith("crisis") && !doc.system.enCrisis)) b.remove();
    }
    for (const b of html.querySelectorAll("[data-er-accion]")) {
      b.addEventListener("click", async ev => {
        ev.preventDefault();
        const lista = b.closest(".er-lista-opciones");
        // Una consecuencia elegida no se vuelve a elegir desde este mensaje.
        if (lista) lista.classList.add("elegida"), b.classList.add("elegido");
        await ACCIONES[b.dataset.erAccion]?.({ ...b.dataset });
      });
    }
  });
}
