import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { BotonPantallaCompleta } from "./components/ui/Boton";
import Registro, { type RegistroData } from "./screens/Registro/Registro";
import Estilos from "./screens/Estilos/Estilos";
import Camara from "./screens/Camara/Camara";
import Generando from "./screens/Generando/Generando";
import Resultado from "./screens/Resultado/Resultado";
import Qr from "./screens/Qr/Qr";
import summitService from "./services/summitService";
import type { FiltroId } from "./config/summit";

/**
 * Claro Tech Summit 2026 · Soluciones Digitales
 *
 * Flujo del kiosco, en el orden de las artes:
 *
 *   registro → estilos → camara → generando → resultado → qr
 *      ↑          ↓         ↓                     ↓        ↓
 *      └──────────┴─────────┘                     └────────┴──→ registro
 *
 * El paso es el único estado que manda: cada pantalla recibe lo que necesita y
 * avisa qué pasó, sin conocer a las demás.
 */

type Paso = "registro" | "estilos" | "camara" | "generando" | "resultado" | "qr";

const ALERTA = {
  confirmButtonColor: "#E30613",
  background: "#101014",
  color: "#FFFFFF",
} as const;

function App() {
  const [paso, setPaso] = useState<Paso>("registro");
  const [registro, setRegistro] = useState<RegistroData | null>(null);
  const [filtro, setFiltro] = useState<FiltroId | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const reiniciar = useCallback(() => {
    setRegistro(null);
    setFiltro(null);
    setImageUrl("");
    setPaso("registro");
  }, []);

  const generar = useCallback(
    async (foto: Blob) => {
      if (!filtro) return;

      setPaso("generando");
      const resultado = await summitService.generate(foto, filtro, registro);

      if (resultado.success && resultado.imageUrl) {
        setImageUrl(resultado.imageUrl);
        setPaso("resultado");
        return;
      }

      // Se vuelve a la cámara: el registro y el estilo siguen siendo válidos,
      // así que el visitante solo repite la foto.
      setPaso("camara");
      await Swal.fire({
        ...ALERTA,
        icon: "error",
        title: "No pudimos crear su imagen",
        text: resultado.error || "Inténtelo de nuevo.",
        confirmButtonText: "Intentar de nuevo",
      });
    },
    [filtro, registro],
  );

  return (
    <>
      {paso !== "generando" && <BotonPantallaCompleta />}

      {paso === "registro" && (
        <Registro
          onSubmit={(data) => {
            setRegistro(data);
            setPaso("estilos");
          }}
        />
      )}

      {paso === "estilos" && (
        <Estilos
          onElegir={(elegido) => {
            setFiltro(elegido);
            setPaso("camara");
          }}
          onAtras={() => setPaso("registro")}
        />
      )}

      {paso === "camara" && (
        <Camara onCapturar={generar} onAtras={() => setPaso("estilos")} />
      )}

      {paso === "generando" && <Generando />}

      {paso === "resultado" && (
        <Resultado
          imageUrl={imageUrl}
          onSiguiente={() => setPaso("qr")}
          onReiniciar={reiniciar}
        />
      )}

      {paso === "qr" && (
        <Qr
          imageUrl={imageUrl}
          onAtras={() => setPaso("resultado")}
          onReiniciar={reiniciar}
        />
      )}
    </>
  );
}

export default App;
