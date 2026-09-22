/**
 * Acciones de juego. Las hojas y el chat solo llaman a estos métodos: así la
 * misma regla se aplica igual desde un botón, una macro o una tarjeta de chat.
 */
import { ID, RUTA, estado } from "./mesa.mjs";
import { publicar, opciones } from "./chat.mjs";
import * as R from "./reglas.mjs";
import { ATRIBUTOS, RESULTADOS, GASTOS_CAOS, RECUPERACIONES, VALORES_REFUGIO } from "./listas.mjs";

const IMAGENES = {
  personaje: `${RUTA}/assets/iconos/personaje.webp`,
  pnj: `${RUTA}/assets/iconos/pnj.webp`,
  refugio: `${RUTA}/assets/iconos/refugio.webp`,
  comunidad: `${RUTA}/assets/iconos/comunidad.webp`
};

export const signo = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
const { OBSERVER, OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;

export class ActorER extends Actor {
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    const cambios = {};
    if (!data.img || data.img === Actor.DEFAULT_ICON) cambios.img = IMAGENES[this.type];
    if (this.type === "personaje" && !data.prototypeToken) {
      cambios.prototypeToken = {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        bar1: { attribute: "estres" },
        bar2: { attribute: "caos" },
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
      };
    }
    // Sin director: lo que no es un personaje pertenece a toda la mesa; los personajes se ven.
    if (game.settings.get(ID, "mesaCompartida") && !data.ownership?.default) {
      cambios["ownership.default"] = this.type === "personaje" ? OBSERVER : OWNER;
    }
    this.updateSource(cambios);
  }

  /** Nombre corto para las tarjetas: «Lucía “Luz” Romero» → Luz. */
  get nombreCorto() {
    return /["“«]([^"”»]+)["”»]/.exec(this.name)?.[1] ?? this.name.split(" ")[0];
  }

  // ─── Personaje: tiradas ────────────────────────────────────────────

  /**
   * M 7.1: 2d6 + atributo. `vinculo` suma +1 al ayudar al Vínculo Positivo (M 6.3).
   * Un fallo marca 1 Estrés si el ajuste está activo (M 8.1) y va en la misma tarjeta.
   */
  async tirar(clave, { vinculo = false, modificador = 0 } = {}) {
    const atributo = ATRIBUTOS[clave];
    const valor = this.system.atributos[clave];
    const extra = (vinculo ? 1 : 0) + Number(modificador || 0);
    const formula = ["2d6", valor && `${valor > 0 ? "+" : "-"} ${Math.abs(valor)}`, extra && `${extra > 0 ? "+" : "-"} ${Math.abs(extra)}`]
      .filter(Boolean).join(" ");
    const tirada = await new Roll(formula).evaluate();
    const banda = R.resultado(tirada.total);
    const positivo = this.system.vinculos.positivo.quien;

    const tarjeta = {
      tipo: "tirada", tono: banda, icono: atributo.icono, img: this.img,
      etiqueta: `${atributo.nombre} ${signo(valor)}`,
      subtitulo: this.name,
      titulo: RESULTADOS[banda].titulo,
      texto: RESULTADOS[banda].texto,
      dados: tirada.dice[0]?.results.map(r => r.result) ?? [],
      total: tirada.total,
      modificadores: [
        vinculo && `+1 ayudando a ${positivo || "su Vínculo Positivo"}`,
        modificador && `${signo(Number(modificador))} por la situación`
      ].filter(Boolean)
    };
    if (banda === "coste") tarjeta.lista = opciones("consecuencias", "consecuencia", { uuid: this.uuid });
    if (banda === "fallo") {
      tarjeta.lista = opciones("movimientosDuros", "movimiento");
      tarjeta.botones = [{ etiqueta: "Movimiento al azar", icono: "fa-solid fa-dice", accion: "movimiento" }];
      if (game.settings.get(ID, "estresAlFallar")) {
        const { valor: estres, crisis } = await this.#sumarEstres(1);
        tarjeta.estres = { valor: estres, max: this.system.estres.max, crisis };
        if (crisis) tarjeta.botones.unshift(this.#botonCrisis());
      }
    }
    await publicar(tarjeta, { actor: this, tirada });
    if (tarjeta.estres?.crisis) this.#abrirCrisis();
    return tirada;
  }

  // ─── Personaje: Estrés y Crisis ────────────────────────────────────

  async #sumarEstres(cantidad) {
    const r = R.sumarEstres(this.system.estres.value, cantidad, this.system.estres.max);
    await this.update({ "system.estres.value": r.valor });
    return r;
  }

  #botonCrisis() {
    return { etiqueta: "Resolver la Crisis", icono: "fa-solid fa-burst", accion: "crisis", datos: { uuid: this.uuid }, dueno: this.uuid };
  }

  #abrirCrisis() {
    if (this.isOwner) game.mrEntreRuinas.dialogos.crisis(this);
  }

  /** M 8.1 */
  async ganarEstres(cantidad = 1, motivo = "") {
    if (this.system.enCrisis) return ui.notifications.warn(`${this.name} ya está en Crisis: resuélvela primero.`);
    const { valor, crisis } = await this.#sumarEstres(cantidad);
    await publicar({
      tipo: "estres", tono: "estres", icono: "fa-solid fa-wave-square", img: this.img,
      etiqueta: `Estrés ${valor}/${this.system.estres.max}`, subtitulo: this.name,
      titulo: crisis ? "Llega al límite" : `Gana ${cantidad} de Estrés`, texto: motivo,
      estres: { valor, max: this.system.estres.max, crisis },
      botones: crisis ? [this.#botonCrisis()] : []
    }, { actor: this });
    if (crisis) this.#abrirCrisis();
  }

  async fijarEstres(valor) {
    const antes = this.system.estres.value;
    const max = this.system.estres.max;
    await this.update({ "system.estres.value": Math.max(0, Math.min(max, valor)) });
    if (valor >= max && antes < max) {
      await publicar({
        tipo: "estres", tono: "estres", icono: "fa-solid fa-wave-square", img: this.img,
        etiqueta: `Estrés ${max}/${max}`, subtitulo: this.name, titulo: "Llega al límite",
        estres: { valor: max, max, crisis: true }, botones: [this.#botonCrisis()]
      }, { actor: this });
      this.#abrirCrisis();
    }
  }

  /** M 8.2–8.3: describe cómo explota, vacía el Estrés y gana una Marca permanente. */
  async resolverCrisis({ explosion = "", marca = "" } = {}) {
    const marcas = [...this.system.marcas];
    if (marca.trim()) marcas.push({ texto: marca.trim(), permanente: true, suprimida: false });
    await this.update({ "system.estres.value": 0, "system.marcas": marcas });
    await publicar({
      tipo: "crisis", tono: "fallo", icono: "fa-solid fa-burst", img: this.img,
      etiqueta: "Crisis", subtitulo: this.name, titulo: explosion || "Explota",
      texto: "Vacía todo su Estrés, pero a cambio gana una nueva Marca permanente.",
      marca: marca.trim()
    }, { actor: this });
  }

  // ─── Personaje: Fichas de Caos ─────────────────────────────────────

  /** M 9.1 */
  async ganarCaos(motivo = "") {
    const { value, max } = this.system.caos;
    if (value >= max) return ui.notifications.info(`${this.name} ya tiene el máximo de ${max} Fichas de Caos.`);
    const nuevo = R.ganarCaos(value, 1, max);
    await this.update({ "system.caos.value": nuevo });
    await publicar({
      tipo: "caos", tono: "caos", icono: "fa-solid fa-hurricane", img: this.img,
      etiqueta: `Caos ${nuevo}/${max}`, subtitulo: this.name, titulo: "Gana 1 Ficha de Caos", texto: motivo
    }, { actor: this });
  }

  /** M 9.2–9.3 */
  async gastarCaos(tipo, detalle = "") {
    const gasto = GASTOS_CAOS[tipo];
    const { value, max } = this.system.caos;
    if (!gasto || !R.puedeGastar(value, tipo)) return ui.notifications.warn(`No quedan Fichas de Caos suficientes (${value}).`);
    await this.update({ "system.caos.value": value - gasto.coste });
    await publicar({
      tipo: "caos", tono: "caos", icono: tipo === "flashback" ? "fa-solid fa-clock-rotate-left" : "fa-solid fa-hurricane", img: this.img,
      etiqueta: `Gasta ${gasto.coste} · quedan ${value - gasto.coste}/${max}`, subtitulo: this.name,
      titulo: gasto.titulo, texto: gasto.texto, cita: detalle.trim()
    }, { actor: this });
  }

  // ─── Personaje: marcas, pregunta, recuperación ─────────────────────

  async interpretarMarca(indice) {
    const marca = this.system.marcas[indice];
    if (marca) await this.ganarCaos(`Interpreta activamente su Marca «${marca.texto.replace(/\.$/, "")}».`);
  }

  async revelarPregunta() {
    const { texto, respuesta } = this.system.pregunta;
    await this.update({ "system.pregunta.revelada": true });
    await publicar({
      tipo: "revelacion", tono: "voz", icono: "fa-solid fa-eye", img: this.img,
      etiqueta: "Pregunta incómoda", subtitulo: this.name, titulo: texto || "Una verdad sale a la luz", cita: respuesta
    }, { actor: this });
  }

  /**
   * M 14 · R 4: en una escena de refugio cada personaje elige una opción.
   * @param {string} opcion  clave de RECUPERACIONES
   * @param {object} extra   { marca, vinculo, texto, refugio }
   */
  async recuperar(opcion, extra = {}) {
    const r = RECUPERACIONES[opcion];
    if (!r) return;
    let detalle = "";
    switch (opcion) {
      case "estres":
        await this.update({ "system.estres.value": Math.max(0, this.system.estres.value - 1) });
        detalle = `Estrés ${this.system.estres.value}/${this.system.estres.max}.`;
        break;
      case "marca": {
        const marcas = this.system.marcas.map((m, i) => (i === Number(extra.marca) ? { ...m, suprimida: true } : m));
        await this.update({ "system.marcas": marcas });
        detalle = `«${this.system.marcas[Number(extra.marca)]?.texto ?? ""}» queda en suspenso hasta el final del episodio.`;
        break;
      }
      case "vinculo":
        detalle = `Con ${this.system.vinculos[extra.vinculo]?.quien || "alguien importante"}.`;
        break;
      case "moral":
      case "estresRefugio": {
        const refugio = game.actors.get(extra.refugio);
        if (!refugio) return ui.notifications.warn("No hay ningún Refugio al que aplicarlo.");
        if (opcion === "moral") await refugio.fijarValor("moral", refugio.system.valores.moral + 1);
        else await refugio.update({ "system.estres.value": Math.max(0, refugio.system.estres.value - 1) });
        detalle = refugio.name;
        break;
      }
    }
    const escena = estado().refugio;
    if (escena) await this.setFlag(ID, "recuperado", escena);
    await publicar({
      tipo: "recuperacion", tono: "refugio", icono: r.icono, img: this.img,
      etiqueta: "Escena de refugio", subtitulo: this.name, titulo: r.titulo, texto: detalle, cita: extra.texto?.trim()
    }, { actor: this });
  }

  get recuperadoEnEscena() {
    const escena = estado().refugio;
    return Boolean(escena) && this.getFlag(ID, "recuperado") === escena;
  }

  // ─── Refugio ───────────────────────────────────────────────────────

  /** R 2: los cinco valores van de 0 a 5; al llegar al valor crítico se avisa a la mesa. */
  async fijarValor(clave, valor) {
    const antes = this.system.valores[clave];
    const despues = R.limitarValorRefugio(valor);
    if (antes === despues) return;
    await this.update({ [`system.valores.${clave}`]: despues });
    const efecto = R.umbralRefugio(clave, antes, despues);
    if (efecto) {
      const v = VALORES_REFUGIO[clave];
      await publicar({
        tipo: "umbral", tono: "fallo", icono: v.icono, img: this.img,
        etiqueta: `${v.nombre} ${despues}`, subtitulo: this.name, titulo: `${v.nombre} a ${despues}`, texto: efecto
      }, { actor: this });
    }
  }

  /** R 3 */
  async ganarEstresRefugio(motivo = "") {
    if (this.system.enCrisis) return ui.notifications.warn(`${this.name} ya está en Crisis: resuélvela primero.`);
    const { valor, crisis } = R.sumarEstres(this.system.estres.value, 1, this.system.estres.max);
    await this.update({ "system.estres.value": valor });
    await this.#avisoEstresRefugio(valor, crisis, motivo);
  }

  /** Clic en una casilla: fija el valor; llenar la última dispara la Crisis. */
  async fijarEstresRefugio(valor) {
    const { value: antes, max } = this.system.estres;
    const nuevo = Math.max(0, Math.min(max, valor));
    await this.update({ "system.estres.value": nuevo });
    if (nuevo >= max && antes < max) await this.#avisoEstresRefugio(max, true, "");
  }

  /** R 1 · Paso 2: si desaparece lo que lo mantiene vivo, Crisis inmediata. */
  async perderSustento() {
    const max = this.system.estres.max;
    await this.update({ "system.estres.value": max });
    await this.#avisoEstresRefugio(max, true, `Se ha perdido lo que lo mantenía vivo: ${this.system.sustento || "su sustento"}.`);
  }

  async #avisoEstresRefugio(valor, crisis, motivo) {
    const max = this.system.estres.max;
    await publicar({
      tipo: "estres", tono: crisis ? "fallo" : "estres", icono: "fa-solid fa-house-chimney-crack", img: this.img,
      etiqueta: `Estrés del refugio ${valor}/${max}`, subtitulo: this.name,
      titulo: crisis ? "Crisis del refugio" : "El refugio gana 1 Estrés", texto: motivo,
      estres: { valor, max, crisis },
      lista: crisis ? opciones("movimientosComunidad", "movimiento") : null,
      botones: crisis ? [{ etiqueta: "Resolver la Crisis", icono: "fa-solid fa-burst", accion: "crisisRefugio", datos: { uuid: this.uuid }, dueno: this.uuid }] : []
    }, { actor: this });
    if (crisis && this.isOwner) game.mrEntreRuinas.dialogos.crisisRefugio(this);
  }

  /** R 3: Movimiento de Comunidad, Estrés a 0 y una Marca del refugio. */
  async resolverCrisisRefugio({ movimiento = "", marca = "" } = {}) {
    const marcas = [...this.system.marcas];
    if (marca.trim()) marcas.push({ texto: marca.trim() });
    await this.update({ "system.estres.value": 0, "system.marcas": marcas });
    await publicar({
      tipo: "crisis", tono: "fallo", icono: "fa-solid fa-people-group", img: this.img,
      etiqueta: "Movimiento de comunidad", subtitulo: this.name, titulo: movimiento || "La comunidad se rompe",
      texto: "El Estrés del refugio vuelve a 0, pero el refugio gana una Marca permanente.", marca: marca.trim()
    }, { actor: this });
  }

  /** R 7: cuando el reloj se completa, la amenaza ocurre. */
  async fijarReloj(indice, marcados) {
    const relojes = this.system.toObject().relojes;
    const reloj = relojes[indice];
    if (!reloj) return;
    const antes = reloj.marcados;
    reloj.marcados = Math.max(0, Math.min(reloj.segmentos, marcados));
    await this.update({ "system.relojes": relojes });
    if (reloj.marcados === reloj.segmentos && antes < reloj.segmentos) {
      await publicar({
        tipo: "reloj", tono: "fallo", icono: "fa-solid fa-hourglass-end", img: this.img,
        etiqueta: "Reloj completo", subtitulo: this.name, titulo: reloj.nombre || "La amenaza ocurre", texto: "La amenaza ocurre."
      }, { actor: this });
    }
  }
}

