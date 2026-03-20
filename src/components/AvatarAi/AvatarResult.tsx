import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";
import QRCode from "react-qr-code";

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
  imageUrl: string; // Imagen ya fusionada
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
  onReset,
}) => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Generando avatar...");
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const hasUploadedRef = useRef(false);

 

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

      try {
        setIsLoading(true);
        setLoadingMessage("Generando avatar...");

        const storageRef = ref(
          storage,
          `claro-mundial2026/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        setLoadingMessage("Generando avatar...");

        // Datos para Firestore
        const datosFirestore = {
         
          email: email,
          name: name,
          nombreEmpresa: nombreEmpresa,
          cargo: cargo,
          telephone: telephone,
          terms: terms,
          imageUrl: downloadURL,
          date: new Date(),
        };

        // Datos para el CRM de VTEX (sin imageUrl y date)
       

        console.log("🚀 ~ datosFirestore:", datosFirestore);
        // console.log("🚀 ~ datosCRM:", datosCRM);

        // Guardar en Firestore
        await addDoc(collection(db, "Claro-empresas-mundial-tarjeta"), datosFirestore);
        
        setLoadingMessage("Generando avatar...");
        
        // Enviar al CRM de VTEX
        //await sendToVTEXCRM(datosCRM);
        
        setLoadingMessage("¡Listo!");
        setUploadedImageUrl(downloadURL);
        
        // Esperar un poco antes de ocultar el loading para mostrar el mensaje de éxito
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error("Error al subir imagen:", error);
        setLoadingMessage("Error al guardar");
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    },
    [ email, nombreEmpresa, cargo, name, telephone, terms]
  );

  useEffect(() => {
    if (!hasUploadedRef.current) {
      uploadMergedImage(imageUrl);
    }
  }, [imageUrl, uploadMergedImage]);

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
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '15px', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <button
                    type="button"
                    className="button"
                    onClick={onReset}
                    style={{ width: "250px", margin: 0 }}
                  >
                    Generar nueva
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setShowQRModal(true)}
                    style={{ width: "250px", margin: 0 }}
                  >
                    Ver QR
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de QR */}
      {showQRModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '90%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px 10px',
                lineHeight: '1',
              }}
            >
              ×
            </button>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: '600' }}>
              Escanea el QR
            </h2>
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '10px',
              border: '2px solid #f0f0f0',
            }}>
              <QRCode
                value={uploadedImageUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <p style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '16px',
              margin: 0,
              maxWidth: '300px',
            }}>
              Escanea este código QR con tu celular para descargar la imagen
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarResult;
