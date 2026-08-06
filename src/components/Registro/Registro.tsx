import React, { useState } from 'react';
import './Registro.scss';
import fondo from '../../assets/claro/fondo_limpio.jpeg';
import useFullscreen from '../../hooks/useFullscreen';

export interface RegistroData {
  nombre: string;
  cedula: string;
  celular: string;
  correo: string;
}

interface RegistroProps {
  onSubmit: (data: RegistroData) => void;
}

const EMPTY: RegistroData = { nombre: '', cedula: '', celular: '', correo: '' };

const validate = (data: RegistroData): string | null => {
  if (data.nombre.trim().length < 3) return 'Escribe tu nombre completo';
  if (!/^\d{6,12}$/.test(data.cedula.trim())) return 'La cédula debe tener entre 6 y 12 dígitos';
  if (!/^\d{7,10}$/.test(data.celular.trim())) return 'El celular debe tener 10 dígitos';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.correo.trim())) return 'Escribe un correo válido';
  return null;
};

/** Pantalla 2: datos personales sobre el arte de campaña. */
const Registro: React.FC<RegistroProps> = ({ onSubmit }) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [data, setData] = useState<RegistroData>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof RegistroData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'cedula' || key === 'celular'
      ? e.target.value.replace(/\D/g, '')
      : e.target.value;
    setData(prev => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = validate(data);
    if (message) {
      setError(message);
      return;
    }
    onSubmit({
      nombre: data.nombre.trim(),
      cedula: data.cedula.trim(),
      celular: data.celular.trim(),
      correo: data.correo.trim().toLowerCase(),
    });
  };

  return (
    <div className="reg-screen">
      <div className="reg-bg" style={{ backgroundImage: `url(${fondo})` }} />
      <div className="reg-veil" aria-hidden="true" />

      <button onClick={toggleFullscreen} className="reg-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <form className="reg-form" onSubmit={handleSubmit} noValidate>
        <input
          className="reg-field"
          type="text"
          placeholder="Nombre"
          value={data.nombre}
          onChange={set('nombre')}
          autoComplete="name"
          autoFocus
          maxLength={60}
        />
        <input
          className="reg-field"
          type="text"
          inputMode="numeric"
          placeholder="Cédula"
          value={data.cedula}
          onChange={set('cedula')}
          maxLength={12}
        />
        <input
          className="reg-field"
          type="tel"
          inputMode="numeric"
          placeholder="Celular"
          value={data.celular}
          onChange={set('celular')}
          autoComplete="tel"
          maxLength={10}
        />
        <input
          className="reg-field"
          type="email"
          inputMode="email"
          placeholder="Correo"
          value={data.correo}
          onChange={set('correo')}
          autoComplete="email"
          maxLength={80}
        />

        {error && <p className="reg-error">{error}</p>}

        <button type="submit" className="reg-submit">Siguiente</button>
      </form>
    </div>
  );
};

export default Registro;
