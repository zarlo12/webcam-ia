import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/img/logoScotia.png";
import logoVigilado from "../../assets/img/vigilado.png";
import { storage, db } from "../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface AvatarResultProps {
  email: string;
  nombre: string;
  cedula: string;
  consentimiento: string;
  imageUrl: string; // Imagen ya fusionada
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({
  email,
  nombre,
  cedula,
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
          `avatars_test/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        const datosFirestore = {
          email,
          nombre,
          cedula,
          imageUrl: downloadURL,
          date: new Date(),
          consentimientoAceptado: consentimiento ? "Sí" : "No",
          correoEnviado: false,
        };
        console.log("🚀 ~ datosFirestore:", datosFirestore);
        await addDoc(collection(db, "imagenesTest"), datosFirestore);
        setUploadedImageUrl(downloadURL);
      } catch (error) {
        console.error("Error al subir imagen:", error);
      }
    },
    [email, nombre, cedula, consentimiento]
  );

  useEffect(() => {
    if (!hasUploadedRef.current) {
      uploadMergedImage(imageUrl);
    }
  }, [imageUrl, uploadMergedImage]); // Ahora `useEffect` tiene todas  sus dependencias

  return (
    <div className="containerResultFinal">
      <div className="header-bar">
        <img src={logo} alt="Logo Scotia" className="logo-scotia" />
      </div>

      <div className="main-content">
        <div className="result-wrapper">
          <div className="card">
            <h2 className="subtitle">Soy lo que sueño ser</h2>
            <div className="avatar-container">
              <img
                src={uploadedImageUrl}
                className="avatar"
                alt="Avatar generado"
              />
            </div>
            <h2 className="subtitle">
              Descarga la imagen desde tu correo y comparte en redes sociales.
              <br />
              Etiqueta @cetcolsubsidio en Instagram.
            </h2>
            <button
              type="button"
              className="button"
              onClick={onReset}
              style={{ width: "250px" }}
            >
              Empezar de nuevo
            </button>
          </div>
        </div>
      </div>

      <div className="footerAlways">
        <img src={logoVigilado} alt="Logo Vigilado" className="logo" />
      </div>
    </div>
  );
};

export default AvatarResult;
