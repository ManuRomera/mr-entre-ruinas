/**
 * Hoja del refugio (suplemento Refugios): los cinco valores y el Estrés colectivo
 * arriba, siempre a la vista; debajo, lo que define a la comunidad, sus Marcas,
 * los relojes de amenaza y quién carga con cada rol.
 */
import { HojaER } from "./base.mjs";
import { DialogV2 } from "../compat.mjs";
import { RUTA } from "../mesa.mjs";
import { valorPorCasilla } from "../reglas.mjs";
import { LISTAS, VALORES_REFUGIO, TIPOS_REFUGIO, LIDERAZGOS, ROLES_REFUGIO } from "../listas.mjs";

/** Reloj como tarta SVG de N porciones: cada porción es un botón. */
function porciones(segmentos, marcados) {
  const r = 46;
  return Array.from({ length: segmentos }, (_, i) => {
    const a0 = (i / segmentos) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / segmentos) * 2 * Math.PI - Math.PI / 2;
    const p = a => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
    return { n: i + 1, llena: i < marcados, d: `M50 50 L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z` };
  });
}

export class HojaRefugio extends HojaER {
  static DEFAULT_OPTIONS = {
    classes: ["er-refugio"],
    position: { width: 940, height: 780 },
    window: { icon: "fa-solid fa-house-chimney-crack" },
    actions: {
      valor: HojaRefugio.#valor,
      estres: HojaRefugio.#estres,
      ganarEstres: HojaRefugio.#ganarEstres,
      crisis: HojaRefugio.#crisis,
      perderSustento: HojaRefugio.#perderSustento,
      reloj: { handler: HojaRefugio.#reloj, buttons: [0, 2] },
      escenaRefugio: () => game.mrEntreRuinas.episodio.abrirEscenaRefugio(),
      oraculo: (event, boton) => game.mrEntreRuinas.oraculo(boton.dataset.lista)
    }
  };

  static SECCIONES = { corazon: true, marcas: true, relojes: true, roles: true, expedicion: false, diario: false };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/refugio.hbs`, scrollable: [".er-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const s = this.document.system;
    const personajes = game.actors.filter(a => a.type === "personaje");
    const tipo = TIPOS_REFUGIO[s.tipo];
    return Object.assign(ctx, {
      valores: Object.entries(VALORES_REFUGIO).map(([clave, v]) => ({
        clave, ...v, valor: s.valores[clave],
        enUmbral: s.valores[clave] === v.critico,
        casillas: Array.from({ length: 6 }, (_, n) => ({ n, llena: n <= s.valores[clave] && n > 0, actual: n === s.valores[clave] }))
      })),
      estres: Array.from({ length: s.estres.max }, (_, i) => ({ n: i + 1, llena: i < s.estres.value })),
      tipos: Object.fromEntries(Object.entries(TIPOS_REFUGIO).map(([k, t]) => [k, t.nombre])),
      tipo,
      liderazgos: Object.fromEntries(Object.entries(LIDERAZGOS).map(([k, l]) => [k, l.nombre])),
      liderazgo: LIDERAZGOS[s.liderazgo],
      relojes: s.relojes.map((r, i) => ({ ...r, i, porciones: porciones(r.segmentos, r.marcados), completo: r.marcados >= r.segmentos })),
      roles: Object.entries(ROLES_REFUGIO).map(([clave, r]) => ({ clave, ...r, uuid: s.roles[clave] })),
      personajes: Object.fromEntries(personajes.map(a => [a.uuid, a.name])),
      segmentosReloj: { 4: "4", 6: "6", 8: "8", 10: "10", 12: "12" },
      listas: LISTAS
    });
  }

  /** Clic en el punto N fija el valor en N (el punto 0 existe: a 0 se llega a propósito). */
  static #valor(event, boton) {
    this.document.fijarValor(boton.dataset.clave, Number(boton.dataset.n));
  }

  static #estres(event, boton) {
    this.document.fijarEstresRefugio(valorPorCasilla(this.document.system.estres.value, Number(boton.dataset.n)));
  }

  static #ganarEstres(event, boton) {
    this.cajonAbierto = null;
    this.document.ganarEstresRefugio(boton.dataset.texto);
  }

  static #crisis() {
    game.mrEntreRuinas.dialogos.crisisRefugio(this.document);
  }

  static async #perderSustento() {
    const ok = await DialogV2.confirm({
      window: { title: "Perder lo que mantiene vivo el refugio" },
      content: `<p>Si <strong>${foundry.utils.escapeHTML(this.document.system.sustento || "su sustento")}</strong> desaparece, el refugio entra inmediatamente en Crisis.</p>`,
      classes: ["mr-entre-ruinas", "er-dialogo"]
    });
    if (ok) this.document.perderSustento();
  }

  /** Clic izquierdo avanza la porción pulsada; clic derecho la retrocede. */
  static #reloj(event, boton) {
    const i = Number(boton.dataset.indice);
    const actual = this.document.system.relojes[i].marcados;
    const n = Number(boton.dataset.n);
    this.document.fijarReloj(i, event.button === 2 ? Math.min(actual, n) - 1 : valorPorCasilla(actual, n));
  }
}
