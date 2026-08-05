import React, { useState } from "react";
import "./AvatarPhoto.scss";
import { QRCodeSVG } from "qrcode.react";
import fondo from "../../assets/claro/fondo.jpeg";
import useFullscreen from "../../hooks/useFullscreen";

interface AvatarResultProps {
  imageUrl: string;
  originalImageUrl: string;
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({ imageUrl, onReset }) => {
  const [showQRModal, setShowQRModal] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <div className="containerResultFinal">
      <div className="result-bg" style={{ backgroundImage: `url(${fondo})` }} />
      <div className="result-veil" aria-hidden="true" />

      <button onClick={toggleFullscreen} className="fullscreen-button" title="Pantalla completa">
        {isFullscreen ? '⛶' : '⛶'}
      </button>

      <div className="result-head">
        <h1>¡Tu foto está lista!</h1>
        <p>Antioquia nos enseña a llegar lejos</p>
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
              <img src={imageUrl} className="avatar-spectacular" alt="Tu foto de la campaña Antioquia" />
              <div className="avatar-shine" />
            </div>
          </div>

          <div className="result-actions">
            <button
              type="button"
              className="button button--ghost btnResult"
              onClick={() => setShowQRModal(true)}
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

      {showQRModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(24, 2, 8, 0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
            backdropFilter: 'blur(10px)',
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(255,170,180,0.4)',
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
              animation: 'modalFadeIn 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
              background: 'linear-gradient(90deg, #E30613, #FFC24A, #E30613)',
              borderRadius: '24px 24px 0 0',
            }} />

            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'none',
                border: '1px solid rgba(227,6,19,0.25)',
                borderRadius: '10px',
                width: '32px', height: '32px', fontSize: '16px',
                cursor: 'pointer', color: '#8A1018',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>

            <p style={{
              textAlign: 'center', color: '#8A1018',
              fontSize: '12px', letterSpacing: '2px',
              textTransform: 'uppercase', marginBottom: '20px',
              marginTop: '4px', fontWeight: 800,
            }}>
              Escanea para descargar tu foto
            </p>

            <div style={{
              display: 'flex', justifyContent: 'center',
              padding: '16px',
              background: '#FFF2F3',
              borderRadius: '14px',
              border: '1px solid rgba(227,6,19,0.12)',
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
              fontSize: '13px',
              fontWeight: 700,
              color: '#B0242C',
            }}>
              Antioquia nos enseña a llegar lejos
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
