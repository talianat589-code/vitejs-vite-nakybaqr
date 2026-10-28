
export type PuntoManoLSC = {
  x: number;
  y: number;
  z?: number;
};

export type FotogramaMovimientoLSC = {
  momento: number;
  puntos: number[];
  movimiento: number;
};

const MAX_FOTOGRAMAS = 60;

function distancia(
  a: PuntoManoLSC,
  b: PuntoManoLSC
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Centra los puntos respecto a la muñeca y los normaliza
 * usando la distancia entre la muñeca y la base del dedo medio.
 * Los puntos esperados siguen el orden de 21 landmarks de MediaPipe.
 */
export function extraerCaracteristicasMano(
  puntos: PuntoManoLSC[]
): number[] | null {
  if (puntos.length < 21) return null;

  const muneca = puntos[0];
  const baseMedio = puntos[9];
  const escala = distancia(muneca, baseMedio);

  if (!Number.isFinite(escala) || escala < 0.0001) {
    return null;
  }

  const resultado: number[] = [];

  for (const punto of puntos.slice(0, 21)) {
    resultado.push(
      (punto.x - muneca.x) / escala,
      (punto.y - muneca.y) / escala,
      ((punto.z ?? 0) - (muneca.z ?? 0)) / escala
    );
  }

  return resultado;
}

/**
 * Calcula el cambio promedio entre dos fotogramas normalizados.
 * Es una medida experimental de movimiento, no una clasificación de seña.
 */
export function calcularCambioMovimiento(
  anterior: number[] | null,
  actual: number[]
): number {
  if (!anterior || anterior.length !== actual.length) {
    return 0;
  }

  let suma = 0;

  for (let i = 0; i < actual.length; i++) {
    const diferencia = actual[i] - anterior[i];
    suma += diferencia * diferencia;
  }

  return Math.sqrt(suma / actual.length);
}

export function agregarFotogramaMovimiento(
  historial: FotogramaMovimientoLSC[],
  puntos: number[],
  movimiento: number,
  momento = Date.now()
): FotogramaMovimientoLSC[] {
  const nuevo: FotogramaMovimientoLSC = {
    momento,
    puntos,
    movimiento,
  };

  return [...historial, nuevo].slice(-MAX_FOTOGRAMAS);
}

export function resumirMovimiento(
  fotogramas: FotogramaMovimientoLSC[]
): {
  cantidadFotogramas: number;
  duracionMs: number;
  movimientoPromedio: number;
  movimientoMaximo: number;
} {
  if (fotogramas.length === 0) {
    return {
      cantidadFotogramas: 0,
      duracionMs: 0,
      movimientoPromedio: 0,
      movimientoMaximo: 0,
    };
  }

  const movimientos = fotogramas.map((f) => f.movimiento);
  const suma = movimientos.reduce((total, valor) => total + valor, 0);

  return {
    cantidadFotogramas: fotogramas.length,
    duracionMs: Math.max(
      0,
      fotogramas[fotogramas.length - 1].momento -
        fotogramas[0].momento
    ),
    movimientoPromedio: suma / movimientos.length,
    movimientoMaximo: Math.max(...movimientos),
  };
}
