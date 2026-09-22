/**
 * Modelos de datos. Sin template.json: cada tipo declara su esquema aquí.
 */
import { MAX_ESTRES, MAX_CAOS, CAOS_INICIAL, MAX_ESTRES_REFUGIO, repartoValido } from "./reglas.mjs";
import { ROLES_REFUGIO, VALORES_REFUGIO, TIPOS_REFUGIO, LIDERAZGOS, TIPOS_COMUNIDAD, ESTADOS_VIOLENCIA, DESTINOS } from "./listas.mjs";

const { StringField, NumberField, BooleanField, HTMLField, SchemaField, ArrayField, FilePathField } = foundry.data.fields;

const texto = (initial = "") => new StringField({ required: true, blank: true, initial });
const entero = (initial, min, max) => new NumberField({ required: true, nullable: false, integer: true, initial, min, max });
const pista = (max, initial = 0) => new SchemaField({ value: entero(initial, 0, max), max: entero(max, max, max) });
const eleccion = (opciones, initial) => new StringField({ required: true, blank: true, initial, choices: Object.keys(opciones) });

/** Un vínculo o relación: a quién (texto y, si se enlaza, el uuid del Actor) y por qué. */
const vinculo = () => new SchemaField({ quien: texto(), uuid: texto(), motivo: texto() });

export class PersonajeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      concepto: texto(),
      frase: texto(),
      atributos: new SchemaField({
        violencia: entero(0, -3, 3),
        coco: entero(0, -3, 3),
        labia: entero(0, -3, 3),
        aguante: entero(0, -3, 3)
      }),
      estres: pista(MAX_ESTRES),
      caos: pista(MAX_CAOS, CAOS_INICIAL),
      marcas: new ArrayField(new SchemaField({
        texto: texto(),
        permanente: new BooleanField({ initial: false }),
        suprimida: new BooleanField({ initial: false })
      })),
      relaciones: new SchemaField({ izquierda: vinculo(), derecha: vinculo() }),
      vinculos: new SchemaField({ positivo: vinculo(), negativo: vinculo() }),
      objeto: new SchemaField({ nombre: texto(), historia: texto(), img: new FilePathField({ categories: ["IMAGE"], blank: true, initial: "" }) }),
      pregunta: new SchemaField({ texto: texto(), respuesta: texto(), revelada: new BooleanField({ initial: false }) }),
      destino: eleccion(DESTINOS, ""),
      notas: new HTMLField({ required: true, blank: true })
    };
  }

  prepareDerivedData() {
    this.enCrisis = this.estres.value >= this.estres.max;
    this.repartoValido = repartoValido(this.atributos);
  }
}

export class PnjData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      concepto: texto(),
      estado: eleccion(ESTADOS_VIOLENCIA, "ninguno"),
      recuperacion: new BooleanField({ initial: false }),
      quiere: texto(),
      oculta: texto(),
      notas: new HTMLField({ required: true, blank: true })
    };
  }
}

export class RefugioData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      tipo: eleccion(TIPOS_REFUGIO, ""),
      sustento: texto(),
      secreto: texto(),
      secretoRevelado: new BooleanField({ initial: false }),
      miedo: texto(),
      liderazgo: eleccion(LIDERAZGOS, ""),
      valores: new SchemaField(Object.fromEntries(Object.keys(VALORES_REFUGIO).map(k => [k, entero(2, 0, 5)]))),
      estres: pista(MAX_ESTRES_REFUGIO),
      marcas: new ArrayField(new SchemaField({ texto: texto() })),
      relojes: new ArrayField(new SchemaField({
        nombre: texto(),
        segmentos: entero(6, 2, 12),
        marcados: entero(0, 0, 12)
      })),
      roles: new SchemaField(Object.fromEntries(Object.keys(ROLES_REFUGIO).map(k => [k, texto()]))),
      notas: new HTMLField({ required: true, blank: true })
    };
  }

  prepareDerivedData() {
    this.enCrisis = this.estres.value >= this.estres.max;
    for (const r of this.relojes) r.marcados = Math.min(r.marcados, r.segmentos);
  }
}

export class ComunidadData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      tipo: eleccion(TIPOS_COMUNIDAD, ""),
      necesita: texto(),
      teme: texto(),
      sacrifica: texto(),
      oculta: texto(),
      notas: new HTMLField({ required: true, blank: true })
    };
  }
}

export const MODELOS = { personaje: PersonajeData, pnj: PnjData, refugio: RefugioData, comunidad: ComunidadData };
