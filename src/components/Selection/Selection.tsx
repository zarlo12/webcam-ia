import React, { useState } from 'react';
import './Selection.scss';

type Gender = 'hombre' | 'mujer';
type CharacterStyle = 'guerrero' | 'cyberpunk';

interface SelectionProps {
  nombre: string;
  apellidos: string;
  email: string;
  direccion: string;
  terms: boolean;
  gender: Gender;
  characterStyle: CharacterStyle;
  onNombreChange: (v: string) => void;
  onApellidosChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onDireccionChange: (v: string) => void;
  onTermsChange: (v: boolean) => void;
  onGenderChange: (v: Gender) => void;
  onStyleChange: (v: CharacterStyle) => void;
  onShowPolicy: () => void;
  onNext: () => void;
}

const Selection: React.FC<SelectionProps> = ({
  nombre, apellidos, email, direccion, terms, gender, characterStyle,
  onNombreChange, onApellidosChange, onEmailChange, onDireccionChange,
  onTermsChange, onGenderChange, onStyleChange, onShowPolicy: _onShowPolicy, onNext,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'Requerido';
    if (!apellidos.trim()) newErrors.apellidos = 'Requerido';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    if (!terms) newErrors.terms = 'Debes aceptar los términos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext();
  };

  return (
    <div className="sel-container">
      <button onClick={toggleFullscreen} className="sel-fullscreen-btn" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="sel-bg-lines" aria-hidden="true">
        <div className="sel-line sel-line-1" />
        <div className="sel-line sel-line-2" />
        <div className="sel-line sel-line-3" />
      </div>

      <div className="sel-content">
        <div className="sel-header">
          <span className="sel-tag">PLAYER ONE</span>
          <img
            src="/referencias/titulo.png"
            alt="Desbloquea Tu Poder"
            className="sel-titulo-img"
          />
          <p className="sel-subtitle">es tu turno de jugar</p>
        </div>

        <form className="sel-form" onSubmit={handleSubmit} noValidate>
          <div className="sel-section">
            <h3 className="sel-section-title">Ingresa tus datos</h3>

            <div className="sel-fields">
              <div className="sel-field">
                <input
                  className={`sel-input${errors.nombre ? ' sel-input--error' : ''}`}
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={e => onNombreChange(e.target.value)}
                />
                {errors.nombre && <span className="sel-error">{errors.nombre}</span>}
              </div>

              <div className="sel-field">
                <input
                  className={`sel-input${errors.apellidos ? ' sel-input--error' : ''}`}
                  type="text"
                  placeholder="Apellidos"
                  value={apellidos}
                  onChange={e => onApellidosChange(e.target.value)}
                />
                {errors.apellidos && <span className="sel-error">{errors.apellidos}</span>}
              </div>

              <div className="sel-field">
                <input
                  className={`sel-input${errors.email ? ' sel-input--error' : ''}`}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => onEmailChange(e.target.value)}
                />
                {errors.email && <span className="sel-error">{errors.email}</span>}
              </div>

              <div className="sel-field">
                <input
                  className="sel-input"
                  type="text"
                  placeholder="Dirección"
                  value={direccion}
                  onChange={e => onDireccionChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="sel-section">
            <h3 className="sel-section-title">Elige tu personaje</h3>

            <div className="sel-selector">
              <label className="sel-selector-label">Género</label>
              <div className="sel-options">
                <button
                  type="button"
                  className={`sel-option-btn${gender === 'mujer' ? ' sel-option-btn--active' : ''}`}
                  onClick={() => onGenderChange('mujer')}
                >
                  MUJER
                </button>
                <button
                  type="button"
                  className={`sel-option-btn${gender === 'hombre' ? ' sel-option-btn--active' : ''}`}
                  onClick={() => onGenderChange('hombre')}
                >
                  HOMBRE
                </button>
              </div>
            </div>

            <div className="sel-selector">
              <label className="sel-selector-label">Estilo</label>
              <div className="sel-options">
                <button
                  type="button"
                  className={`sel-option-btn${characterStyle === 'guerrero' ? ' sel-option-btn--active' : ''}`}
                  onClick={() => onStyleChange('guerrero')}
                >
                  GUERRERO
                </button>
                <button
                  type="button"
                  className={`sel-option-btn${characterStyle === 'cyberpunk' ? ' sel-option-btn--active' : ''}`}
                  onClick={() => onStyleChange('cyberpunk')}
                >
                  CYBERPUNK
                </button>
              </div>
            </div>
          </div>

          <div className={`sel-terms${errors.terms ? ' sel-terms--error' : ''}`}>
            <input
              type="checkbox"
              id="terms-check"
              className="sel-checkbox"
              checked={terms}
              onChange={e => onTermsChange(e.target.checked)}
            />
            <label htmlFor="terms-check" className="sel-terms-label">
              Acepto el{' '}
              <button type="button" className="sel-policy-link" onClick={() => setShowPolicyModal(true)}>
                tratamiento de datos personales
              </button>
            </label>
          </div>
          {errors.terms && <span className="sel-error sel-error--center">{errors.terms}</span>}

          <button type="submit" className="sel-submit-btn">
            CONTINUAR →
          </button>
        </form>

        <div className="sel-footer">
          <span className="sel-footer-brand">— Claro gaming —</span>
        </div>
      </div>

      {showPolicyModal && (
        <div className="sel-modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="sel-modal" onClick={e => e.stopPropagation()}>
            <div className="sel-modal-header">
              <span className="sel-modal-title">POLÍTICA DE TRATAMIENTO DE DATOS</span>
              <button className="sel-modal-close" onClick={() => setShowPolicyModal(false)}>✕</button>
            </div>
            <div className="sel-modal-body">
              <iframe
                src="/aviso.html"
                title="Tratamiento de Datos Personales"
                className="sel-modal-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Selection;
