import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./Registro.scss";
import Pantalla from "../../components/Pantalla/Pantalla";
import { Boton } from "../../components/ui/BotonDT";

export interface RegistroData {
  correo: string;
}

interface RegistroProps {
  onSubmit: (data: RegistroData) => void;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pantalla 1 — esta activación solo pide el correo. */
const Registro = ({ onSubmit }: RegistroProps) => {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cambiar = (e: ChangeEvent<HTMLInputElement>) => {
    setCorreo(e.target.value);
    if (error) setError(null);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = correo.trim().toLowerCase();
    if (!CORREO.test(limpio)) {
      setError("Escriba un correo válido");
      return;
    }
    onSubmit({ correo: limpio });
  };

  return (
    <Pantalla
      titulo={
        <>
          Ingrese su <em>correo</em>
        </>
      }
      subtitulo="Le enviaremos el enlace para descargar su póster"
      className="dt-registro"
    >
      <form className="dt-registro__form" onSubmit={enviar} noValidate>
        <label className="dt-registro__campo">
          <span className="dt-registro__etiqueta">Correo electrónico</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={80}
            placeholder="nombre@empresa.com"
            value={correo}
            onChange={cambiar}
            autoFocus
            aria-invalid={!!error}
          />
        </label>

        {/* Alto reservado: sin esto la tarjeta salta al aparecer el error. */}
        <p className="dt-registro__error" role="alert">
          {error}
        </p>

        <Boton type="submit" className="dt-registro__enviar">
          Comenzar
        </Boton>
      </form>
    </Pantalla>
  );
};

export default Registro;
