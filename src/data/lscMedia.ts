export type TipoMediaLSC =
  | "video"
  | "imagen"
  | "landmarks"
  | "animacion";

export type EstadoMediaLSC =
  | "pendiente-revision"
  | "revisado"
  | "aprobado"
  | "no-utilizable";

export type MediaLSC = {
  id: string;

  senaId: string;

  tipo: TipoMediaLSC;

  url: string | null;

  titulo: string;

  descripcion: string;

  fuenteId: string | null;

  licencia: string;

  requiereAtribucion: boolean;

  estado: EstadoMediaLSC;

  region: string | null;

  variante: string | null;

  validacionLingüistica: boolean;

  permiteUsoComercial: boolean;

  permiteModificacion: boolean;

  permiteRedistribucion: boolean;

  permiteEntrenamientoIA: boolean;

  observaciones: string;
};

export const mediosLSC: MediaLSC[] = [];

/**
 * Obtiene todos los recursos multimedia
 * asociados a una seña.
 */
export function obtenerMediosPorSena(
  senaId: string
): MediaLSC[] {
  return mediosLSC.filter(
    (media) => media.senaId === senaId
  );
}

export type DiagnosticoMediaLSC = {
  aptoComoReferencia: boolean;
  comprobacionesPendientes: string[];
};

export function diagnosticarMediaLSC(
  media: MediaLSC
): DiagnosticoMediaLSC {
  const pendientes: string[] = [];

  if (!media.url?.trim()) {
    pendientes.push("Falta la URL del recurso.");
  }

  if (!media.fuenteId?.trim()) {
    pendientes.push("Falta identificar la fuente.");
  }

  if (!media.licencia?.trim()) {
    pendientes.push("Falta registrar la licencia.");
  }

  if (media.estado !== "aprobado") {
    pendientes.push("El recurso no está aprobado.");
  }

  if (media.validacionLingüística !== true) {
    pendientes.push("Falta validar lingüísticamente la seña.");
  }

  if (media.permiteUsoComercial !== true) {
    pendientes.push("El uso comercial no está autorizado o comprobado.");
  }

  if (media.permiteRedistribucion !== true) {
    pendientes.push("La redistribución no está autorizada o comprobada.");
  }

  if (
    media.requiereAtribucion &&
    !media.observaciones?.trim()
  ) {
    pendientes.push(
      "Se requiere registrar cómo atribuir la fuente."
    );
  }

  return {
    aptoComoReferencia:
      puedeMostrarseComoReferencia(media) &&
      pendientes.length === 0,
    comprobacionesPendientes: pendientes,
  };
}

/**
 * Obtiene solamente los recursos
 * aprobados para mostrarse en la aplicación.
 */

 function puedeMostrarseComoReferencia(
  media: MediaLSC
): boolean {
  return (
    media.estado === "aprobado" &&
    media.validacionLingüistica === true &&
    media.permiteUsoComercial === true &&
    media.permiteRedistribucion === true &&
    Boolean(media.fuenteId?.trim()) &&
    Boolean(media.licencia.trim()) &&
    Boolean(media.url?.trim())
  );
}

export function obtenerMediosAprobadosPorSena(
  senaId: string
): MediaLSC[] {
  return mediosLSC.filter(
    (media) =>
      media.senaId === senaId &&
      puedeMostrarseComoReferencia(media)
  );
}

export function obtenerVideosPorSena(
  senaId: string
): MediaLSC[] {
  return mediosLSC.filter(
    (media) =>
      media.senaId === senaId &&
      media.tipo === "video" &&
      puedeMostrarseComoReferencia(media)
  );
}
