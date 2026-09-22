/**
 * Reglas puras: sin Foundry, para poder probarlas con `node --test`.
 */
import { REPARTO, GASTOS_CAOS, VALORES_REFUGIO } from "./listas.mjs";

export const MAX_ESTRES = 5;
export const MAX_CAOS = 5;
export const CAOS_INICIAL = 2;
export const MAX_ESTRES_REFUGIO = 6;
export const EPISODIOS_POR_TEMPORADA = 6;

/** M 7.2: 10+ limpio, 7–9 con coste, 6 o menos fallo. */
export function resultado(total) {
  if (total >= 10) return "limpio";
  if (total >= 7) return "coste";
  return "fallo";
}

/** M 5.2: el reparto es válido si usa exactamente +2, +1, +1 y 0. */
export function repartoValido(atributos) {
  const valores = Object.values(atributos ?? {}).map(Number).sort((a, b) => b - a);
  return valores.length === REPARTO.length && valores.every((v, i) => v === REPARTO[i]);
}

/** Valores del reparto que aún no se han asignado (para guiar la creación). */
export function repartoPendiente(atributos) {
  const pendientes = [...REPARTO];
  for (const v of Object.values(atributos ?? {})) {
    const i = pendientes.indexOf(Number(v));
    if (i >= 0) pendientes.splice(i, 1);
  }
  return pendientes;
}

/**
 * Suma Estrés con tope. Al llenar los espacios hay Crisis (M 8.2); el Estrés
 * se queda lleno hasta que el jugador la resuelva.
 */
export function sumarEstres(actual, cantidad, max = MAX_ESTRES) {
  const valor = Math.max(0, Math.min(max, Number(actual) + Number(cantidad)));
  return { valor, crisis: valor >= max && Number(actual) < max };
}

/** Clic en la casilla N: marca hasta N, o desmarca N si ya era la última. */
export function valorPorCasilla(actual, n) {
  return n === actual ? n - 1 : n;
}

export function costeCaos(tipo) {
  return GASTOS_CAOS[tipo]?.coste ?? Infinity;
}

export function puedeGastar(fichas, tipo) {
  return Number(fichas) >= costeCaos(tipo);
}

export function ganarCaos(fichas, cantidad = 1, max = MAX_CAOS) {
  return Math.max(0, Math.min(max, Number(fichas) + cantidad));
}

/**
 * R 2: devuelve el efecto de umbral si el cambio de `antes` a `despues` lo cruza.
 * Solo se avisa al llegar, no al quedarse en el valor crítico.
 */
export function umbralRefugio(clave, antes, despues) {
  const valor = VALORES_REFUGIO[clave];
  if (!valor || antes === despues) return null;
  return despues === valor.critico ? valor.efecto : null;
}

export function limitarValorRefugio(v) {
  return Math.max(0, Math.min(5, Math.round(Number(v) || 0)));
}

/** Avance de episodio: al pasar del sexto empieza una temporada nueva (M 15). */
export function siguienteEpisodio({ temporada = 1, episodio = 1 } = {}) {
  if (episodio >= EPISODIOS_POR_TEMPORADA) return { temporada: temporada + 1, episodio: 1, nuevaTemporada: true };
  return { temporada, episodio: episodio + 1, nuevaTemporada: false };
}

/**
 * La Voz rota (M 10.1): se sugiere al siguiente en la mesa que aún no haya sido
 * la Voz esta temporada; si ya lo fueron todos, simplemente al siguiente.
 */
export function sugerirVoz(orden, actual, yaFueron = []) {
  if (!orden.length) return null;
  const i = orden.indexOf(actual);
  const rotado = [...orden.slice(i + 1), ...orden.slice(0, i + 1)];
  return rotado.find(u => u !== actual && !yaFueron.includes(u)) ?? rotado[0];
}

/** Elemento al azar de una lista; `azar` inyectable para los tests. */
export function alAzar(lista, azar = Math.random) {
  return lista.length ? lista[Math.floor(azar() * lista.length)] : null;
}

/** Nombre corto para casar vínculos escritos a mano con Actores: «Lucía “Luz” Romero» → Luz. */
export function coincideNombre(nombreActor, quien) {
  const q = String(quien ?? "").trim().toLocaleLowerCase("es");
  if (!q) return false;
  const n = String(nombreActor ?? "").toLocaleLowerCase("es");
  if (n === q) return true;
  const apodo = /["“«']([^"”»']+)["”»']/.exec(n)?.[1];
  if (apodo === q) return true;
  return n.split(/\s+/)[0] === q;
}
