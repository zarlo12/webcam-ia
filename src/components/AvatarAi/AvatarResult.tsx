import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/electrolux/logo.png";

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
  const hasUploadedRef = useRef(false);

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

      try {
        const storageRef = ref(
          storage,
          `electrolux/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

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
        //console.log("🚀 ~ datosFirestore:", datosFirestore);
        await addDoc(collection(db, "Electrolux"), datosFirestore);
        setUploadedImageUrl(downloadURL);
      } catch (error) {
        console.error("Error al subir imagen:", error);
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
              <div style={{ color: "#041e50" }}>@electrolux</div>
            </h2>
            <button
              type="button"
              className="button btnResult"
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
