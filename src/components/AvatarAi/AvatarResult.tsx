import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";
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

 

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string, originalDataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

      try {
        setIsLoading(true);
        setLoadingMessage("Subiendo imagen generada...");

        // Subir imagen generada con IA
        const storageRef = ref(
          storage,
          `CasaReina1/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        setLoadingMessage("Subiendo imagen original...");

        // Subir imagen original
        const originalStorageRef = ref(
          storage,
          `CasaReina1/original-${email}-${Date.now()}.png`
        );
        await uploadString(originalStorageRef, originalDataUrl, "data_url");
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
                  width: '60px',
                  height: '60px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #f91b00',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '20px'
                }}></div>
                <p style={{
                  color: '#333',
                  fontSize: '18px',
                  fontWeight: '500',
                  textAlign: 'center',
                  margin: '0'
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
                    marginBottom: "15px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
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
                  Generar nueva
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
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '400px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
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
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                lineHeight: '1',
                padding: '5px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f91b00'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
            >
              ×
            </button>

            {/* Contenido del modal */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px',
                marginTop: 0
              }}>
                📱 Descarga tu Foto
              </h2>
              
              <p style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '25px',
                lineHeight: '1.5'
              }}>
                Escanea el código QR con la cámara de tu celular para descargar la imagen
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '15px',
                marginBottom: '20px'
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

              <div style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: '#1976d2',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  💡 <strong>Tip:</strong> Abre la app de cámara nativa de tu celular y apunta al código QR. Se abrirá automáticamente el enlace.
                </p>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Cerrar
              </button>
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
