/**
 * Base de todas las hojas: V2 + Handlebars + memoria de ventana.
 * Comportamiento común: candado de edición, cajones desplegables, imagen,
 * arrastrar un Actor sobre una casilla de vínculo, listas editables.
 */
import { ActorSheetV2, HandlebarsApplicationMixin, enriquecer } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { estado } from "../mesa.mjs";
import { coincideNombre } from "../reglas.mjs";

export class HojaER extends ConMemoria(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["mr-entre-ruinas", "er-hoja"],
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      editar: HojaER.#editar,
      compacto: HojaER.#compacto,
      cajon: HojaER.#cajon,
      abrir: HojaER.#abrir,
      anadirFila: HojaER.#anadirFila,
      quitarFila: HojaER.#quitarFila
    }
  };

  static SCROLL_MEMORIA = [".er-principal"];
  /** Secciones plegables de la hoja y si nacen abiertas. */
  static SECCIONES = {};

  /** Candado: los números y los borrados solo se tocan desbloqueando. */
  editando = false;
  /** Cajón desplegado ahora mismo (no se recuerda entre sesiones: es un gesto, no una preferencia). */
  cajonAbierto = null;

  get title() {
    return this.document.name;
  }

  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.document;
    return {
      ...base,
      actor,
      system: actor.system,
      editable: this.isEditable,
      editando: this.isEditable && this.editando,
      compacto: this.compacto,
      cajon: this.cajonAbierto,
      estado: estado(),
      notas: await enriquecer(actor.system.notas, actor),
      secciones: Object.fromEntries(Object.entries(this.constructor.SECCIONES).map(([id, def]) => [id, this.abierto(id, def)]))
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.classList.toggle("compacto", this.compacto);
    this.element.classList.toggle("editando", this.editando);
    // Un cajón recién abierto puede caer bajo el borde: se trae a la vista.
    if (this.cajonAbierto) this.element.querySelector(".er-cajon")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /** Busca el Actor de un vínculo: por uuid si está enlazado; si no, por nombre o apodo. */
  static resolver({ quien, uuid } = {}) {
    if (uuid) {
      const doc = fromUuidSync(uuid);
      if (doc) return doc;
    }
    return quien ? game.actors.find(a => coincideNombre(a.name, quien)) ?? null : null;
  }

  /** Si se reescribe a mano el nombre de un vínculo, deja de apuntar al Actor que tenía enlazado. */
  _processFormData(event, form, formData) {
    const datos = super._processFormData(event, form, formData);
    for (const grupo of ["vinculos", "relaciones"]) {
      for (const [clave, v] of Object.entries(datos.system?.[grupo] ?? {})) {
        const antes = this.document.system[grupo]?.[clave];
        if (antes?.uuid && v.quien !== undefined && v.quien !== antes.quien) v.uuid = "";
      }
    }
    return datos;
  }

  /** Soltar un Actor sobre [data-soltar="system.ruta"] rellena quién es y lo enlaza. */
  async _onDropActor(event, actor) {
    const destino = event.target.closest("[data-soltar]")?.dataset.soltar;
    if (!destino || !this.isEditable || actor.uuid === this.document.uuid) return null;
    await this.document.update({ [`${destino}.quien`]: actor.nombreCorto ?? actor.name, [`${destino}.uuid`]: actor.uuid });
    return actor;
  }

  static #editar() {
    this.editando = !this.editando;
    this.render();
  }

  static #compacto() {
    this.alternarCompacto();
  }

  static #cajon(event, boton) {
    this.cajonAbierto = this.cajonAbierto === boton.dataset.cajon ? null : boton.dataset.cajon;
    this.render();
  }

  static async #abrir(event, boton) {
    const doc = boton.dataset.uuid ? await fromUuid(boton.dataset.uuid) : null;
    doc?.sheet.render(true);
  }

  /** Añade una fila a una lista del sistema: data-lista="marcas", data-valores='{"texto":"…"}'. */
  static async #anadirFila(event, boton) {
    const ruta = `system.${boton.dataset.lista}`;
    const lista = foundry.utils.deepClone(foundry.utils.getProperty(this.document, ruta)) ?? [];
    const campo = boton.dataset.campo ?? "texto";
    const valores = boton.dataset.valores ? JSON.parse(boton.dataset.valores) : {};
    const escrito = this.element.querySelector(`[data-nueva="${boton.dataset.lista}"]`)?.value?.trim();
    // Una sugerencia pulsada manda; si no, lo que se haya escrito en la casilla de nueva fila.
    valores[campo] ??= boton.dataset.texto ?? escrito ?? "";
    lista.push(valores);
    this.cajonAbierto = null;
    await this.document.update({ [ruta]: lista });
  }

  static async #quitarFila(event, boton) {
    const ruta = `system.${boton.dataset.lista}`;
    const lista = foundry.utils.deepClone(foundry.utils.getProperty(this.document, ruta));
    lista.splice(Number(boton.dataset.indice), 1);
    await this.document.update({ [ruta]: lista });
  }
}
