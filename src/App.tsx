import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import { BotonPantallaCompleta } from "./components/ui/BotonDT";
import Registro, { type RegistroData } from "./screens/dt/Registro";
import Plantillas from "./screens/dt/Plantillas";
import Camara from "./screens/dt/Camara";
import Generando from "./screens/dt/Generando";
import Resultado from "./screens/dt/Resultado";
import Qr from "./screens/dt/Qr";
import datatechService from "./services/datatechService";
import type { PlantillaId } from "./config/datatech";
import { vieneDelChat, volverAlChat } from "./config/enlaceChat";

/**
 * Claro media · DATA TECH — "15 minutos"
 *
 * Flujo del kiosco:
 *
 *   registro → plantillas → camara → generando → resultado → qr
 *      ↑           ↓           ↓                     ↓        ↓
 *      └───────────┴───────────┘                     └────────┴──→ registro
 *
 * Si se entra desde el chat (?doc=…), el registro se salta —el chat ya tiene
 * los datos del visitante— y tanto "atrás" desde plantillas como el cierre
 * devuelven al chat en vez de reiniciar aquí.
 *
 * El paso es el único estado que manda: cada pantalla recibe lo que necesita y
 * avisa qué pasó, sin conocer a las demás.
 */

type Paso = "registro" | "plantillas" | "camara" | "generando" | "resultado" | "qr";

const ALERTA = {
  confirmButtonColor: "#E30613",
  background: "#101016",
  color: "#FFFFFF",
} as const;

const enlazado = vieneDelChat();

function App() {
  const [paso, setPaso] = useState<Paso>(enlazado ? "plantillas" : "registro");
  const [registro, setRegistro] = useState<RegistroData | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaId | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  /** Enlazado: volver al chat. Autónomo: empezar de cero aquí. */
  const terminar = useCallback(() => {
    if (enlazado) {
      volverAlChat();
      return;
    }
    setRegistro(null);
    setPlantilla(null);
    setImageUrl("");
    setPaso("registro");
  }, []);

  const generar = useCallback(
    async (foto: Blob) => {
      if (!plantilla) return;

      setPaso("generando");
      const resultado = await datatechService.generate(foto, plantilla, registro);

      if (resultado.success && resultado.imageUrl) {
        setImageUrl(resultado.imageUrl);
        setPaso("resultado");
        return;
      }

      // Se vuelve a la cámara: el correo y la plantilla siguen siendo válidos,
      // así que el visitante solo repite la foto.
      setPaso("camara");
      await Swal.fire({
        ...ALERTA,
        icon: "error",
        title: "No pudimos crear su póster",
        text: resultado.error || "Inténtelo de nuevo.",
        confirmButtonText: "Intentar de nuevo",
      });
    },
    [plantilla, registro],
  );

  return (
    <>
      {paso !== "generando" && <BotonPantallaCompleta />}

      {paso === "registro" && (
        <Registro
          onSubmit={(data) => {
            setRegistro(data);
            setPaso("plantillas");
          }}
        />
      )}

      {paso === "plantillas" && (
        <Plantillas
          onElegir={(elegida) => {
            setPlantilla(elegida);
            setPaso("camara");
          }}
          onAtras={enlazado ? volverAlChat : () => setPaso("registro")}
          textoAtras={enlazado ? "Volver al chat" : undefined}
        />
      )}

      {paso === "camara" && (
        <Camara onCapturar={generar} onAtras={() => setPaso("plantillas")} />
      )}

      {paso === "generando" && <Generando />}

      {paso === "resultado" && (
        <Resultado
          imageUrl={imageUrl}
          onSiguiente={() => setPaso("qr")}
          onReiniciar={() => setPaso("plantillas")}
        />
      )}

      {paso === "qr" && (
        <Qr
          imageUrl={imageUrl}
          onAtras={() => setPaso("resultado")}
          onTerminar={terminar}
          textoTerminar={enlazado ? "Regresar al chat" : "Terminar"}
        />
      )}
    </>
  );
}

export default App;
