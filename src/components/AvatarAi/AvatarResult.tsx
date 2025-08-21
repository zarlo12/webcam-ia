import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AvatarPhoto.scss";
import logo from "../../assets/clarosport/Logo.png";

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
  selectedService?: string; // Servicio seleccionado del cuestionario
  onReset: () => void;
}

const AvatarResult: React.FC<AvatarResultProps> = ({
  email,
  nombre,
  ciudad,
  formulario,
  consentimiento,
  imageUrl,
  selectedService,
  onReset,
}) => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(imageUrl);
  const hasUploadedRef = useRef(false);

  // Mapeo de servicios a información del avatar
  const avatarInfo: { [key: string]: { name: string; description: string; icon: string } } = {
    "15 minutos": {
      name: "Icono de Tendencia",
      description: "Un experto en moda, farándula y entretenimiento que siempre está al tanto de las últimas tendencias.",
      icon: "✨"
    },
    "reaserch": {
      name: "El Estratega de Datos",
      description: "El analista que busca insights en la investigación y los sondeos para tomar decisiones informadas.",
      icon: "📊"
    },
    "plaza claro": {
      name: "El Comprador Curioso",
      description: "Un amante de las compras, el entretenimiento y la gastronomía, que encuentra todo lo que necesita en un solo lugar.",
      icon: "🛍️"
    },
    "Un café claro": {
      name: "El Explorador de la Actualidad",
      description: "Un curioso por naturaleza que disfruta de temas variados, tecnología, actualidad y un buen magazín.",
      icon: "☕"
    },
    "Salud 1010": {
      name: "El Guardián del Bienestar",
      description: "La persona que prioriza la salud, el bienestar y siempre está buscando maneras de cuidarse a sí mismo y a los demás.",
      icon: "💪"
    },
    "Claro Musica": {
      name: "El Ritmo Urbano",
      description: "Un fanático de los géneros musicales más modernos, desde el urbano hasta el tropipop, siempre con los audífonos puestos.",
      icon: "🎵"
    },
    "portal redmas.com.co": {
      name: "El Analista Web",
      description: "Un lector ávido de noticias, economía y política, que prefiere informarse a través de un portal web completo y detallado.",
      icon: "💻"
    },
    "mobile marketing": {
      name: "El Conector Digital",
      description: "Un perfil que vive conectado a su dispositivo móvil, dominando las redes sociales y el consumo de contenido en su smartphone.",
      icon: "📱"
    },
    "radiola tv": {
      name: "La Estrella del Folclor",
      description: "El conocedor de la música popular, que valora las melodías tradicionales y los éxitos que han marcado generaciones.",
      icon: "🎸"
    },
    "Sin Limites tv": {
      name: "El Visionario Musical",
      description: "Un melómano de corazón que explora géneros musicales de todo el mundo, con un gusto particular por la música anglo.",
      icon: "🎧"
    }
  };

  // Obtener información del avatar basada en el servicio seleccionado
  const currentAvatar = selectedService ? avatarInfo[selectedService] : null;

  // Memoiza la función para evitar que cambie en cada render
  const uploadMergedImage = useCallback(
    async (dataUrl: string) => {
      if (hasUploadedRef.current) return;
      hasUploadedRef.current = true;

      try {
        const storageRef = ref(
          storage,
          `colgate/${email}-${Date.now()}.png`
        );
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadURL = await getDownloadURL(storageRef);

        const datosFirestore = {
          email,
          nombre,
          ciudad,
          formulario,
          imageUrl: downloadURL,
          date: new Date(),
          consentimientoAceptado: consentimiento ? "Sí" : "No",
          correoEnviado: false,
        };
        console.log("🚀 ~ datosFirestore:", datosFirestore);
        await addDoc(collection(db, "Colgate"), datosFirestore);
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
            {/* <h2 className="subtitleResult">AVATAR IA</h2> */}
            <div className="avatar-container">
              <img
                src={uploadedImageUrl}
                className="avatar"
                alt="Avatar generado"
              />
            </div>
            
            {/* Información del Avatar basada en el servicio seleccionado */}
            {currentAvatar && (
              <div className="avatar-info">
                <div className="avatar-header">
                  <span className="avatar-icon">{currentAvatar.icon}</span>
                  <h3 className="avatar-name">{currentAvatar.name}</h3>
                </div>
                <p className="avatar-description">{currentAvatar.description}</p>
              </div>
            )}
            
            <h2 className="subtitleResult">
              ¡Comparte esta imagen 
              <br />en Instagram y etiquétanos!
              {/* <br />
              <div style={{ color: "#e1171b" }}>@pastaslamuneca</div> */}
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
