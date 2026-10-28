
import { useEffect, useState } from "react";
import type { ResultadoVozBiblioteca } from "../data/lscVoiceLibraryAdapter";

type Props = {
  resultados: ResultadoVozBiblioteca[];
};

export default function LSCVisualSequence({
  resultados,
}: Props) {
  const [indice, setIndice] = useState(0);
  const [auto, setAuto] = useState(false);
  const [segundos, setSegundos] = useState(5);

  useEffect(() => {
    setIndice(0);
    setAuto(false);
  }, [resultados]);

  const posicion =
    resultados.length > 0
      ? Math.min(indice, resultados.length - 1)
      : 0;

  const actual = resultados[posicion];
  const sena = actual?.sena;

  const video = sena?.video;
  const animacion = sena?.animacion;
  const imagen = sena?.imagen;

  const avanzar = () => {
    setIndice((anterior) =>
      Math.min(resultados.length - 1, anterior + 1)
    );
  };

  const retroceder = () => {
    setIndice((anterior) => Math.max(0, anterior - 1));
  };

  // Las imágenes y animaciones avanzan después del tiempo elegido.
  // Los videos avanzan mediante el evento onEnded del reproductor.
  useEffect(() => {
    if (!auto || !actual || video || (!imagen && !animacion)) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setIndice((anterior) => {
        if (anterior >= resultados.length - 1) {
          setAuto(false);
          return anterior;
        }
        return anterior + 1;
      });
    }, segundos * 1000);

    return () => window.clearTimeout(temporizador);
  }, [
    auto,
    indice,
    resultados.length,
    video,
    imagen,
    animacion,
    segundos,
    actual,
  ]);

  const alTerminarVideo = () => {
    if (!auto) return;

    if (posicion < resultados.length - 1) {
      avanzar();
    } else {
      setAuto(false);
    }
  };

  if (resultados.length === 0) {
    return (
      <section className="lsc-sequence">
        <h3>Secuencia visual de señas</h3>
        <p>
          Habla o escribe una frase para consultar
          los recursos LSC disponibles.
        </p>
      </section>
    );
  }

  return (
    <section className="lsc-sequence">
      <div className="lsc-sequence-header">
        <div>
          <h3>Secuencia visual de señas</h3>
          <p>Consulta y recorre los recursos disponibles.</p>
        </div>

        <span className="lsc-sequence-count">
          {posicion + 1} de {resultados.length}
        </span>
      </div>

      <div className="lsc-sequence-progress">
        <div
          className="lsc-sequence-progress-fill"
          style={{
            width: `${((posicion + 1) / resultados.length) * 100}%`,
          }}
        />
      </div>

      <div className="lsc-sequence-card">
        <span className="lsc-sequence-label">
          EXPRESIÓN {posicion + 1}
        </span>

        <h4>{sena.concepto}</h4>

        {video ? (
          <video
            key={String(video)}
            className="lsc-sequence-media"
            src={video}
            controls
            playsInline
            preload="metadata"
            onEnded={alTerminarVideo}
          >
            Tu navegador no puede reproducir este video.
          </video>
        ) : animacion ? (
          <img
            className="lsc-sequence-media"
            src={animacion}
            alt={`Recurso visual de ${sena.concepto}`}
          />
        ) : imagen ? (
          <img
            className="lsc-sequence-media"
            src={imagen}
            alt={`Imagen de la seña: ${sena.concepto}`}
          />
        ) : (
          <div className="lsc-sequence-empty">
            <span aria-hidden="true">🤟</span>
            <p>
              Aún no hay un recurso visual disponible
              para esta expresión.
            </p>
          </div>
        )}

        {actual.pendienteDeValidacion && (
          <p className="lsc-sequence-warning">
            Recurso pendiente de validación.
          </p>
        )}

        <div className="lsc-sequence-dots">
          {resultados.map((resultado, i) => (
            <button
              key={`${resultado.sena.concepto}-${i}`}
              type="button"
              className={
                i === posicion
                  ? "lsc-sequence-dot active"
                  : "lsc-sequence-dot"
              }
              onClick={() => setIndice(i)}
              aria-label={`Ver expresión ${i + 1}: ${resultado.sena.concepto}`}
              aria-current={i === posicion ? "step" : undefined}
            />
          ))}
        </div>
      </div>

      <div className="lsc-sequence-settings">
        <label htmlFor="lsc-sequence-seconds">
          Tiempo por imagen o animación
        </label>

        <select
          id="lsc-sequence-seconds"
          value={segundos}
          onChange={(evento) =>
            setSegundos(Number(evento.target.value))
          }
        >
          <option value={3}>3 segundos</option>
          <option value={5}>5 segundos</option>
          <option value={8}>8 segundos</option>
          <option value={10}>10 segundos</option>
        </select>
      </div>

      <div className="lsc-sequence-controls">
        <button
          type="button"
          onClick={retroceder}
          disabled={posicion === 0}
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={() => setAuto((estado) => !estado)}
          aria-pressed={auto}
        >
          {auto ? "Detener automático" : "Reproducir secuencia"}
        </button>

        <button
          type="button"
          onClick={avanzar}
          disabled={posicion === resultados.length - 1}
        >
          Siguiente
        </button>
      </div>

      <p className="lsc-sequence-status">
        {auto
          ? video
            ? "Modo automático activado. El video avanzará al terminar."
            : imagen || animacion
              ? `Modo automático activado. La secuencia avanzará en ${segundos} segundos.`
              : "No hay recurso visual para esta expresión. Puedes avanzar manualmente."
          : "Modo manual. Avanza cuando estés listo."}
      </p>
    </section>
  );
}
