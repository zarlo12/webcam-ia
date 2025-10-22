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
          `claro-empresas2025/${email}-${Date.now()}.png`
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
        await addDoc(collection(db, "Claro-empresas2025"), datosFirestore);
        
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
                  borderTop: '4px solid #007bff',
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
                <h2 className="subtitleResult">
                  Comparte esta imagen 
                  <br />en Instagram y etiquétanos 
                  <br />
                  <div style={{ color: "#041e50" }}>@electrolux_co</div>
                </h2>
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
