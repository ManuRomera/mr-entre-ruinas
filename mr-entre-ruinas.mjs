/**
 * MR- Entre Ruinas · punto de entrada.
 * Aquí solo se registran piezas y hooks; la lógica vive en `module/`.
 */
import { DocumentSheetConfig, anadirHerramienta, diagnostico, generacion, loadTemplates } from "./module/compat.mjs";
import { ID, RUTA, registrarAjustes, escucharSocket } from "./module/mesa.mjs";
import { MODELOS } from "./module/modelos.mjs";
import { ActorER } from "./module/actor.mjs";
import { HojaPersonaje } from "./module/hojas/personaje.mjs";
import { HojaRefugio } from "./module/hojas/refugio.mjs";
import { HojaComunidad, HojaPnj } from "./module/hojas/secundarias.mjs";
import { PanelVoz } from "./module/apps/voz.mjs";
import { Asistente } from "./module/apps/asistente.mjs";
import { dialogos } from "./module/apps/dialogos.mjs";
import { escucharChat, publicar, oraculo } from "./module/chat.mjs";
import * as episodio from "./module/episodio.mjs";

Hooks.once("init", () => {
  CONFIG.Actor.documentClass = ActorER;
  Object.assign(CONFIG.Actor.dataModels, MODELOS);
  CONFIG.Actor.trackableAttributes = {
    personaje: { bar: ["estres", "caos"], value: [] },
    refugio: { bar: ["estres"], value: [] }
  };
  // Sin combate ni iniciativa en el juego; la fórmula solo evita errores si alguien abre el tracker.
  CONFIG.Combat.initiative = { formula: "2d6", decimals: 0 };

  const hojas = { personaje: HojaPersonaje, refugio: HojaRefugio, comunidad: HojaComunidad, pnj: HojaPnj };
  for (const [tipo, Hoja] of Object.entries(hojas)) {
    DocumentSheetConfig.registerSheet(Actor, ID, Hoja, { types: [tipo], makeDefault: true, label: "MR- Entre Ruinas" });
  }

  registrarAjustes();
  loadTemplates([`${RUTA}/templates/partes/vinculo.hbs`, `${RUTA}/templates/partes/marcas.hbs`]);

  game.mrEntreRuinas = {
    abrirVoz: () => PanelVoz.abrir(),
    abrirAsistente: actor => Asistente.abrir(actor),
    dialogos,
    episodio,
    oraculo,
    publicar,
    diagnostico
  };
});

Hooks.once("ready", async () => {
  escucharSocket();
  escucharChat();
  console.info(`MR- Entre Ruinas ${game.system.version} · Foundry ${game.version} (generación ${generacion()})`);
  if (game.user.isGM) await bienvenida();
});

/** Una tarjeta de bienvenida por versión, solo para quien administra el mundo. */
async function bienvenida() {
  if (game.settings.get(ID, "bienvenida") === game.system.version) return;
  await game.settings.set(ID, "bienvenida", game.system.version);
  await publicar({
    tipo: "bienvenida", tono: "voz", icono: "fa-solid fa-radio", alias: "Entre Ruinas",
    etiqueta: `MR- Entre Ruinas ${game.system.version}`, titulo: "Sobrevivir no es lo mismo que seguir adelante",
    texto: "No hay director: cada sesión una persona distinta es la Voz. Abrid el Panel de la Voz, importad a los supervivientes pregenerados o cread los vuestros con el asistente.",
    botones: [
      { etiqueta: "Panel de la Voz", icono: "fa-solid fa-microphone-lines", accion: "voz" },
      { etiqueta: "Manual", icono: "fa-solid fa-book-open", accion: "manual" },
      { etiqueta: "Pregenerados", icono: "fa-solid fa-users", accion: "pregenerados" }
    ]
  });
}

/** Personaje nuevo: el asistente de creación se abre solo para quien lo creó. */
Hooks.on("createActor", (actor, opciones, userId) => {
  if (userId !== game.user.id || actor.type !== "personaje" || actor.system.concepto) return;
  if (game.settings.get(ID, "asistente")) Asistente.abrir(actor);
});

/** El estado de la mesa cambia: se repintan el panel y las hojas que lo muestran. */
Hooks.on("mrEntreRuinas.estado", () => {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof PanelVoz || app instanceof HojaPersonaje) app.render();
  }
});

/** Los roles del refugio se ven en la hoja del personaje: al cambiarlos, se repinta. */
Hooks.on("updateActor", actor => {
  if (actor.type !== "refugio") return;
  for (const app of foundry.applications.instances.values()) if (app instanceof HojaPersonaje) app.render();
});

/** Acceso directo en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  const raiz = html instanceof HTMLElement ? html : html[0];
  const acciones = raiz?.querySelector(".header-actions");
  if (!acciones || acciones.querySelector(".er-boton-voz")) return;
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "er-boton-voz";
  boton.innerHTML = `<i class="fa-solid fa-microphone-lines" inert></i><span>Panel de la Voz</span>`;
  boton.addEventListener("click", () => PanelVoz.abrir());
  acciones.append(boton);
});

/** Herramientas en la barra de tokens: panel y «corte de escena» a un clic. */
Hooks.on("getSceneControlButtons", controles => {
  anadirHerramienta(controles, "tokens", { name: "erVoz", title: "Panel de la Voz", icon: "fa-solid fa-microphone-lines", onChange: () => PanelVoz.abrir() });
  anadirHerramienta(controles, "tokens", { name: "erCorte", title: "Corte de escena", icon: "fa-solid fa-scissors", onChange: () => episodio.corte() });
});

