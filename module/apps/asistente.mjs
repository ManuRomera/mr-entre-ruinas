/**
 * Asistente de creación (M 5–6): los seis pasos del manual y los dos vínculos en
 * una sola ventana. Cada paso trae los ejemplos del libro como chips y un dado.
 * El reparto de atributos se valida mientras se elige.
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { RUTA } from "../mesa.mjs";
import { ATRIBUTOS, LISTAS, REPARTO } from "../listas.mjs";
import { repartoValido, repartoPendiente, alAzar } from "../reglas.mjs";
import { signo } from "../actor.mjs";

export class Asistente extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORIA = "asistente";
  static SCROLL_MEMORIA = [".er-principal"];

  static DEFAULT_OPTIONS = {
    classes: ["mr-entre-ruinas", "er-asistente"],
    tag: "form",
    position: { width: 760, height: 820 },
    window: { icon: "fa-solid fa-person-circle-plus", resizable: true },
    form: { handler: Asistente.#guardar, closeOnSubmit: true },
    actions: { azar: Asistente.#azar, repartoAzar: Asistente.#repartoAzar }
  };

  static PARTS = {
    asistente: { template: `${RUTA}/templates/apps/asistente.hbs`, scrollable: [".er-principal"] }
  };

  static abrir(actor) {
    const id = `mr-er-asistente-${actor.id}`;
    return (foundry.applications.instances.get(id) ?? new Asistente({ id, actor })).render({ force: true });
  }

  get actor() {
    return this.options.actor;
  }

  get title() {
    return `Crear superviviente · ${this.actor.name}`;
  }

  async _prepareContext(options) {
    const s = this.actor.system;
    const inicial = s.marcas.find(m => !m.permanente);
    return {
      actor: this.actor,
      s,
      marcaInicial: inicial?.texto ?? "",
      atributos: Object.entries(ATRIBUTOS).map(([clave, a]) => ({
        clave, ...a, valor: s.atributos[clave],
        opciones: [2, 1, 0].map(v => ({ v, etiqueta: signo(v), elegido: s.atributos[clave] === v }))
      })),
      reparto: REPARTO.map(signo).join(", "),
      otros: game.actors.filter(a => a.type === "personaje" && a.id !== this.actor.id).map(a => a.nombreCorto),
      listas: LISTAS
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const raiz = this.element;
    // Chips: rellenan su casilla sin volver a pintar la ventana.
    for (const chip of raiz.querySelectorAll("[data-rellenar]")) {
      chip.addEventListener("click", () => {
        const campo = raiz.querySelector(`[name="${chip.dataset.rellenar}"]`);
        campo.value = chip.dataset.texto;
        campo.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    raiz.querySelector(".er-reparto")?.addEventListener("change", () => this.#comprobarReparto());
    this.#comprobarReparto();
  }

  #leerReparto() {
    const f = new FormData(this.element);
    return Object.fromEntries(Object.keys(ATRIBUTOS).map(k => [k, Number(f.get(`atributos.${k}`))]));
  }

  /** Semáforo del reparto en vivo: qué valores faltan por colocar. */
  #comprobarReparto() {
    const valores = this.#leerReparto();
    const ok = repartoValido(valores);
    const aviso = this.element.querySelector(".er-reparto-estado");
    if (!aviso) return;
    aviso.classList.toggle("valido", ok);
    aviso.textContent = ok ? "Reparto correcto." : `Falta colocar: ${repartoPendiente(valores).map(signo).join(", ")}.`;
  }

  static #azar(event, boton) {
    const campo = this.element.querySelector(`[name="${boton.dataset.campo}"]`);
    campo.value = alAzar(LISTAS[boton.dataset.lista].items);
  }

  static #repartoAzar() {
    const valores = [...REPARTO].sort(() => Math.random() - 0.5);
    Object.keys(ATRIBUTOS).forEach((k, i) => {
      const radio = this.element.querySelector(`[name="atributos.${k}"][value="${valores[i]}"]`);
      if (radio) radio.checked = true;
    });
    this.#comprobarReparto();
  }

  static async #guardar(event, form, datos) {
    const d = foundry.utils.expandObject(datos.object);
    const s = this.actor.system;
    const atributos = Object.fromEntries(Object.keys(ATRIBUTOS).map(k => [k, Number(d.atributos?.[k] ?? s.atributos[k])]));
    if (!repartoValido(atributos)) ui.notifications.warn("El reparto no es +2, +1, +1 y 0: se guarda igualmente, revísalo en la hoja.");
    // La Marca inicial sustituye a la anterior inicial; las permanentes se conservan.
    const marcas = s.toObject().marcas.filter(m => m.permanente);
    if (d.marca?.trim()) marcas.unshift({ texto: d.marca.trim(), permanente: false, suprimida: false });
    await this.actor.update({
      name: d.nombre?.trim() || this.actor.name,
      "system.concepto": d.concepto ?? "",
      "system.atributos": atributos,
      "system.marcas": marcas,
      "system.relaciones": d.relaciones,
      "system.objeto.nombre": d.objeto?.nombre ?? "",
      "system.objeto.historia": d.objeto?.historia ?? "",
      "system.pregunta.texto": d.pregunta?.texto ?? "",
      "system.pregunta.respuesta": d.pregunta?.respuesta ?? "",
      "system.vinculos.positivo.quien": d.vinculos?.positivo?.quien ?? "",
      "system.vinculos.positivo.motivo": d.vinculos?.positivo?.motivo ?? "",
      "system.vinculos.negativo.quien": d.vinculos?.negativo?.quien ?? "",
      "system.vinculos.negativo.motivo": d.vinculos?.negativo?.motivo ?? "",
      "system.frase": d.frase ?? ""
    });
    this.actor.sheet.render(true);
  }
}
