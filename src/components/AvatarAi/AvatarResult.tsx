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

      <div style={{ textAlign: 'center', padding: '16px 20px 0' }}>
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: '#C9386E',
          border: '1px solid rgba(201,56,110,0.35)',
          background: 'rgba(201,56,110,0.06)',
          padding: '4px 16px',
          borderRadius: '20px',
          marginBottom: '10px',
        }}>
          🌸 10 DE MAYO 🌸
        </div>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(22px, 3.5vw, 36px)',
          fontWeight: 700,
          color: '#3D1A26',
          margin: 0,
          lineHeight: 1.2,
        }}>
          ¡Tu recuerdo está listo!
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#7A4A5A',
          margin: '6px 0 0',
          letterSpacing: '1px',
        }}>
          Feliz Día de las Madres 💐
        </p>
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
              <img src={imageUrl} className="avatar-spectacular" alt="Tu recuerdo del Día de las Madres" />
              <div className="avatar-shine" />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <button
              type="button"
              className="button btnResult"
              onClick={() => setShowQRModal(true)}
              style={{
                marginRight: '14px',
                background: 'transparent',
                border: '2px solid #C9386E',
                color: '#C9386E',
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
              NUEVA FOTO 📸
            </button>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '10px',
        fontSize: '12px',
        letterSpacing: '2px',
        color: 'rgba(122,74,90,0.35)',
      }}>
        — 💐 con amor · día de las madres —
      </div>

      {showQRModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(61,26,38,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(201,56,110,0.3)',
              borderRadius: '20px',
              padding: '36px',
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(201,56,110,0.2)',
              animation: 'modalFadeIn 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #C9386E, #C49A38, #E8749A)',
              borderRadius: '20px 20px 0 0',
            }} />

            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none',
                border: '1px solid rgba(201,56,110,0.25)',
                borderRadius: '8px',
                width: '32px', height: '32px', fontSize: '16px',
                cursor: 'pointer', color: '#7A4A5A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>

            <p style={{
              textAlign: 'center', color: '#7A4A5A',
              fontSize: '11px', letterSpacing: '2px',
              textTransform: 'uppercase', marginBottom: '20px',
              marginTop: '4px',
            }}>
              Escanea para descargar tu foto
            </p>

            <div style={{
              display: 'flex', justifyContent: 'center',
              padding: '16px',
              background: '#FFF5F8',
              borderRadius: '10px',
              border: '1px solid rgba(201,56,110,0.12)',
            }}>
              <QRCodeSVG
                value={imageUrl}
                size={340}
                level="H"
                marginSize={2}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <p style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '12px',
              color: 'rgba(122,74,90,0.5)',
            }}>
              💐 Feliz Día de las Madres
            </p>
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
