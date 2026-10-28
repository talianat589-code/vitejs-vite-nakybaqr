
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./index.css";
import HandCamera from "./components/HandCamera";
import CommunicationView from "./components/CommunicationView";
import VoiceRecognition from "./VoiceRecognition";
import SignInterpreter from "./components/SignInterpreter";
import LearningModule from "./components/LearningModule";
import LSCCatalog from "./components/LSCCatalog";
import LSCResourceReview from "./components/LSCResourceReview";
import LSCVisualSequence from "./components/LSCVisualSequence";
import LSCAvatar from "./components/LSCAvatar";
import {
  buscarCoincidenciasDeVoz,
  type ResultadoVozBiblioteca,
} from "./data/lscVoiceLibraryAdapter";
import {
  planificarFraseLSC,
  type PlanFraseLSC,
} from "./data/lscPhrasePlanner";
type Landmark = {
  x: number;
  y: number;
  z: number;
};

type FrameData = {
  timestamp: number;
  hands: Landmark[][];
};

type SignSample = {
  id: string;
  label: string;
  createdAt: string;
  frames: FrameData[];
};

type Modo = "senas" | "voz" | "aprender" | "comunicar";

type Ejercicio = {
  nombre: string;
  instruccion: string;
  objetivo: string;
  emoji: string;
};

const ejercicios: Ejercicio[] = [
  {
    nombre: "Mano abierta",
    instruccion:
      "Extiende los dedos y muestra la palma hacia la cámara.",
    objetivo: "mano abierta",
    emoji: "✋",
  },
  {
    nombre: "Puño cerrado",
    instruccion:
      "Cierra los dedos formando un puño y mantenlo frente a la cámara.",
    objetivo: "puño cerrado",
    emoji: "✊",
  },
  {
    nombre: "Índice extendido",
    instruccion:
      "Extiende el dedo índice y mantén los demás dedos doblados.",
    objetivo: "índice extendido",
    emoji: "☝️",
  },
];

function reconocerGesto(hands: Landmark[][]): string {
  if (!hands.length) return "sin mano";

  const hand = hands[0];

  if (!hand || hand.length < 21) {
    return "gesto no identificado";
  }

  // Puntos de referencia de las puntas y articulaciones
  // de los dedos según el modelo de MediaPipe.
  const dedosExtendidos = [
    hand[8].y < hand[6].y,   // Índice
    hand[12].y < hand[10].y, // Medio
    hand[16].y < hand[14].y, // Anular
    hand[20].y < hand[18].y, // Meñique
  ];

  const cantidadExtendidos =
    dedosExtendidos.filter(Boolean).length;

  if (cantidadExtendidos === 4) {
    return "mano abierta";
  }

  if (cantidadExtendidos === 0) {
    return "puño cerrado";
  }

  if (
    dedosExtendidos[0] &&
    !dedosExtendidos[1] &&
    !dedosExtendidos[2] &&
    !dedosExtendidos[3]
  ) {
    return "índice extendido";
  }

  return "gesto no identificado";
}

