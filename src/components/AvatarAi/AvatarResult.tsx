import React, { useState } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logo_final.png";
import { QRCodeSVG } from "qrcode.react";

interface AvatarResultProps {
  email: string;
  name: string;
  nombreEmpresa: string;
  cargo: string;
  telephone: string;
  terms: boolean;
  imageUrl: string; // Imagen generada con IA (ya guardada en Firebase)
  originalImageUrl: string; // Imagen original capturada
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({
  imageUrl,
  onReset,
}) => {
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Función para entrar/salir de pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  return (
    <div className="containerResultFinal">
      {/* Botón discreto de pantalla completa */}
      <button
        onClick={toggleFullscreen}
        className="fullscreen-button"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? "⛶" : "⛶"}
      </button>

      <div className="header-bar">
        <img src={logo} alt="Logo" className="logo-scotia" />
      </div>

      <div className="main-content">
        <div className="result-wrapper">
          <div className="card">
            {/* Muestra el resultado directamente - sin loading */}
            <div className="avatar-showcase">
              <div className="avatar-frame">
                <div className="avatar-glow-ring"></div>
                <div className="avatar-corner top-left"></div>
                <div className="avatar-corner top-right"></div>
                <div className="avatar-corner bottom-left"></div>
                <div className="avatar-corner bottom-right"></div>
                <img
                  src={imageUrl}
                  className="avatar-spectacular"
                  alt="Avatar generado"
                />
                <div className="avatar-shine"></div>
              </div>
            </div>
            
            {/* <h2 className="subtitleResult">
              Comparte esta imagen 
              <br />en Instagram y etiquétanos 
              <br />
              <div style={{ color: "#041e50" }}>@electrolux_co</div>
            </h2> */}<br/> <br/>
            
            <button
              type="button"
              className="button btnResult"
              onClick={() => setShowQRModal(true)}
              style={{ 
                width: "250px",
                marginBottom: "25px",
                background: "linear-gradient(180deg, #D4AF37 0%, #C19A6B 100%)",
                color: "#1A1A1A",
                border: "3px solid #8B0000"
              }}
            >
              📱 Ver QR
            </button>
            
            <button
              type="button"
              className="button btnResult"
              onClick={onReset}
              style={{ width: "250px" }}
            >
              Nueva
            </button>
          </div>
        </div>
      </div>

      {/* Modal del Código QR */}
      {showQRModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div 
            style={{
              background: 'rgba(13, 13, 13, 0.95)',
              border: '3px solid #D4AF37',
              borderRadius: '15px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.7), 0 20px 80px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(139, 0, 0, 0.3)',
              animation: 'modalFadeIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'linear-gradient(180deg, #DC143C 0%, #8B0000 100%)',
                border: '2px solid #D4AF37',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#FFD700',
                lineHeight: '1',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, #FF1744 0%, #C62828 100%)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.8)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, #DC143C 0%, #8B0000 100%)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>

            {/* Contenido del modal */}
            <div style={{ textAlign: 'center' }}>
              
              
           

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '30px',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '3px solid #D4AF37',
                borderRadius: '15px',
                marginBottom: '20px',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(139, 0, 0, 0.1)'
              }}>
                <QRCodeSVG 
                  value={imageUrl}
                  size={450}
                  level="H"
                  includeMargin={true}
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>

            

            </div>
          </div>

          <style>{`
            @keyframes modalFadeIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AvatarResult;
