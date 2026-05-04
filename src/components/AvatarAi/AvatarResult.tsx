import React, { useState } from "react";
import "./AvatarPhoto.scss";
import { QRCodeSVG } from "qrcode.react";

interface AvatarResultProps {
  imageUrl: string;
  originalImageUrl: string;
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({ imageUrl, onReset }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="containerResultFinal">
      <button onClick={toggleFullscreen} className="fullscreen-button" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="header-bar" />

      <div style={{ textAlign: 'center', padding: '20px 0 0' }}>
        <h1 style={{
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(24px, 4vw, 42px)',
          fontWeight: 900,
          letterSpacing: '3px',
          color: '#FFFFFF',
          margin: 0,
          textTransform: 'uppercase',
        }}>
          ESTÁS LISTO PARA
        </h1>
        <h1 style={{
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(28px, 5vw, 50px)',
          fontWeight: 900,
          letterSpacing: '3px',
          color: '#E30613',
          margin: '4px 0 0',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(227,6,19,0.6)',
        }}>
          EL JUEGO
        </h1>
      </div>

      <div className="result-wrapper">
        <div>
          <div className="avatar-showcase">
            <div className="avatar-frame">
              <div className="avatar-glow-ring" />
              <div className="avatar-corner top-left" />
              <div className="avatar-corner top-right" />
              <div className="avatar-corner bottom-left" />
              <div className="avatar-corner bottom-right" />
              <img src={imageUrl} className="avatar-spectacular" alt="Tu personaje" />
              <div className="avatar-shine" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              className="button btnResult"
              onClick={() => setShowQRModal(true)}
              style={{
                marginRight: '16px',
                background: 'transparent',
                border: '1px solid #E30613',
                color: '#E30613',
                boxShadow: 'none',
              }}
            >
              VER QR
            </button>
            <button
              type="button"
              className="button btnResult"
              onClick={onReset}
            >
              NUEVA FOTO
            </button>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '12px',
        fontSize: '12px',
        letterSpacing: '3px',
        color: 'rgba(255,255,255,0.2)',
        textTransform: 'uppercase',
      }}>
        — Claro gaming —
      </div>

      {showQRModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid #E30613',
              borderRadius: '4px',
              padding: '36px',
              maxWidth: '520px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 0 60px rgba(227,6,19,0.3)',
              animation: 'modalFadeIn 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#E30613', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', fontSize: '20px',
                cursor: 'pointer', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>

            <p style={{
              textAlign: 'center', color: '#AAAAAA',
              fontSize: '11px', letterSpacing: '3px',
              textTransform: 'uppercase', marginBottom: '20px',
            }}>
              Escanea para descargar tu imagen
            </p>

            <div style={{
              display: 'flex', justifyContent: 'center',
              padding: '20px',
              background: '#FFFFFF',
              borderRadius: '3px',
            }}>
              <QRCodeSVG
                value={imageUrl}
                size={380}
                level="H"
                marginSize={2}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>

          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AvatarResult;
