
import { useMemo, useState } from "react";

import {
  planificarBibliotecaLSC,
  resumirPlanBibliotecaLSC,
  type PlanRecursoLSC,
} from "../data/lscResourcePlanner";

type FiltroRecursos =
  | "todos"
  | "sin-recursos"
  | "pendiente-validacion"
  | "listo-para-revision";

const nombresEstado: Record<PlanRecursoLSC["estado"], string> = {
  "sin-recursos": "Sin recursos",
  "pendiente-validacion": "Pendiente de validación",
  "listo-para-revision": "Listo para revisión",
};

export default function LSCResourceReview() {
  const [filtro, setFiltro] = useState<FiltroRecursos>("todos");
  const [busqueda, setBusqueda] = useState("");

  const planes = useMemo(
    () => planificarBibliotecaLSC(),
    []
  );

  const resumen = useMemo(
    () => resumirPlanBibliotecaLSC(),
    []
  );

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CO");

    return planes.filter((plan) => {
      const coincideEstado =
        filtro === "todos" || plan.estado === filtro;

      const coincideTexto =
        !texto ||
        plan.concepto.toLocaleLowerCase("es-CO").includes(texto) ||
        plan.senaId.toLocaleLowerCase("es-CO").includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [planes, filtro, busqueda]);

  return (
    <main className="lsc-resource-review">
      <h2>Revisión de recursos LSC</h2>

      <p>
        Panel de control para revisar recursos, fuentes y
        validaciones pendientes de la biblioteca.
      </p>

      <div className="lsc-resource-summary">
        <article>
          <strong>{resumen.totalSenas}</strong>
          <span>Conceptos registrados</span>
        </article>

        <article>
          <strong>{resumen.sinRecursos}</strong>
          <span>Sin recursos</span>
        </article>

        <article>
          <strong>{resumen.pendientes}</strong>
          <span>Pendientes de validación</span>
        </article>

        <article>
          <strong>{resumen.listosParaRevision}</strong>
          <span>Listos para revisión</span>
        </article>
      </div>

      <label htmlFor="buscar-recurso-lsc">
        Buscar concepto
      </label>

      <input
        id="buscar-recurso-lsc"
        type="search"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        placeholder="Ejemplo: hola, gracias..."
      />

      <label htmlFor="filtro-recurso-lsc">
        Filtrar por estado
      </label>

      <select
        id="filtro-recurso-lsc"
        value={filtro}
        onChange={(evento) =>
          setFiltro(evento.target.value as FiltroRecursos)
        }
      >
        <option value="todos">Todos los conceptos</option>
        <option value="sin-recursos">Sin recursos</option>
        <option value="pendiente-validacion">
          Pendientes de validación
        </option>
        <option value="listo-para-revision">
          Listos para revisión
        </option>
      </select>

      <p>Resultados: {resultados.length}</p>

      {resultados.length === 0 ? (
        <p>No hay conceptos que coincidan con la búsqueda.</p>
      ) : (
        <ul className="lsc-resource-list">
          {resultados.map((plan) => (
            <li key={plan.senaId}>
              <h3>{plan.concepto}</h3>

              <p>
                <strong>ID:</strong> {plan.senaId}
              </p>

              <p>
                <strong>Estado:</strong>{" "}
                {nombresEstado[plan.estado]}
              </p>

              <p>
                Recursos registrados: {plan.recursosEncontrados}
              </p>

              <p>
                Recursos aptos según las comprobaciones:{" "}
                {plan.recursosAptos}
              </p>

              <p>
                Recursos pendientes: {plan.recursosPendientes}
              </p>

              {plan.detalles.length > 0 && (
                <details>
                  <summary>Ver pendientes y observaciones</summary>
                  <ul>
                    {plan.detalles.map((detalle, indice) => (
                      <li key={`${plan.senaId}-${indice}`}>
                        {detalle}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
