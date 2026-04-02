import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logo_final.png";
import { QRCodeSVG } from "qrcode.react";

import { storage, db } from "../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface AvatarResultProps {
  email: string;
  name: string;
  nombreEmpresa: string;
  cargo: string;
  telephone: string;
  terms: boolean;
  imageUrl: string; // Imagen generada con IA
  originalImageUrl: string; // Imagen original capturada
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({
  email,
  nombreEmpresa,
  cargo,
  name,
  telephone,
  terms,
  imageUrl,
  originalImageUrl,
  onReset,
}) => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Generando avatar...");
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const hasUploadedRef = useRef(false);

  // Función helper para convertir URL HTTP a data URL
  const convertUrlToDataUrl = async (url: string): Promise<string> => {
    // Si ya es una data URL, retornarla directamente
    if (url.startsWith('data:')) {
      return url;
    }

    // Si es una URL HTTP, descargarla y convertirla
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error al convertir URL a data URL:", error);
      throw error;
    }
  };

 

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string, originalDataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

      try {
        setIsLoading(true);
        setLoadingMessage("Descargando imagen generada...");

        // Convertir URLs a data URLs si es necesario
        const aiDataUrl = await convertUrlToDataUrl(dataUrl);
        const originalDataUrlConverted = await convertUrlToDataUrl(originalDataUrl);

        setLoadingMessage("Subiendo imagen generada...");

        // Subir imagen generada con IA
        const storageRef = ref(
          storage,
          `CircoTerror2026/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, aiDataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        setLoadingMessage("Subiendo imagen original...");

        // Subir imagen original
        const originalStorageRef = ref(
          storage,
          `CircoTerror2026/original-${email}-${Date.now()}.png`
        );
        await uploadString(originalStorageRef, originalDataUrlConverted, "data_url");
        const originalDownloadURL = await getDownloadURL(originalStorageRef);

        setLoadingMessage("Guardando en base de datos...");

        // Datos para Firestore con ambas imágenes
        const datosFirestore = {
          email: email,
          name: name,
          nombreEmpresa: nombreEmpresa,
          cargo: cargo,
          telephone: telephone,
          terms: terms,
          imageUrl: downloadURL, // Imagen generada con IA
          imagenOriginal: originalDownloadURL, // Imagen original capturada
          date: new Date(),
        };

        console.log("🚀 ~ datosFirestore:", datosFirestore);

        // Guardar en Firestore
        await addDoc(collection(db, "CasaReina1"), datosFirestore);
        
        setLoadingMessage("¡Listo!");
        setUploadedImageUrl(downloadURL);
        
        // Esperar un poco antes de ocultar el loading para mostrar el mensaje de éxito
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error("Error al subir imágenes:", error);
        setLoadingMessage("Error al guardar");
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    },
    [email, nombreEmpresa, cargo, name, telephone, terms]
  );

  useEffect(() => {
    if (!hasUploadedRef.current) {
      uploadMergedImage(imageUrl, originalImageUrl);
    }
  }, [imageUrl, originalImageUrl, uploadMergedImage]);

  return (
    <div className="containerResultFinal">
      <div className="header-bar">
        <img src={logo} alt="Logo" className="logo-scotia" />
      </div>

      <div className="main-content">
        <div className="result-wrapper">
          <div className="card">
            {isLoading ? (
              // Loading State
              <div className="loading-container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                minHeight: '300px'
              }}>
                <div className="loading-spinner" style={{
                  width: '70px',
                  height: '70px',
                  border: '5px solid rgba(13, 13, 13, 0.3)',
                  borderTop: '5px solid #D4AF37',
                  borderRight: '5px solid #DC143C',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(212, 175, 55, 0.6), 0 0 50px rgba(220, 20, 60, 0.4)'
                }}></div>
                <p style={{
                  color: '#FFFAF0',
                  fontSize: '20px',
                  fontWeight: '700',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  margin: '0',
                  textShadow: '0 0 15px rgba(220, 20, 60, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)',
                  letterSpacing: '1px'
                }}>
                  {loadingMessage}
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              // Result State
              <>
                <div className="avatar-container">
                  <img
                    src={uploadedImageUrl}
                    className="avatar"
                    alt="Avatar generado"
                  />
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
              </>
            )}
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
              maxWidth: '400px',
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
              <h2 style={{
                fontSize: '28px',
                fontWeight: '900',
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                textTransform: 'uppercase',
                color: '#DC143C',
                marginBottom: '10px',
                marginTop: 0,
                textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.9)',
                letterSpacing: '2px'
              }}>
                📱 Descarga tu Foto
              </h2>
              
           

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '3px solid #D4AF37',
                borderRadius: '15px',
                marginBottom: '20px',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(139, 0, 0, 0.1)'
              }}>
                <QRCodeSVG 
                  value={uploadedImageUrl}
                  size={220}
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
