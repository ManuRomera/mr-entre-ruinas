/**
 * Compila los compendios a LevelDB.
 * - manual y pregenerados: desde _data/<pack>.json
 * - tablas: se generan desde module/listas.mjs, la misma fuente que usa el sistema.
 */
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { ClassicLevel } from "classic-level";
import { LISTAS } from "../module/listas.mjs";

const manifiesto = JSON.parse(await fs.readFile("system.json"));
const RAIZ = { JournalEntry: "journal", Actor: "actors", RollTable: "tables" };
const EMBEBIDOS = { JournalEntry: ["pages"], Actor: ["items", "effects"], RollTable: ["results"] };
const id = texto => createHash("sha1").update(texto).digest("hex").slice(0, 16);

/** Listas que son consulta, no tabla aleatoria. */
const SIN_TABLA = new Set(["vozPuede", "vozNoPuede", "ganarCaos", "causasEstres"]);
const CARPETAS = [
  { _id: id("carpeta-M"), name: "Manual de juego", prefijo: "M", sort: 100000, color: "#8a3324" },
  { _id: id("carpeta-V"), name: "Un Mundo Violento", prefijo: "V", sort: 200000, color: "#6b5a3a" },
  { _id: id("carpeta-R"), name: "Refugios", prefijo: "R", sort: 300000, color: "#4d5f58" }
];

function tablas() {
  const documents = Object.entries(LISTAS)
    .filter(([clave]) => !SIN_TABLA.has(clave))
    .map(([clave, lista], orden) => ({
      _id: id(`tabla-${clave}`),
      name: lista.titulo,
      description: `<p>${lista.origen}</p>`,
      img: "systems/mr-entre-ruinas/assets/iconos/objeto.webp",
      formula: `1d${lista.items.length}`,
      replacement: true,
      displayRoll: true,
      folder: CARPETAS.find(c => lista.origen.startsWith(c.prefijo))._id,
      sort: (orden + 1) * 1000,
      ownership: { default: 0 },
      flags: {},
      results: lista.items.map((texto, i) => ({
        _id: id(`resultado-${clave}-${i}`),
        type: "text",
        name: "",
        description: texto,
        weight: 1,
        range: [i + 1, i + 1],
        drawn: false,
        flags: {}
      }))
    }));
  const folders = CARPETAS.map(({ prefijo, ...c }) => ({ ...c, type: "RollTable", sorting: "m", folder: null, flags: {} }));
  return { folders, documents };
}

/**
 * Compilar con Foundry abierto destruye los packs: LevelDB recupera la base vacía.
 * Se comprueba antes de tocar nada.
 */
async function comprobarCerrados(packs) {
  const bloqueados = [];
  for (const pack of packs) {
    if (!(await fs.stat(pack.path).catch(() => null))) continue;
    const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
    try {
      await db.open();
      await db.close();
    } catch (error) {
      if ((error.cause?.code ?? error.code) === "LEVEL_LOCKED") bloqueados.push(pack.name);
      else throw error;
    }
  }
  if (bloqueados.length) {
    throw new Error(`Foundry tiene abiertos estos packs: ${bloqueados.join(", ")}.\nCierra el mundo (o Foundry) antes de compilar.`);
  }
}

await comprobarCerrados(manifiesto.packs);
await fs.mkdir("packs", { recursive: true });

for (const pack of manifiesto.packs) {
  const crudo = pack.name === "tablas" ? tablas() : JSON.parse(await fs.readFile(`_data/${pack.name}.json`));
  const carpetas = Array.isArray(crudo) ? [] : (crudo.folders ?? []);
  const documentos = Array.isArray(crudo) ? crudo : crudo.documents;
  const raiz = RAIZ[pack.type];
  await fs.rm(pack.path, { recursive: true, force: true });
  const db = new ClassicLevel(pack.path, { valueEncoding: "json" });
  for (const carpeta of carpetas) await db.put(`!folders!${carpeta._id}`, carpeta);
  for (const origen of documentos) {
    const doc = structuredClone(origen);
    for (const coleccion of EMBEBIDOS[pack.type] ?? []) {
      const filas = doc[coleccion];
      if (!Array.isArray(filas)) continue;
      // El padre guarda solo los ids; cada hijo va en su propia clave.
      doc[coleccion] = filas.map(f => f._id);
      for (const fila of filas) await db.put(`!${raiz}.${coleccion}!${doc._id}.${fila._id}`, fila);
    }
    await db.put(`!${raiz}!${doc._id}`, doc);
  }
  await db.close();
  console.log(`pack ${pack.name}: ${documentos.length} documentos${carpetas.length ? `, ${carpetas.length} carpetas` : ""}`);
}
