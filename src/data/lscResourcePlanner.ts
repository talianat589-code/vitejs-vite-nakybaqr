
import {
  bibliotecaLSC,
  type SenaLSC,
} from "./lscLibrary";

import {
  mediosLSC,
  diagnosticarMediaLSC,
  type MediaLSC,
} from "./lscMedia";

export type PlanRecursoLSC = {
  senaId: string;
  concepto: string;
  recursosEncontrados: number;
  recursosAptos: number;
  recursosPendientes: number;
  estado:
    | "sin-recursos"
    | "pendiente-validacion"
    | "listo-para-revision";
  detalles: string[];
};

function obtenerMediosDeSena(sena: SenaLSC): MediaLSC[] {
  return mediosLSC.filter(
    (media) => media.senaId === sena.id
  );
}

export function planificarRecursosLSC(
  sena: SenaLSC
): PlanRecursoLSC {
  const medios = obtenerMediosDeSena(sena);

  const diagnosticos = medios.map((media) =>
    diagnosticarMediaLSC(media)
  );

  const recursosAptos = diagnosticos.filter(
    (diagnostico) => diagnostico.aptoComoReferencia
  ).length;

  const detalles = diagnosticos.flatMap(
    (diagnostico) => diagnostico.comprobacionesPendientes
  );

  if (medios.length === 0) {
    detalles.push(
      "No hay recursos visuales registrados para este concepto."
    );
  }

  return {
    senaId: sena.id,
    concepto: sena.concepto,
    recursosEncontrados: medios.length,
    recursosAptos,
    recursosPendientes: medios.length - recursosAptos,
    estado:
      medios.length === 0
        ? "sin-recursos"
        : recursosAptos > 0
          ? "listo-para-revision"
          : "pendiente-validacion",
    detalles: [...new Set(detalles)],
  };
}

export function planificarBibliotecaLSC(): PlanRecursoLSC[] {
  return bibliotecaLSC.map((sena) =>
    planificarRecursosLSC(sena)
  );
}

export function resumirPlanBibliotecaLSC() {
  const planes = planificarBibliotecaLSC();

  return {
    totalSenas: planes.length,
    sinRecursos: planes.filter(
      (plan) => plan.estado === "sin-recursos"
    ).length,
    pendientes: planes.filter(
      (plan) => plan.estado === "pendiente-validacion"
    ).length,
    listosParaRevision: planes.filter(
      (plan) => plan.estado === "listo-para-revision"
    ).length,
  };
}
