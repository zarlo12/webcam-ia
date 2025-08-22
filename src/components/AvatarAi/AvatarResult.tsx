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
  const hasUploadedRef = useRef(false);

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

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
          ID: ciudad,
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
      }
    },
    [email, nombre, ciudad, formulario, consentimiento]
  );

  useEffect(() => {
    if (!hasUploadedRef.current) {
      uploadMergedImage(imageUrl);
    }
  }, [imageUrl, uploadMergedImage]); // Ahora `useEffect` tiene todas  sus dependencias

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
              <img
                src={uploadedImageUrl}
                className="avatar"
                alt="Avatar generado"
              />
            </div>
            {/* <h2 className="subtitleResult">
              Comparte esta imagen 
              <br />en Instagram y etiquetanos 
              <br />
              <div style={{ color: "#31afda" }}>@pastaslamuneca</div>
            </h2> */}
            <button
              type="button"
              className="button"
              onClick={onReset}
              style={{ width: "250px" }}
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
