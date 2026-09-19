import { useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import "./Registro.scss";
import Stage from "../../components/Stage/Stage";
import arte from "../../assets/summit/registro.png";
import { cajaToStyle, PROPORCIONES, ZONAS } from "../../config/summit";

export interface RegistroData {
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  autorizaDatos: boolean;
}

interface RegistroProps {
  onSubmit: (data: RegistroData) => void;
}

type CampoKey = "nombre" | "apellido" | "cedula" | "correo";

interface Campo {
  key: CampoKey;
  /** Repite el texto que viene pintado en el arte, que este input tapa. */
  placeholder: string;
  type: string;
  inputMode?: "numeric" | "email";
  autoComplete: string;
  maxLength: number;
  /** Solo dígitos: cédula. */
  soloDigitos?: boolean;
}

const CAMPOS: Campo[] = [
  { key: "nombre", placeholder: "Nombre", type: "text", autoComplete: "given-name", maxLength: 40 },
  { key: "apellido", placeholder: "Apellido", type: "text", autoComplete: "family-name", maxLength: 40 },
  {
    key: "cedula",
    placeholder: "Cédula",
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    maxLength: 12,
    soloDigitos: true,
  },
  { key: "correo", placeholder: "Correo", type: "email", inputMode: "email", autoComplete: "email", maxLength: 80 },
];

const VACIO: RegistroData = {
  nombre: "",
  apellido: "",
  cedula: "",
  correo: "",
  autorizaDatos: false,
};

const validar = (data: RegistroData): string | null => {
  if (data.nombre.trim().length < 2) return "Escriba su nombre";
  if (data.apellido.trim().length < 2) return "Escriba su apellido";
  if (!/^\d{6,12}$/.test(data.cedula.trim())) return "La cédula debe tener entre 6 y 12 dígitos";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.correo.trim())) return "Escriba un correo válido";
  if (!data.autorizaDatos) return "Debe autorizar el tratamiento de sus datos";
  return null;
};

/** Pantalla 1 — los campos del arte se cubren con inputs reales. */
const Registro = ({ onSubmit }: RegistroProps) => {
  const [data, setData] = useState<RegistroData>(VACIO);
  const [error, setError] = useState<string | null>(null);

  const zonas = ZONAS.registro;

  const set = (campo: Campo) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = campo.soloDigitos ? e.target.value.replace(/\D/g, "") : e.target.value;
    setData((prev) => ({ ...prev, [campo.key]: value }));
    if (error) setError(null);
  };

  const toggleAutorizacion = () => {
    setData((prev) => ({ ...prev, autorizaDatos: !prev.autorizaDatos }));
    if (error) setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mensaje = validar(data);
    if (mensaje) {
      setError(mensaje);
      return;
    }
    onSubmit({
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      cedula: data.cedula.trim(),
      correo: data.correo.trim().toLowerCase(),
      autorizaDatos: true,
    });
  };

  return (
    <Stage art={arte} ratio={PROPORCIONES.registro} className="registro">
      <form className="registro__form" onSubmit={handleSubmit} noValidate>
        {CAMPOS.map((campo, i) => (
          <input
            key={campo.key}
            className="registro__campo"
            style={
              {
                left: `${zonas.campoTexto.left}%`,
                width: `${zonas.campoTexto.width}%`,
                top: `${zonas.campos[i] + 0.5}%`,
                height: `${zonas.campoAlto - 1}%`,
              } as CSSProperties
            }
            type={campo.type}
            inputMode={campo.inputMode}
            autoComplete={campo.autoComplete}
            maxLength={campo.maxLength}
            placeholder={campo.placeholder}
            value={data[campo.key]}
            onChange={set(campo)}
            autoFocus={i === 0}
          />
        ))}

        <button
          type="button"
          className={`registro__casilla${data.autorizaDatos ? " registro__casilla--marcada" : ""}`}
          style={cajaToStyle(zonas.casilla)}
          onClick={toggleAutorizacion}
          role="checkbox"
          aria-checked={data.autorizaDatos}
          aria-label="Autorizo el tratamiento de mis datos personales"
        >
          <span aria-hidden="true">✓</span>
        </button>

        {/* El párrafo entero funciona como etiqueta de la casilla… */}
        <button
          type="button"
          className="registro__aviso"
          style={cajaToStyle(zonas.aviso)}
          onClick={toggleAutorizacion}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* …salvo las dos líneas subrayadas, que abren la política. */}
        {zonas.politica.map((caja, i) => (
          <a
            key={i}
            className="registro__politica"
            style={cajaToStyle(caja)}
            href="/aviso"
            target="_blank"
            rel="noreferrer"
            aria-label={i === 0 ? "Ver la Política de Tratamiento de Datos de Claro" : undefined}
            aria-hidden={i === 0 ? undefined : true}
            tabIndex={i === 0 ? 0 : -1}
          />
        ))}

        <button
          type="submit"
          className="registro__enviar"
          style={cajaToStyle(zonas.boton)}
          aria-label="Comenzar"
        />

        {error && (
          <p className="registro__error" style={cajaToStyle(zonas.error)} role="alert">
            {error}
          </p>
        )}
      </form>
    </Stage>
  );
};

export default Registro;
