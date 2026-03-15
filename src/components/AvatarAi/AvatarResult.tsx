import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";

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
    </div>
  );
};

export default AvatarResult;
