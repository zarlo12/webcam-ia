import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/empresas.png";

import { storage, db } from "../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface AvatarResultProps {
  caracteristicas: string;
  comprar: string;
  email: string;
  marca: string;
  name: string;
  origem: string;
  rangoEdad: string;
  renovar: string;
  telephone: string;
  terms: boolean;
  imageUrl: string; // Imagen ya fusionada
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({
  caracteristicas,
  comprar,
  email,
  marca,
  name,
  origem,
  rangoEdad,
  renovar,
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
          `ClaroEmpresasNavidad/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        setLoadingMessage("Generando avatar...");

        // Datos para Firestore
        const datosFirestore = {
          Caracteristicas: caracteristicas,
          Comprar: comprar,
          email: email,
          marca: marca,
          name: name,
          origem: origem,
          rangoEdad: rangoEdad,
          renovar: renovar,
          telephone: telephone,
          terms: terms,
          imageUrl: downloadURL,
          date: new Date(),
        };

  

        console.log("🚀 ~ datosFirestore:", datosFirestore);
        // console.log("🚀 ~ datosCRM:", datosCRM);

        // Guardar en Firestore
        await addDoc(collection(db, "ClaroEmpresasNavidad"), datosFirestore);
        
        setLoadingMessage("Generando avatar...");

        
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
    [caracteristicas, comprar, email, marca, name, origem, rangoEdad, renovar, telephone, terms]
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
                  border: '4px solid rgba(255, 215, 0, 0.2)',
                  borderTop: '4px solid #FFD700',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '20px',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}></div>
                <p style={{
                  color: '#FFD700',
                  fontSize: '28px',
                  fontWeight: '800',
                  textAlign: 'center',
                  margin: '0',
                  textShadow: '0 3px 6px rgba(196, 30, 58, 0.6), 0 0 15px rgba(255, 215, 0, 0.4)',
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
                </div> <br/><br/><br/>
                {/* <h2 className="subtitleResult">
                  Comparte esta imagen 
                  <br />en Instagram y etiquétanos 
                  <br />
                  <div style={{ color: "#041e50" }}>@electrolux_co</div>
                </h2> */}
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
