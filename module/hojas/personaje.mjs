/**
 * Hoja de personaje. A la izquierda, siempre visible, lo que se usa en cada
 * escena: atributos (clic = tirada), Estrés y Fichas de Caos. A la derecha, lo
 * que se interpreta: Marcas, Vínculos, relaciones, objeto y pregunta incómoda.
 * En modo compacto queda solo la columna izquierda con un resumen.
 */
import { HojaER } from "./base.mjs";
import { DialogV2 } from "../compat.mjs";
import { RUTA, estado } from "../mesa.mjs";
import { signo } from "../actor.mjs";
import { valorPorCasilla, puedeGastar, repartoPendiente } from "../reglas.mjs";
import { ATRIBUTOS, LISTAS, GASTOS_CAOS, ROLES_REFUGIO, DESTINOS } from "../listas.mjs";

const OBJETO_POR_DEFECTO = `${RUTA}/assets/iconos/objeto.webp`;
const casillas = ({ value, max }) => Array.from({ length: max }, (_, i) => ({ n: i + 1, llena: i < value }));

export class HojaPersonaje extends HojaER {
  static DEFAULT_OPTIONS = {
    classes: ["er-personaje"],
    position: { width: 920, height: 760 },
    window: { icon: "fa-solid fa-person-walking" },
    actions: {
      tirar: HojaPersonaje.#tirar,
      ayuda: HojaPersonaje.#ayuda,
      estres: HojaPersonaje.#estres,
      caos: HojaPersonaje.#caos,
      ganarEstres: HojaPersonaje.#ganarEstres,
      ganarCaos: HojaPersonaje.#ganarCaos,
      gastarCaos: HojaPersonaje.#gastarCaos,
      crisis: HojaPersonaje.#crisis,
      interpretar: HojaPersonaje.#interpretar,
      suprimir: HojaPersonaje.#suprimir,
      empeorar: HojaPersonaje.#empeorar,
      revelar: HojaPersonaje.#revelar,
      recuperar: HojaPersonaje.#recuperar,
      asistente: HojaPersonaje.#asistente
    }
  };

  static COMPACTO = { width: 310, height: 760 };
  static SECCIONES = { marcas: true, vinculos: true, historia: true, diario: false };

  static PARTS = {
    hoja: { template: `${RUTA}/templates/hojas/personaje.hbs`, scrollable: [".er-principal", ".er-lateral"] }
  };

  /** «Ayudo a mi Vínculo Positivo»: +1 a la próxima tirada y se apaga sola. */
  ayudando = false;

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const actor = this.document;
    const s = actor.system;
    const propio = actor.isOwner;
    const marcas = s.marcas.map((m, i) => ({ ...m, i }));
    const vinculo = clave => {
      const v = s.vinculos[clave];
      const otro = HojaER.resolver(v);
      return { ...v, clave, img: otro?.img, uuidOtro: otro?.uuid };
    };
    const refugios = game.actors.filter(a => a.type === "refugio");
    const cargas = refugios.flatMap(r => Object.entries(r.system.roles)
      .filter(([, uuid]) => uuid === actor.uuid)
      .map(([rol]) => ({ ...ROLES_REFUGIO[rol], refugio: r.name })));
    const estadoMesa = estado();

    return Object.assign(ctx, {
      atributos: Object.entries(ATRIBUTOS).map(([clave, a]) => ({ clave, ...a, valor: s.atributos[clave], signo: signo(s.atributos[clave]) })),
      opcionesAtributo: [3, 2, 1, 0, -1, -2, -3].map(v => ({ v, etiqueta: signo(v) })),
      repartoPendiente: repartoPendiente(s.atributos).map(signo).join(", "),
      estres: casillas(s.estres),
      caos: casillas(s.caos),
      ayudando: this.ayudando,
      marcas,
      positivo: vinculo("positivo"),
      negativo: vinculo("negativo"),
      pregunta: { ...s.pregunta, visible: propio || s.pregunta.revelada },
      cargas,
      destino: s.destino ? DESTINOS[s.destino].nombre : "",
      destinos: DESTINOS,
      esVoz: estadoMesa.voz === actor.uuid,
      escenaRefugio: Boolean(estadoMesa.refugio) && propio && !actor.recuperadoEnEscena,
      otros: game.actors.filter(a => a.type === "personaje" && a.id !== actor.id).map(a => a.nombreCorto),
      listas: LISTAS,
      gastos: Object.entries(GASTOS_CAOS).map(([clave, g]) => ({ clave, ...g, posible: puedeGastar(s.caos.value, clave) })),
      objetoImg: s.objeto.img || OBJETO_POR_DEFECTO
    });
  }

  /** La imagen de relleno del objeto no se guarda como si la hubiera elegido alguien. */
  _processFormData(event, form, formData) {
    const datos = super._processFormData(event, form, formData);
    if (datos.system?.objeto?.img === OBJETO_POR_DEFECTO) datos.system.objeto.img = "";
    return datos;
  }

  static #tirar(event, boton) {
    const vinculo = this.ayudando;
    this.ayudando = false;
    this.document.tirar(boton.dataset.atributo, { vinculo });
    if (vinculo) this.render();
  }

  static #ayuda() {
    this.ayudando = !this.ayudando;
    this.render();
  }

  static #estres(event, boton) {
    this.document.fijarEstres(valorPorCasilla(this.document.system.estres.value, Number(boton.dataset.n)));
  }

  /** Clic en una ficha: corrección silenciosa del contador (sin tarjeta de chat). */
  static #caos(event, boton) {
    const valor = valorPorCasilla(this.document.system.caos.value, Number(boton.dataset.n));
    this.document.update({ "system.caos.value": valor });
  }

  static #ganarEstres(event, boton) {
    this.cajonAbierto = null;
    this.document.ganarEstres(1, boton.dataset.texto);
  }

  static #ganarCaos(event, boton) {
    this.cajonAbierto = null;
    this.document.ganarCaos(boton.dataset.texto);
  }

  static #gastarCaos(event, boton) {
    const detalle = this.element.querySelector("[data-detalle-caos]")?.value ?? "";
    this.cajonAbierto = null;
    this.document.gastarCaos(boton.dataset.gasto, detalle);
  }

  static #crisis() {
    game.mrEntreRuinas.dialogos.crisis(this.document);
  }

  static #interpretar(event, boton) {
    this.document.interpretarMarca(Number(boton.dataset.indice));
  }

  static #suprimir(event, boton) {
    const i = Number(boton.dataset.indice);
    const marcas = this.document.system.toObject().marcas;
    marcas[i].suprimida = !marcas[i].suprimida;
    this.document.update({ "system.marcas": marcas });
  }

  static #empeorar() {
    const quien = this.document.system.vinculos.negativo.quien;
    this.document.ganarCaos(`Empeora deliberadamente la vida de su Vínculo Negativo${quien ? ` (${quien})` : ""}.`);
  }

  static async #revelar() {
    const ok = await DialogV2.confirm({
      window: { title: "Revelar la pregunta incómoda" },
      content: "<p>La respuesta se publicará en el chat y quedará visible en tu hoja para toda la mesa.</p>",
      classes: ["mr-entre-ruinas", "er-dialogo"]
    });
    if (ok) this.document.revelarPregunta();
  }

  static #recuperar() {
    game.mrEntreRuinas.dialogos.recuperar(this.document);
  }

  static #asistente() {
    game.mrEntreRuinas.abrirAsistente(this.document);
  }
}
