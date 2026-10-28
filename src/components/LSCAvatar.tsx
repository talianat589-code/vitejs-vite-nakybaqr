
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODELO_URL =
  "https://raw.githubusercontent.com/talianat589-code/lsc-conecta-modelos/8499dff65c6479dbabbe91ce7bc0c4a9570819ee/EMA.glb";

export default function LSCAvatar() {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState("Preparando el avatar 3D...");
  const [nombresHuesos, setNombresHuesos] = useState<string[]>([]);
  const huesosRef = useRef<Record<string, THREE.Bone>>({});
const rotacionesOriginalesRef = useRef<
  Record<string, THREE.Euler>
>({});

const [huesoSeleccionado, setHuesoSeleccionado] = useState("");
const [eje, setEje] = useState<"x" | "y" | "z">("z");
const [giroGrados, setGiroGrados] = useState(0);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    let activo = true;
    let modelo: THREE.Object3D | null = null;
    let mezclador: THREE.AnimationMixer | null = null;
    let fotograma = 0;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color("#f0f7ff");

    const camara = new THREE.PerspectiveCamera(
      35,
      1,
      0.1,
      1000
    );
    camara.position.set(0, 1.5, 5);

    const renderizador = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderizador.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );
    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    renderizador.setSize(
      contenedor.clientWidth || 320,
      360
    );

    contenedor.appendChild(renderizador.domElement);

    escena.add(new THREE.HemisphereLight(0xffffff, 0x8da4bd, 2));

    const luz = new THREE.DirectionalLight(0xffffff, 2.5);
    luz.position.set(3, 5, 4);
    escena.add(luz);

    const reloj = new THREE.Clock();

    const ajustarTamaño = () => {
      if (!activo) return;

      const ancho = contenedor.clientWidth || 320;
      const alto = 360;

      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      renderizador.setSize(ancho, alto);
    };

    const observador = new ResizeObserver(ajustarTamaño);
    observador.observe(contenedor);
    ajustarTamaño();

    new GLTFLoader().load(
      MODELO_URL,
      (gltf) => {
        if (!activo) return;
    
        modelo = gltf.scene;
    
        let cantidadHuesos = 0;
const nombresHuesos: string[] = [];

const huesos: Record<string, THREE.Bone> = {};
const rotacionesOriginales: Record<string, THREE.Euler> = {};

modelo.traverse((objeto) => {
  if ((objeto as THREE.Bone).isBone) {
    const hueso = objeto as THREE.Bone;
    const nombre = hueso.name || `hueso-${cantidadHuesos}`;

    cantidadHuesos++;
    nombresHuesos.push(nombre);
    huesos[nombre] = hueso;
    rotacionesOriginales[nombre] = hueso.rotation.clone();
  }
});

huesosRef.current = huesos;
rotacionesOriginalesRef.current = rotacionesOriginales;

setNombresHuesos(nombresHuesos);
setHuesoSeleccionado(nombresHuesos[0] ?? "");
setGiroGrados(0);
    
        console.log("EMA: huesos encontrados:", cantidadHuesos);
        console.log("EMA: nombres de huesos:", nombresHuesos);
        setNombresHuesos(nombresHuesos);
        console.log(
          "EMA: animaciones disponibles:",
          gltf.animations.map((animacion) => animacion.name)
        );
    
        escena.add(modelo);

        const caja = new THREE.Box3().setFromObject(modelo);
        const centro = caja.getCenter(new THREE.Vector3());
        const tamaño = caja.getSize(new THREE.Vector3());

        modelo.position.sub(centro);

        const altura = Math.max(tamaño.y, 0.1);
        const distancia =
          (altura / 2) /
          Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));

        camara.position.set(0, 0, distancia * 1.65);
        camara.lookAt(0, 0, 0);
        camara.near = Math.max(0.01, distancia / 100);
        camara.far = distancia * 100;
        camara.updateProjectionMatrix();

        if (gltf.animations.length > 0) {
          mezclador = new THREE.AnimationMixer(modelo);
          mezclador.clipAction(gltf.animations[0]).play();
          setEstado(
            `EMA cargado: ${cantidadHuesos} huesos y ` +
            `${gltf.animations.length} animaciones disponibles.`
          );
        } else {
          setEstado(
            `EMA cargado: ${cantidadHuesos} huesos y ninguna animación incluida.`
          );
        }
      },
      undefined,
      (error) => {
        console.error("Error al cargar el modelo EMA:", error);
        if (activo) {
          setEstado(
            "No se pudo cargar el modelo. Comprueba el enlace y la conexión."
          );
        }
      }
    );

    const dibujar = () => {
      if (!activo) return;
      fotograma = requestAnimationFrame(dibujar);
      mezclador?.update(reloj.getDelta());
      renderizador.render(escena, camara);
    };

    dibujar();

    return () => {
      activo = false;
      cancelAnimationFrame(fotograma);
      observador.disconnect();
      mezclador?.stopAllAction();

      escena.traverse((objeto) => {
        if (objeto instanceof THREE.Mesh) {
          objeto.geometry.dispose();

          const materiales = Array.isArray(objeto.material)
            ? objeto.material
            : [objeto.material];

          materiales.forEach((material) => material.dispose());
        }
      });

      renderizador.dispose();

      if (contenedor.contains(renderizador.domElement)) {
        contenedor.removeChild(renderizador.domElement);
      }
    };
  }, []);
  const restablecerArticulacion = () => {
    setGiroGrados(0);
  };
  
  useEffect(() => {
    const hueso = huesosRef.current[huesoSeleccionado];
    const original = rotacionesOriginalesRef.current[huesoSeleccionado];
  
    if (!hueso || !original) return;
  
    hueso.rotation.copy(original);
    hueso.rotation[eje] =
      original[eje] + (giroGrados * Math.PI) / 180;
  }, [huesoSeleccionado, eje, giroGrados, nombresHuesos]);

  return (
    <section className="lsc-avatar">
      <h3>Conoce a nuestro avatar</h3>
      <p>
        Estamos preparando a nuestro personaje para acompañar
        el aprendizaje de la Lengua de Señas Colombiana.
      </p>

      <div
        ref={contenedorRef}
        className="lsc-avatar-viewer"
        aria-label="Visor del modelo humano 3D"
      />

<p className="lsc-avatar-status" role="status">
  {estado}
</p>

<details className="lsc-bone-inspector">
  <summary>Ver estructura del avatar</summary>

  <p>
    Huesos detectados: {nombresHuesos.length}
  </p>

  <ul>
    {nombresHuesos.map((nombre, indice) => (
      <li key={`${nombre}-${indice}`}>
        {nombre}
      </li>
    ))}
  </ul>
</details>
<section className="lsc-joint-controls">
  <h4>Laboratorio de articulaciones</h4>

  <p>
    Selecciona una articulación y prueba un giro pequeño.
    Esta herramienta es técnica; todavía no representa una seña LSC.
  </p>

  <label htmlFor="lsc-bone-select">
    Articulación
  </label>

  <select
    id="lsc-bone-select"
    value={huesoSeleccionado}
    onChange={(evento) => {
      setHuesoSeleccionado(evento.target.value);
      setGiroGrados(0);
    }}
  >
    {nombresHuesos.map((nombre) => (
      <option key={nombre} value={nombre}>
        {nombre}
      </option>
    ))}
  </select>

  <label htmlFor="lsc-bone-axis">
    Eje de giro
  </label>

  <select
    id="lsc-bone-axis"
    value={eje}
    onChange={(evento) => {
      setEje(evento.target.value as "x" | "y" | "z");
      setGiroGrados(0);
    }}
  >
    <option value="x">X — adelante / atrás</option>
    <option value="y">Y — lateral</option>
    <option value="z">Z — giro frontal</option>
  </select>

  <label htmlFor="lsc-bone-angle">
    Ángulo de prueba: {giroGrados}°
  </label>

  <input
    id="lsc-bone-angle"
    type="range"
    min="-30"
    max="30"
    step="1"
    value={giroGrados}
    onChange={(evento) =>
      setGiroGrados(Number(evento.target.value))
    }
  />

  <button
    type="button"
    onClick={restablecerArticulacion}
  >
    Restablecer giro
  </button>
</section>
    </section>
  );
}
