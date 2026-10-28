
import {
  buscarSenas,
  type SenaLSC,
} from "./lscLibrary";

export type ResultadoVozBiblioteca = {
  sena: SenaLSC;
  tieneRecursoVisual: boolean;
  pendienteDeValidacion: boolean;
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .replace(/[¿?¡!.,;:()[\]{}"'“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function esCoincidenciaRelevante(
  consulta: string,
  sena: SenalLSC
): boolean {
  const textoConsulta = normalizar(consulta);

  const variantes = [
    sena.concepto,
    ...sena.palabrasRelacionadas,
  ];

  const consultaDelimitada = ` ${textoConsulta} `;

  return variantes.some((variante) => {
    const textoVariante = normalizar(variante);

    if (!textoVariante) {
      return false;
    }

    const varianteDelimitada = ` ${textoVariante} `;

    return consultaDelimitada.includes(varianteDelimitada);
  });
}


export function buscarCoincidenciasDeVoz(
  transcripcion: string
): ResultadoVozBiblioteca[] {
  const consulta = transcripcion.trim();

  if (!consulta) return [];

  const consultaNormalizada = normalizar(consulta);

  const resultados = buscarSenas(consulta)
    .filter((sena) =>
      esCoincidenciaRelevante(consulta, sena)
    )
    .map((sena): ResultadoVozBiblioteca => ({
      sena,
      tieneRecursoVisual: Boolean(
        sena.video || sena.imagen || sena.animacion
      ),
      pendienteDeValidacion:
        sena.estado === "pendiente-validacion",
    }));

  function puntuacion(
    resultado: ResultadoVozBiblioteca
  ): number {
    const sena = resultado.sena;

    const variantes = [
      sena.concepto,
      ...sena.palabrasRelacionadas,
    ]
      .map((variante) => normalizar(variante))
      .filter(Boolean);

    const coincidenciaExacta = variantes.some(
      (variante) => variante === consultaNormalizada
    );

    const longitudMejorCoincidencia = variantes
      .filter((variante) =>
        (` ${consultaNormalizada} `).includes(
          ` ${variante} `
        )
      )
      .reduce(
        (mayor, variante) =>
          Math.max(mayor, variante.length),
        0
      );

    let puntos = longitudMejorCoincidencia;

    if (coincidenciaExacta) {
      puntos += 1000;
    }

    if (resultado.tieneRecursoVisual) {
      puntos += 100;
    }

    if (resultado.pendienteDeValidacion) {
      puntos -= 50;
    }

    return puntos;
  }

  return resultados.sort(
    (a, b) => puntuacion(b) - puntuacion(a)
  );
}

