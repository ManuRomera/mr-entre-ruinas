/**
 * Tarjetas de chat. Una sola plantilla para todo: tiradas, Estrés, Caos, Crisis,
 * avisos del refugio, fases del episodio y oráculos de la Voz.
 */
import { ID, RUTA, pedir, voz } from "./mesa.mjs";
import { aplicarModo, alRenderizarMensaje, renderTemplate } from "./compat.mjs";
import { LISTAS } from "./listas.mjs";
import { alAzar } from "./reglas.mjs";

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
    estres: tarjeta.estres && { ...tarjeta.estres, casillas: Array.from({ length: tarjeta.estres.max }, (_, i) => i < tarjeta.estres.valor) }
  };
  const content = await renderTemplate(`${RUTA}/templates/chat/tarjeta.hbs`, vista);
  const datos = {
    content,
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker({ alias: tarjeta.alias ?? firmaVoz() }),
    flags: { [ID]: { tipo: tarjeta.tipo } }
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

export function escucharChat() {
  alRenderizarMensaje((mensaje, html) => {
    if (!mensaje.getFlag(ID, "tipo")) return;
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
