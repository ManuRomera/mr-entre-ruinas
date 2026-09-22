/**
 * Hojas pequeñas: otras comunidades (V 18 · R 6) y personajes no jugadores,
 * incluidos los Violentos (V 22).
 */
import { HojaER } from "./base.mjs";
import { RUTA } from "../mesa.mjs";
import { TIPOS_COMUNIDAD, PREGUNTAS_COMUNIDAD, ESTADOS_VIOLENCIA } from "../listas.mjs";

export class HojaComunidad extends HojaER {
  static DEFAULT_OPTIONS = {
    classes: ["er-comunidad"],
    position: { width: 640, height: 680 },
    window: { icon: "fa-solid fa-people-roof" },
    actions: {
      sugerencia: HojaComunidad.#sugerencia
    }
  };

  static SECCIONES = { diario: true };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/comunidad.hbs`, scrollable: [".er-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const s = this.document.system;
    return Object.assign(ctx, {
      tipos: Object.fromEntries(Object.entries(TIPOS_COMUNIDAD).map(([k, t]) => [k, t.nombre])),
      tipo: TIPOS_COMUNIDAD[s.tipo],
      preguntas: Object.entries(PREGUNTAS_COMUNIDAD).map(([clave, p]) => ({ clave, ...p, valor: s[clave] }))
    });
  }

  /** Una sugerencia se añade a lo escrito, no lo sustituye. */
  static #sugerencia(event, boton) {
    const { clave, texto } = boton.dataset;
    const actual = this.document.system[clave].trim();
    this.document.update({ [`system.${clave}`]: actual ? `${actual} ${texto}` : texto });
  }
}

export class HojaPnj extends HojaER {
  static DEFAULT_OPTIONS = {
    classes: ["er-pnj"],
    position: { width: 600, height: 620 },
    window: { icon: "fa-solid fa-user-secret" }
  };

  static SECCIONES = { diario: true };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/pnj.hbs`, scrollable: [".er-principal"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    return Object.assign(ctx, {
      estados: Object.fromEntries(Object.entries(ESTADOS_VIOLENCIA).map(([k, e]) => [k, e.nombre])),
      estadoViolencia: ESTADOS_VIOLENCIA[this.document.system.estado]
    });
  }
}
