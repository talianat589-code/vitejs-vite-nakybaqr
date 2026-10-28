
export type EstadoSena =
| "pendiente-validacion"
| "referencia-validada"
| "disponible-para-practica";

export type SenaLSC = {
  id: string;
  concepto: string;
  categoria: string;
  palabrasRelacionadas: string[];
  descripcion: string;
  estado: EstadoSena;
  imagen: string | null;
  video: string | null;
  animacion: string | null;
  tipoReconocimiento:
    | "estatico"
    | "movimiento"
    | "secuencia"
    | "pendiente";

  fuenteId?: string;

  variantes?: string[];

  regiones?: string[];

  contextos?: string[];

  ejemploUso?: string;

  validacionLinguistica?:
    | "pendiente"
    | "en-revision"
    | "validada";

  datosMovimiento?: boolean;

  datosEntrenamiento?: boolean;
};

export const bibliotecaLSC: SenaLSC[] = [
{
  id: "saludo-hola",
  concepto: "Hola",
  categoria: "Saludos",
  palabrasRelacionadas: ["hola", "saludar"],
  descripcion:
    "Concepto de saludo. Falta incorporar y validar la referencia visual correspondiente en LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
  fuenteId: undefined,

  variantes: [],

  regiones: [],

  contextos: [
    "saludo",
  ],

  ejemploUso:
    "Expresión utilizada para iniciar un saludo.",

  validacionLinguistica:
    "pendiente",

  datosMovimiento:
    false,

  datosEntrenamiento:
    false,
},
{
  id: "saludo-buenos-dias",
  concepto: "Buenos días",
  categoria: "Saludos",
  palabrasRelacionadas: [
    "buenos días",
    "buen día",
  ],
  descripcion:
    "Expresión de saludo. La forma y el uso en LSC deben verificarse con una referencia lingüística fiable.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "saludo-buenas-noches",
  concepto: "Buenas noches",
  categoria: "Saludos",
  palabrasRelacionadas: ["buenas noches"],
  descripcion:
    "Expresión relacionada con el saludo nocturno. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "cortesia-gracias",
  concepto: "Gracias",
  categoria: "Cortesía",
  palabrasRelacionadas: ["gracias", "agradecer"],
  descripcion:
    "Concepto de agradecimiento. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "cortesia-por-favor",
  concepto: "Por favor",
  categoria: "Cortesía",
  palabrasRelacionadas: ["por favor"],
  descripcion:
    "Expresión de cortesía. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "comunicacion-si",
  concepto: "Sí",
  categoria: "Respuestas",
  palabrasRelacionadas: ["sí", "claro", "afirmativo"],
  descripcion:
    "Respuesta afirmativa. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "comunicacion-no",
  concepto: "No",
  categoria: "Respuestas",
  palabrasRelacionadas: ["no", "negativo"],
  descripcion:
    "Respuesta negativa. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
{
  id: "comunicacion-como-estas",
  concepto: "¿Cómo estás?",
  categoria: "Conversación",
  palabrasRelacionadas: [
    "cómo estás",
    "como estas",
    "cómo te encuentras",
  ],
  descripcion:
    "Pregunta sobre el estado de una persona. Pendiente de referencia validada de LSC.",
  estado: "pendiente-validacion",
  imagen: null,
  video: null,
  animacion: null,
  tipoReconocimiento: "pendiente",
},
];

export function buscarSenas(
consulta: string
): SenaLSC[] {
const normalizar = (texto: string) =>
  texto
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const busqueda = normalizar(consulta);

if (!busqueda) {
  return [];
}

return bibliotecaLSC.filter((sena) => {
  const concepto = normalizar(sena.concepto);

  const palabras = sena.palabrasRelacionadas.map(
    normalizar
  );

  return (
    concepto.includes(busqueda) ||
    busqueda.includes(concepto) ||
    palabras.some(
      (palabra) =>
        palabra.includes(busqueda) ||
        busqueda.includes(palabra)
    )
  );
});
}

export function obtenerSenaPorId(
id: string
): SenaLSC | undefined {
return bibliotecaLSC.find(
  (sena) => sena.id === id
);
}
