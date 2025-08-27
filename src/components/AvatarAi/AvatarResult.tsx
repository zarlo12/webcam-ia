import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/xnova/LogoXnova.png";

import { storage, db } from "../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface AvatarResultProps {
  email: string;
  nombre: string;
  ciudad: string;
  formulario: string;
  consentimiento: string;
  imageUrl: string; // Imagen ya fusionada
  onReset: () => void;
}


const AvatarResult: React.FC<AvatarResultProps> = ({
  email,
  nombre,
  ciudad,
  formulario,
  consentimiento,
  imageUrl,
  onReset,
}) => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasUploadedRef = useRef(false);

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;
      setIsLoading(true);
      try {
        const storageRef = ref(
          storage,
          `XnovaGofest_avatars/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        const datosFirestore = {
          email,
          nombre,
          empresa: ciudad,
          telefono: formulario,
          imageUrl: downloadURL,
          date: new Date(),
          consentimientoAceptado: consentimiento ? "Sí" : "No",
          correoEnviado: false,
        };
        console.log("🚀 ~ datosFirestore:", datosFirestore);
        await addDoc(collection(db, "XnovaGofest"), datosFirestore);
        setUploadedImageUrl(downloadURL);
      } catch (error) {
        console.error("Error al subir imagen:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [email, nombre, ciudad, formulario, consentimiento]
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
            <h2 className="subtitleResult">AVATAR IA</h2>
            <div className="avatar-container">
              {isLoading ? (
                <div className="loading-indicator" style={{textAlign: "center", padding: "40px 0"}}>
                  <span style={{fontSize: 22}}>Guardando avatar...</span>
                  <br />
                  <div className="spinner" style={{margin: "20px auto", width: 40, height: 40, border: "4px solid #ccc", borderTop: "4px solid #31afda", borderRadius: "50%", animation: "spin 1s linear infinite"}} />
                </div>
              ) : (
                <img
                  src={uploadedImageUrl}
                  className="avatar"
                  alt="Avatar generado"
                />
              )}
            </div>
            <button
              type="button"
              className="button"
              onClick={onReset}
              style={{ width: "250px" }}
              disabled={isLoading}
            >
              Generar nueva
            </button>
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default AvatarResult;
