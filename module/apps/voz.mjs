/**
 * Panel de la Voz: la mesa de quien narra esta noche.
 * Cabecera fija con episodio, Voz y fase; debajo, tres pestañas:
 * Episodio (preparación y ritmo), Consecuencias (7–9 y Movimientos Duros)
 * y Oráculos (todas las tablas de los tres libros, con tirada al azar).
 * Lo puede abrir cualquiera: la Voz rota y todos deben poder consultarlo.
 */
import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { ConMemoria } from "../memoria.mjs";
import { RUTA, estado, cambiarEstado, personajes } from "../mesa.mjs";
import { FASES, LISTAS, ORACULOS, ESCENARIOS } from "../listas.mjs";
import { alAzar } from "../reglas.mjs";
import { publicar, oraculo } from "../chat.mjs";
import * as episodio from "../episodio.mjs";

export class PanelVoz extends ConMemoria(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORIA = "panel-voz";
  static SCROLL_MEMORIA = [".er-principal"];

  static DEFAULT_OPTIONS = {
    id: "mr-er-voz",
    classes: ["mr-entre-ruinas", "er-voz"],
    tag: "form",
    position: { width: 480, height: 780 },
    window: { title: "Panel de la Voz", icon: "fa-solid fa-microphone-lines", resizable: true },
    form: { handler: PanelVoz.#guardar, submitOnChange: true },
    actions: {
      fase: PanelVoz.#fase,
      siguienteFase: () => episodio.siguienteFase(),
      corte: () => episodio.corte(),
      refugio: PanelVoz.#refugio,
      fin: () => game.mrEntreRuinas.dialogos.finEpisodio(),
      azar: PanelVoz.#azar,
      oraculo: PanelVoz.#oraculo,
      consecuencia: PanelVoz.#consecuencia,
      escenario: PanelVoz.#escenario
    }
  };

  static PARTS = {
    panel: { template: `${RUTA}/templates/apps/voz.hbs`, scrollable: [".er-principal"] }
  };

  static TABS = {
    voz: {
      initial: "episodio",
      tabs: [
        { id: "episodio", label: "Episodio", icon: "fa-solid fa-clapperboard" },
        { id: "consecuencias", label: "Consecuencias", icon: "fa-solid fa-scale-unbalanced" },
        { id: "oraculos", label: "Oráculos", icon: "fa-solid fa-radio" }
      ]
    }
  };

  static abrir() {
    const abierto = foundry.applications.instances.get("mr-er-voz");
    return (abierto ?? new PanelVoz()).render({ force: true });
  }

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    const e = estado();
    const orden = Object.keys(FASES);
    const actual = orden.indexOf(e.fase);
    const voz = e.voz ? fromUuidSync(e.voz) : null;
    const lista = clave => ({ clave, ...LISTAS[clave], abierta: this.abierto(`lista-${clave}`, false) });
    return Object.assign(ctx, {
      e,
      voz,
      candidatos: personajes().map(a => ({ uuid: a.uuid, nombre: a.name, yaFue: a.uuid !== e.voz && e.vocesTemporada.includes(a.uuid) })),
      fases: orden.map((clave, i) => ({ clave, ...FASES[clave], activa: i === actual, hecha: i < actual })),
      faseActual: FASES[e.fase],
      ultimaFase: e.fase === "cliffhanger",
      finTemporada: e.episodio >= 6,
      preparacion: [
        { campo: "lugar", titulo: "Lugar", lista: "lugares", valor: e.lugar },
        { campo: "problema", titulo: "Problema", lista: "problemas", valor: e.problema },
        { campo: "amenaza", titulo: "Amenaza", lista: "amenazas", valor: e.amenaza },
        { campo: "pregunta", titulo: "Pregunta incómoda", lista: "preguntasSesion", valor: e.pregunta }
      ],
      escenarios: ESCENARIOS.map((s, i) => ({ ...s, i })),
      consecuencias: lista("consecuencias"),
      duros: lista("movimientosDuros"),
      puede: lista("vozPuede"),
      noPuede: lista("vozNoPuede"),
      oraculos: ORACULOS.map(g => ({ ...g, abierto: this.abierto(`oraculo-${g.id}`, g.id === "episodio"), listas: g.listas.map(lista) })),
      seccionReglas: this.abierto("reglas-voz", false),
      escenaRefugio: Boolean(e.refugio)
    });
  }

  /** Los campos de preparación y el cliffhanger se guardan al salir de la casilla. */
  static async #guardar(event, form, datos) {
    const cambios = foundry.utils.expandObject(datos.object);
    const e = estado();
    const utiles = Object.fromEntries(Object.entries(cambios).filter(([k, v]) => k in e && e[k] !== v && typeof v === "string"));
    if (Object.keys(utiles).length) await cambiarEstado(utiles);
    if ("vozElegida" in cambios && cambios.vozElegida !== e.voz) await episodio.nombrarVoz(cambios.vozElegida);
  }

  static #fase(event, boton) {
    episodio.cambiarFase(boton.dataset.fase);
  }

  static #refugio() {
    return estado().refugio ? episodio.cerrarEscenaRefugio() : episodio.abrirEscenaRefugio();
  }

  /** Dado junto a una casilla de preparación: rellena con un ejemplo del libro. */
  static #azar(event, boton) {
    cambiarEstado({ [boton.dataset.campo]: alAzar(LISTAS[boton.dataset.lista].items) });
  }

  /** Clic en un elemento: lo publica tal cual. Clic en el dado del grupo: uno al azar. */
  static #oraculo(event, boton) {
    oraculo(boton.dataset.lista, boton.dataset.texto || undefined);
  }

  static #consecuencia(event, boton) {
    const duro = boton.dataset.duro === "true";
    publicar({
      tipo: duro ? "movimiento" : "consecuencia", tono: duro ? "fallo" : "coste",
      icono: duro ? "fa-solid fa-bolt" : "fa-solid fa-scale-unbalanced",
      etiqueta: duro ? "Movimiento Duro" : "La Voz elige", titulo: boton.dataset.texto || alAzar(LISTAS[duro ? "movimientosDuros" : "consecuencias"].items)
    });
  }

  /** V 36–38: vuelca un escenario listo en la preparación. */
  static #escenario(event, boton) {
    const s = ESCENARIOS[Number(boton.dataset.indice)];
    cambiarEstado({ lugar: s.titulo, problema: s.situacion, pregunta: s.pregunta });
  }
}
