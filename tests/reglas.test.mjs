import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/reglas.mjs";
import { LISTAS, GASTOS_CAOS, VALORES_REFUGIO, ORACULOS, TIPOS_REFUGIO } from "../module/listas.mjs";

test("M 7.2: bandas de resultado", () => {
  assert.equal(R.resultado(12), "limpio");
  assert.equal(R.resultado(10), "limpio");
  assert.equal(R.resultado(9), "coste");
  assert.equal(R.resultado(7), "coste");
  assert.equal(R.resultado(6), "fallo");
  assert.equal(R.resultado(-1), "fallo");
});

test("M 5.2: el reparto es +2, +1, +1 y 0", () => {
  assert.ok(R.repartoValido({ violencia: 1, coco: 2, labia: 0, aguante: 1 }));
  assert.ok(!R.repartoValido({ violencia: 2, coco: 2, labia: 0, aguante: 0 }));
  assert.ok(!R.repartoValido({ violencia: 0, coco: 0, labia: 0, aguante: 0 }));
  assert.deepEqual(R.repartoPendiente({ violencia: 2, coco: 0, labia: 0, aguante: 0 }), [1, 1]);
});

test("M 8: el Estrés topa en 5 y la Crisis solo salta al llenarlo", () => {
  assert.deepEqual(R.sumarEstres(3, 1), { valor: 4, crisis: false });
  assert.deepEqual(R.sumarEstres(4, 1), { valor: 5, crisis: true });
  assert.deepEqual(R.sumarEstres(5, 1), { valor: 5, crisis: false });
  assert.deepEqual(R.sumarEstres(0, -2), { valor: 0, crisis: false });
  assert.deepEqual(R.sumarEstres(5, 1, 6), { valor: 6, crisis: true }, "el refugio tiene 6 espacios");
});

test("casillas: clic en la última marcada la desmarca", () => {
  assert.equal(R.valorPorCasilla(3, 3), 2);
  assert.equal(R.valorPorCasilla(3, 5), 5);
  assert.equal(R.valorPorCasilla(0, 1), 1);
});

test("M 9: Fichas de Caos, costes y tope de 5", () => {
  assert.equal(GASTOS_CAOS.detalle.coste, 1);
  assert.equal(GASTOS_CAOS.flashback.coste, 1);
  assert.equal(GASTOS_CAOS.giro.coste, 2);
  assert.equal(GASTOS_CAOS.alterar.coste, 3);
  assert.ok(R.puedeGastar(2, "giro"));
  assert.ok(!R.puedeGastar(2, "alterar"));
  assert.ok(!R.puedeGastar(9, "inexistente"));
  assert.equal(R.ganarCaos(5), 5);
  assert.equal(R.ganarCaos(2), 3);
});

test("R 2: umbrales del refugio solo al llegar", () => {
  assert.equal(R.umbralRefugio("seguridad", 1, 0), VALORES_REFUGIO.seguridad.efecto);
  assert.equal(R.umbralRefugio("ruido", 4, 5), VALORES_REFUGIO.ruido.efecto);
  assert.equal(R.umbralRefugio("ruido", 1, 0), null, "el Ruido a 0 no es malo");
  assert.equal(R.umbralRefugio("moral", 0, 0), null);
  assert.equal(R.limitarValorRefugio(9), 5);
  assert.equal(R.limitarValorRefugio(-1), 0);
});

test("M 15: seis episodios por temporada", () => {
  assert.deepEqual(R.siguienteEpisodio({ temporada: 1, episodio: 5 }), { temporada: 1, episodio: 6, nuevaTemporada: false });
  assert.deepEqual(R.siguienteEpisodio({ temporada: 1, episodio: 6 }), { temporada: 2, episodio: 1, nuevaTemporada: true });
});

test("la Voz rota hacia quien aún no lo ha sido", () => {
  const mesa = ["a", "b", "c", "d"];
  assert.equal(R.sugerirVoz(mesa, "a", ["a"]), "b");
  assert.equal(R.sugerirVoz(mesa, "b", ["a", "b", "c"]), "d");
  assert.equal(R.sugerirVoz(mesa, "d", ["a", "b", "c", "d"]), "a", "todos lo fueron: el siguiente");
  assert.equal(R.sugerirVoz(mesa, "", []), "a");
  assert.equal(R.sugerirVoz([], "a"), null);
});

test("vínculos escritos a mano encuentran su Actor por nombre o apodo", () => {
  assert.ok(R.coincideNombre("Lucía “Luz” Romero", "Luz"));
  assert.ok(R.coincideNombre("Marta Vidal", "marta"));
  assert.ok(R.coincideNombre("Iván Ortega", "Iván Ortega"));
  assert.ok(!R.coincideNombre("Marta Vidal", "Vidal"));
  assert.ok(!R.coincideNombre("Marta Vidal", ""));
});

test("el contenido de los libros está completo", () => {
  const tamanos = {
    consecuencias: 8, movimientosDuros: 14, marcasIniciales: 8, preguntasPersonaje: 6, crisis: 7,
    movimientosComunidad: 11, marcasRefugio: 10, estresRefugio: 10, rumores: 8, transmisiones: 8,
    escenasIniciales: 8, preguntasCampana: 8, preguntasRefugio: 10, complicacionesExpedicion: 10, eventosTemporada: 10
  };
  for (const [clave, n] of Object.entries(tamanos)) assert.equal(LISTAS[clave].items.length, n, clave);
  assert.equal(Object.keys(TIPOS_REFUGIO).length, 8);
  for (const g of ORACULOS) for (const l of g.listas) assert.ok(LISTAS[l], `oráculo ${l}`);
  assert.equal(R.alAzar(["x", "y"], () => 0.99), "y");
});
