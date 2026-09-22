/**
 * Estructura de episodio (M 13), escenas de refugio (M 14 · R 4) y temporadas (M 15 · R 7).
 */
import { estado, cambiarEstado, pedir, registrarOperacion, personajes } from "./mesa.mjs";
import { publicar } from "./chat.mjs";
import { FASES, LISTAS } from "./listas.mjs";
import { siguienteEpisodio, alAzar } from "./reglas.mjs";

const ORDEN = Object.keys(FASES);

const cabecera = () => {
  const e = estado();
  return `Temporada ${e.temporada} · Episodio ${e.episodio}`;
};

export async function cambiarFase(fase) {
  if (!FASES[fase]) return;
  const e = estado();
  // Al abrir el episodio se aplica lo que pesa desde el anterior: el hambre (R 2).
  if (fase === "cold" && e.fase === "preparacion") await pedir("inicioEpisodio", {});
  await cambiarEstado({ fase });
  await publicar({
    tipo: "fase", tono: "voz", icono: "fa-solid fa-microphone-lines",
    etiqueta: cabecera(), titulo: FASES[fase].titulo, texto: FASES[fase].texto,
    cita: fase === "cold" ? e.lugar || "" : fase === "cliffhanger" ? e.cliffhanger || "" : ""
  });
}

export function siguienteFase() {
  const i = ORDEN.indexOf(estado().fase);
  if (i < ORDEN.length - 1) return cambiarFase(ORDEN[i + 1]);
  return game.mrEntreRuinas.dialogos.finEpisodio();
}

/** M 13.2: cualquiera puede pedir «corte de escena». */
export function corte() {
  return publicar({ tipo: "corte", tono: "corte", icono: "fa-solid fa-scissors", etiqueta: cabecera(), titulo: "Corte de escena", alias: game.user.name });
}

export async function nombrarVoz(uuid) {
  const e = estado();
  const actor = uuid ? await fromUuid(uuid) : null;
  const voces = e.vocesTemporada.includes(uuid) || !uuid ? e.vocesTemporada : [...e.vocesTemporada, uuid];
  await cambiarEstado({ voz: uuid, vocesTemporada: voces });
  if (actor) {
    await publicar({
      tipo: "voz", tono: "voz", icono: "fa-solid fa-microphone-lines", img: actor.img,
      etiqueta: cabecera(), titulo: `Esta noche, la Voz es ${actor.nombreCorto}`,
      texto: "Abre escenas, mantiene el ritmo y lanza las consecuencias. Pero la historia pertenece a toda la mesa.",
      botones: [{ etiqueta: "Panel de la Voz", icono: "fa-solid fa-sliders", accion: "voz" }]
    }, { actor });
  }
}

export async function abrirEscenaRefugio() {
  await cambiarEstado({ refugio: foundry.utils.randomID() });
  const ideas = [alAzar(LISTAS.vidaRefugio.items), alAzar(LISTAS.vidaRefugio.items)];
  await publicar({
    tipo: "refugio", tono: "refugio", icono: "fa-solid fa-mug-hot",
    etiqueta: cabecera(), titulo: "Escena de refugio",
    texto: "Los personajes comen, descansan, hablan, recuerdan, ríen o discuten. Cada uno elige una forma de recuperarse.",
    cita: [...new Set(ideas)].join(" "),
    botones: [{ etiqueta: "Elegir mi recuperación", icono: "fa-solid fa-heart-pulse", accion: "recuperar" }]
  });
}

export const cerrarEscenaRefugio = () => cambiarEstado({ refugio: "" });

/**
 * Cierra el episodio: publica el cliffhanger, devuelve las Marcas suspendidas,
 * avanza el contador (temporada nueva tras el sexto) y pasa la Voz.
 */
export function finEpisodio({ cliffhanger = "", voz = "" } = {}) {
  return pedir("finEpisodio", { cliffhanger, voz });
}

registrarOperacion("inicioEpisodio", async () => {
  const hambrientos = game.actors.filter(a => a.type === "refugio" && a.system.valores.suministros === 0);
  if (!hambrientos.length) return;
  for (const actor of personajes()) await actor.ganarEstres(1, `Pasa hambre: los Suministros de ${hambrientos[0].name} están a 0.`);
});

registrarOperacion("finEpisodio", async ({ cliffhanger, voz }) => {
  const e = estado();
  for (const actor of game.actors.filter(a => a.type === "personaje" && a.system.marcas.some(m => m.suprimida))) {
    await actor.update({ "system.marcas": actor.system.toObject().marcas.map(m => ({ ...m, suprimida: false })) });
  }
  const sig = siguienteEpisodio(e);
  await publicar({
    tipo: "fin", tono: "voz", icono: "fa-solid fa-radio",
    etiqueta: `Temporada ${e.temporada} · Episodio ${e.episodio}`, titulo: "Fin del episodio",
    cita: String(cliffhanger ?? "").trim(),
    texto: sig.nuevaTemporada
      ? "Termina la temporada. El grupo cambia, las relaciones evolucionan, el refugio puede desaparecer. Y el mundo empeora un poco más."
      : "Podéis cambiar vuestros vínculos, romper relaciones, crear otras nuevas o revelar secretos."
  });
  await game.settings.set("mr-entre-ruinas", "estado", {
    ...e, temporada: sig.temporada, episodio: sig.episodio, fase: "preparacion",
    lugar: "", problema: "", amenaza: "", pregunta: "", cliffhanger: "", refugio: "",
    voz: "", vocesTemporada: sig.nuevaTemporada ? [] : e.vocesTemporada
  });
  const nueva = voz ? await fromUuid(voz) : null;
  if (nueva) await nombrarVoz(nueva.uuid);
});