function App() {
  const [modo, setModo] = useState<Modo>("senas");
  const [consultaVoz, setConsultaVoz] =
  useState("");
  const [resultadosVoz, setResultadosVoz] = useState<
  ResultadoVozBiblioteca[]
>([]);
const procesarTextoVoz = (texto: string) => {
  setConsultaVoz(texto);
  setResultadosVoz(buscarCoincidenciasDeVoz(texto));
  setPlanFrase(planificarFraseLSC(texto));
};
const [planFrase, setPlanFrase] =
  useState<PlanFraseLSC | null>(null);
  const [etiqueta, setEtiqueta] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [muestras, setMuestras] = useState<SignSample[]>([]);
  const [estado, setEstado] = useState(
    "Escribe el nombre de una seña para comenzar."
  );
  const [datosCargados, setDatosCargados] = useState(false);

  // Estados del módulo de aprendizaje
  const [ejercicioActual, setEjercicioActual] = useState(0);
  const [ejerciciosCompletados, setEjerciciosCompletados] =
    useState<number[]>([]);
  const [gestoDetectado, setGestoDetectado] = useState(
    "Esperando la cámara..."
  );
  const [mensajeAprendizaje, setMensajeAprendizaje] =
    useState("Coloca tu mano frente a la cámara.");
  const [acierto, setAcierto] = useState(false);

  const [textoVoz, setTextoVoz] = useState("");

  const grabandoRef = useRef(false);
  const framesRef = useRef<FrameData[]>([]);
  const etiquetaRef = useRef("");
  const timerRef = useRef<number | null>(null);

  // Recuperar muestras guardadas
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(
        "lsc-conecta-muestras"
      );

      if (guardado) {
        const datos = JSON.parse(guardado);

        if (Array.isArray(datos)) {
          setMuestras(datos);
          setEstado(
            `Se recuperaron ${datos.length} muestras guardadas.`
          );
        }
      }
    } catch (error) {
      console.error("Error al recuperar muestras:", error);
      setEstado("No se pudieron recuperar los datos guardados.");
    } finally {
      setDatosCargados(true);
    }
  }, []);

  // Guardar muestras automáticamente
  useEffect(() => {
    if (!datosCargados) return;

    try {
      localStorage.setItem(
        "lsc-conecta-muestras",
        JSON.stringify(muestras)
      );
    } catch (error) {
      console.error("Error al guardar muestras:", error);
      setEstado(
        "No se pudieron guardar todos los datos. Descarga una copia JSON."
      );
    }
  }, [muestras, datosCargados]);

  // Procesar los puntos que entrega la cámara
  const procesarManos = useCallback(
    (hands: Landmark[][]) => {
      if (grabandoRef.current && hands.length > 0) {
        framesRef.current.push({
          timestamp: Math.round(performance.now()),
          hands: hands.map((hand) =>
            hand.map((point) => ({
              x: point.x,
              y: point.y,
              z: point.z,
            }))
          ),
        });
      }

      if (modo === "aprender") {
        const gesto = reconocerGesto(hands);
        setGestoDetectado(gesto);

        const ejercicio = ejercicios[ejercicioActual];

        if (
          gesto === ejercicio.objetivo &&
          !ejerciciosCompletados.includes(ejercicioActual)
        ) {
          setAcierto(true);
          setMensajeAprendizaje(
            "¡Muy bien! Has realizado el gesto correctamente."
          );

          setEjerciciosCompletados((anteriores) =>
            anteriores.includes(ejercicioActual)
              ? anteriores
              : [...anteriores, ejercicioActual]
          );
        } else if (gesto === ejercicio.objetivo) {
          setAcierto(true);
          setMensajeAprendizaje(
            "¡Excelente! Ya completaste este ejercicio."
          );
        } else {
          setAcierto(false);

          setMensajeAprendizaje(
            hands.length === 0
              ? "No detectamos tu mano. Colócala frente a la cámara."
              : "Inténtalo nuevamente. Sigue las instrucciones del ejercicio."
          );
        }
      }
    },
    [modo, ejercicioActual, ejerciciosCompletados]
  );

  // Finalizar grabación de una muestra
  const finalizarGrabacion = useCallback(() => {
    if (!grabandoRef.current) return;

    grabandoRef.current = false;
    setGrabando(false);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const frames = [...framesRef.current];
    const nombre = etiquetaRef.current;

    if (frames.length < 5) {
      setEstado(
        "Se capturaron muy pocos fotogramas. Intenta grabar nuevamente."
      );
      return;
    }

    const nuevaMuestra: SignSample = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      label: nombre,
      createdAt: new Date().toISOString(),
      frames,
    };

    setMuestras((actuales) => [...actuales, nuevaMuestra]);

    setEstado(
      `Muestra guardada: ${nombre}. Fotogramas capturados: ${frames.length}.`
    );
  }, []);

  // Iniciar grabación
  const iniciarGrabacion = () => {
    const nombre = etiqueta.trim();

    if (!nombre) {
      setEstado("Primero escribe el nombre de la seña.");
      return;
    }

    if (grabandoRef.current) return;

    framesRef.current = [];
    etiquetaRef.current = nombre;

    grabandoRef.current = true;
    setGrabando(true);
    setEstado(
      `Grabando la seña: ${nombre}. Mantén tus manos visibles.`
    );

    timerRef.current = window.setTimeout(() => {
      finalizarGrabacion();
    }, 3000);
  };

  // Limpiar temporizador al salir
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      grabandoRef.current = false;
    };
  }, []);

  // Descargar muestras
  const descargarDatos = () => {
    if (muestras.length === 0) {
      setEstado("Todavía no hay muestras para descargar.");
      return;
    }

    const dataset = {
      project: "LSC Conecta",
      formatVersion: 1,
      description:
        "Muestras de puntos de referencia de manos para investigación y entrenamiento.",
      totalSamples: muestras.length,
      samples: muestras,
    };

    const archivo = new Blob(
      [JSON.stringify(dataset, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "lsc-conecta-dataset.json";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    setEstado("Archivo de datos descargado correctamente.");
  };

  // Eliminar todas las muestras
  const limpiarMuestras = () => {
    if (grabandoRef.current) {
      setEstado(
        "Finaliza la grabación antes de limpiar los datos."
      );
      return;
    }

    setMuestras([]);
    setEstado("Se eliminaron las muestras de esta sesión.");
  };

  // Importar muestras JSON
  const importarDatos = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    try {
      const contenido = await archivo.text();
      const datos = JSON.parse(contenido);

      const muestrasImportadas = Array.isArray(datos)
        ? datos
        : datos.samples;

      if (!Array.isArray(muestrasImportadas)) {
        throw new Error(
          "El archivo no contiene una lista de muestras válida."
        );
      }

      const validas = muestrasImportadas.filter(
        (muestra: any) =>
          typeof muestra.label === "string" &&
          Array.isArray(muestra.frames) &&
          muestra.frames.length > 0
      );

      if (validas.length === 0) {
        throw new Error(
          "No se encontraron muestras válidas en el archivo."
        );
      }

      setMuestras((actuales) => {
        const ids = new Set(
          actuales.map((muestra) => muestra.id)
        );

        const nuevas = validas.map((muestra: any) => {
          let id = muestra.id;

          if (!id || ids.has(id)) {
            id = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`;
          }

          ids.add(id);

          return {
            ...muestra,
            id,
            createdAt:
              muestra.createdAt || new Date().toISOString(),
          };
        });

        return [...actuales, ...nuevas];
      });

      setEstado(
        `Se importaron ${validas.length} muestras correctamente.`
      );
    } catch (error) {
      console.error("Error al importar:", error);

      setEstado(
        error instanceof Error
          ? error.message
          : "No se pudo importar el archivo."
      );
    }

    event.target.value = "";
  };

  // Eliminar una muestra individual
  const eliminarMuestra = (id: string) => {
    setMuestras((actuales) =>
      actuales.filter((muestra) => muestra.id !== id)
    );

    setEstado("La muestra fue eliminada.");
  };

  // Reiniciar el módulo de aprendizaje
  const reiniciarAprendizaje = () => {
    setEjercicioActual(0);
    setEjerciciosCompletados([]);
    setAcierto(false);
    setGestoDetectado("Esperando la cámara...");
    setMensajeAprendizaje(
      "Coloca tu mano frente a la cámara."
    );
  };

  // Avanzar al siguiente ejercicio
  const siguienteEjercicio = () => {
    if (ejercicioActual < ejercicios.length - 1) {
      setEjercicioActual((actual) => actual + 1);
      setAcierto(false);
      setMensajeAprendizaje(
        "Realiza el nuevo gesto frente a la cámara."
      );
    }
  };

  const ejercicio = ejercicios[ejercicioActual];

  return (
    <main className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🤟</span>
          <div>
            <h1>LSC Conecta</h1>
            <p>La comunicación nos une</p>
          </div>
        </div>

        <span className="status">● Prototipo</span>
      </header>

      <section className="welcome">
        <span className="eyebrow">
          COMUNICACIÓN SIN BARRERAS
        </span>

        <h2>Conectemos a través de la comunicación.</h2>

        <p>
          Una herramienta para acercar a las personas sordas
          y oyentes mediante la Lengua de Señas Colombiana.
        </p>
      </section>

      <nav className="selector">
        <button
          className={modo === "senas" ? "tab active" : "tab"}
          onClick={() => setModo("senas")}
        >
          🤟 Laboratorio
        </button>

        <button
          className={modo === "voz" ? "tab active" : "tab"}
          onClick={() => setModo("voz")}
        >
          🎙️ Voz a señas
        </button>
        <button
  type="button"
  onClick={() => setModo("entender-senas")}
>
  🤟 Entender señas
</button>
        <button
          className={
            modo === "aprender" ? "tab active" : "tab"
          }
          onClick={() => setModo("aprender")}
        >
          📚 Aprender
        </button>
        <button
  className={
    modo === "comunicar" ? "tab active" : "tab"
  }
  onClick={() => setModo("comunicar")}
>
  📹 Comunicar
</button>
<button
  type="button"
  className={
    modo === "revision-recursos" ? "tab active" : "tab"
  }
  onClick={() => setModo("revision-recursos")}
>
  📋 Revisar recursos LSC
</button>
      </nav>
      {modo === "senas" && (
        <section className="panel">
          <div className="panel-heading">
            <h3>Laboratorio de señas</h3>
            <span className="tag">Recopilación</span>
          </div>

          <div className="learning-intro">
            <h3>Enseñemos nuevas señas a la aplicación</h3>
            <p>
              Registra ejemplos de movimientos para construir
              nuestro primer conjunto de datos.
            </p>
          </div>

          <label className="field-label" htmlFor="sign-name">
            Nombre de la seña
          </label>

          <input
            id="sign-name"
            className="sign-input"
            type="text"
            value={etiqueta}
            onChange={(event) =>
              setEtiqueta(event.target.value)
            }
            placeholder="Ejemplo: saludo"
            disabled={grabando}
          />

          <div className="recording-instructions">
            <strong>Instrucciones:</strong>
            <ol>
              <li>Escribe una etiqueta para la seña.</li>
              <li>Coloca tus manos frente a la cámara.</li>
              <li>Pulsa «Grabar muestra».</li>
              <li>Realiza la seña durante tres segundos.</li>
              <li>Repite para recopilar más ejemplos.</li>
            </ol>
          </div>

          <HandCamera onDetection={procesarManos} />

          <div className="recording-status">
            <span
              className={
                grabando
                  ? "recording-indicator recording"
                  : "recording-indicator"
              }
            />

            <p>{estado}</p>
          </div>

          {!grabando ? (
            <button
              className="primary record-button"
              onClick={iniciarGrabacion}
            >
              ● Grabar muestra (3 segundos)
            </button>
          ) : (
            <button
              className="primary stop-button"
              onClick={finalizarGrabacion}
            >
              Detener y guardar muestra
            </button>
          )}

          <div className="dataset-summary">
            <div>
              <p className="helper-text">
                {datosCargados
                  ? "✓ Datos cargados. Las muestras nuevas se guardan automáticamente."
                  : "Cargando muestras guardadas..."}
              </p>

              <span className="result-label">
                MUESTRAS RECOPILADAS
              </span>

              <p className="dataset-number">
                {muestras.length}
              </p>
            </div>

            <div>
              <span className="result-label">
                SEÑAS DIFERENTES
              </span>

              <p className="dataset-number">
                {
                  new Set(
                    muestras.map((sample) => sample.label)
                  ).size
                }
              </p>
            </div>
          </div>

          <div className="import-section">
            <h3>Importar datos anteriores</h3>

            <p className="helper-text">
              Selecciona un archivo JSON de LSC Conecta
              para recuperar muestras guardadas.
            </p>

            <label className="import-button">
              📂 Seleccionar archivo JSON

              <input
                type="file"
                accept=".json,application/json"
                onChange={importarDatos}
                disabled={grabando || !datosCargados}
              />
            </label>
          </div>

          <div className="sample-list">
            <h3>Mis muestras</h3>

            {muestras.length === 0 ? (
              <p className="helper-text">
                Aún no has guardado muestras.
              </p>
            ) : (
              muestras.map((sample, index) => (
                <div className="sample-item" key={sample.id}>
                  <div>
                    <strong>
                      {index + 1}. {sample.label}
                    </strong>

                    <p>
                      {sample.frames.length} fotogramas
                    </p>
                  </div>

                  <button
                    className="delete-sample"
                    onClick={() =>
                      eliminarMuestra(sample.id)
                    }
                    disabled={grabando}
                    aria-label={`Eliminar muestra ${sample.label}`}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            className="primary download-button"
            onClick={descargarDatos}
            disabled={muestras.length === 0 || grabando}
          >
            Descargar conjunto de datos
          </button>

          <button
            className="secondary-button"
            onClick={limpiarMuestras}
            disabled={muestras.length === 0 || grabando}
          >
            Limpiar muestras
          </button>

          <p className="helper-text">
            Las muestras se guardan en el almacenamiento local
            del navegador. Descarga una copia JSON como respaldo.
          </p>
        </section>
      )}

      {modo === "aprender" && (
        <section className="panel learning-module">
          <LSCCatalog
  consultaVoz={consultaVoz}
/>
          <div className="panel-heading">
            <h3>Mis primeras señas</h3>
            <span className="tag">Nivel 1</span>
          </div>

          <p className="helper-text">
            Practica posturas básicas de la mano y aprende
            a utilizar el sistema de detección.
          </p>

          <div className="learning-progress">
            <div className="progress-label">
              <strong>Tu progreso</strong>
              <span>
                {ejerciciosCompletados.length} de{" "}
                {ejercicios.length} ejercicios
              </span>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={ejerciciosCompletados.length}
              aria-valuemin={0}
              aria-valuemax={ejercicios.length}
              aria-label="Progreso de aprendizaje"
            >
              <div
                className="progress-fill"
                style={{
                  width: `${
                    (ejerciciosCompletados.length /
                      ejercicios.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {ejerciciosCompletados.length ===
          ejercicios.length ? (
            <div className="learning-complete">
              <div className="completion-icon">🏆</div>
              <h3>¡Felicitaciones!</h3>
              <p>
                Has completado los tres ejercicios de este
                primer nivel.
              </p>

              <button
                className="primary"
                onClick={reiniciarAprendizaje}
              >
                Volver a practicar
              </button>
            </div>
          ) : (
            <>
              <div className="exercise-card">
                <span className="exercise-number">
                  EJERCICIO {ejercicioActual + 1} DE{" "}
                  {ejercicios.length}
                </span>

                <div className="exercise-emoji">
                  {ejercicio.emoji}
                </div>

                <h2>{ejercicio.nombre}</h2>

                <p>{ejercicio.instruccion}</p>
              </div>

              <HandCamera onDetection={procesarManos} />

              <div
                className={
                  acierto
                    ? "learning-feedback success"
                    : "learning-feedback"
                }
                aria-live="polite"
              >
                <strong>
                  {acierto
                    ? "✓ ¡Gesto reconocido!"
                    : "Práctica en curso"}
                </strong>

                <p>{mensajeAprendizaje}</p>

                <span>
                  Detección actual: {gestoDetectado}
                </span>
              </div>

              {acierto && (
                <div className="exercise-actions">
                  {ejercicioActual <
                  ejercicios.length - 1 ? (
                    <button
                      className="primary"
                      onClick={siguienteEjercicio}
                    >
                      Siguiente ejercicio →
                    </button>
                  ) : (
                    <button
                      className="primary"
                      onClick={reiniciarAprendizaje}
                    >
                      Finalizar y repetir
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          <div className="learning-note">
            <strong>Nota de aprendizaje</strong>
            <p>
              Esta versión reconoce posturas sencillas de la
              mano para practicar el uso de la cámara. No es
              todavía un traductor de Lengua de Señas Colombiana.
            </p>
          </div>
          <div className="lsc-avatar-section">
  <LSCAvatar />
</div>
        </section>
      )}
{modo === "entender-senas" && (
  <SignInterpreter />
)}
{modo === "voz" && (
  <section className="panel">
    <VoiceRecognition
      onTextoReconocido={procesarTextoVoz}
    />

    <div className="voice-search-results">
      <h3>Resultados en la biblioteca LSC</h3>

      {!consultaVoz.trim() ? (
        <p>Habla para buscar señas en el catálogo.</p>
      ) : resultadosVoz.length === 0 ? (
        <p>No se encontraron coincidencias en la biblioteca.</p>
      ) : (
        <ul>
          {resultadosVoz.map(({ sena, tieneRecursoVisual, pendienteDeValidacion }) => (
            <li key={sena.id}>
              <strong>{sena.concepto}</strong>

              <p>{sena.descripcion}</p>

              <p>
                {tieneRecursoVisual
                  ? "Tiene un recurso visual registrado."
                  : "Todavía no tiene un recurso visual registrado."}
              </p>

              {pendienteDeValidacion && (
                <small>
                  Seña pendiente de validación lingüística.
                </small>
              )}
            </li>
          ))}
        </ul>
      )}
<LSCVisualSequence resultados={resultadosVoz} />
    <section className="phrase-plan-results">
  <h3>Secuencia de conceptos</h3>

  {!planFrase || planFrase.segmentos.length === 0 ? (
    <p>Habla para analizar una frase.</p>
  ) : (
    <>
      <p>
        Conceptos encontrados: {planFrase.conceptosEncontrados}
      </p>

      <ol>
        {planFrase.segmentos.map((segmento, indice) => (
          <li key={`${segmento.texto}-${indice}`}>
            <strong>{segmento.texto}</strong>

            {segmento.sena ? (
              <>
                <p>Concepto: {segmento.sena.concepto}</p>
                <p>
                  {segmento.sena.video || segmento.sena.imagen ||
                  segmento.sena.animacion
                    ? "Recurso visual registrado."
                    : "Pendiente de incorporar un recurso visual."}
                </p>
              </>
            ) : (
              <p>Sin coincidencia exacta en el catálogo.</p>
            )}
          </li>
        ))}
      </ol>
    </>
  )}
  <div className="resource-review-container">
  <h3>Biblioteca de recursos LSC</h3>
  <LSCResourceReview />
</div>
</section>
</div>
  </section>
)}
{modo === "revision-recursos" && (
  <section className="panel">
    <h2>Revisión de recursos LSC</h2>
    <p>La navegación funciona correctamente.</p>
  </section>
)}
{modo === "comunicar" && (
  <CommunicationView />
)}
      <footer>
        <p>LSC Conecta · Proyecto de accesibilidad</p>
        <p>Desarrollado para Colombia 🇨🇴</p>
      </footer>
    </main>
  );
}

export default App;
