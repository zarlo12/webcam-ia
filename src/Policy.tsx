import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Policy = ({ onBack }: { onBack: () => void }) => {
  const location = useLocation();
  const showBackButton = location.pathname !== "/aviso_privacidad";

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSmallScreen = windowWidth < 400;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const cardStyle: React.CSSProperties = {
    position: "relative",
    background: "white",
    padding: isSmallScreen ? "20px" : "40px",
    borderRadius: "8px",
    textAlign: "justify",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    maxHeight: "80vh",
    maxWidth: "600px",
    width: "90%",
    overflowY: "auto",
  };

  const titleStyle: React.CSSProperties = {
    marginBottom: "20px",
    fontSize: isSmallScreen ? "20px" : "24px",
  };



  const listStyle: React.CSSProperties = {
    marginBottom: "15px",
    paddingLeft: "20px",
    fontSize: isSmallScreen ? "14px" : "16px",
    lineHeight: "1.5",
  };



  const buttonStyle: React.CSSProperties = {
    padding: isSmallScreen ? "8px 16px" : "10px 20px",
    fontSize: isSmallScreen ? "14px" : "16px",
    background: "#422E83",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "transparent",
    border: "none",
    fontSize: isSmallScreen ? "20px" : "24px",
    cursor: "pointer",
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  };

  return (
    <div style={overlayStyle} onClick={onBack}>
      <div style={cardStyle} onClick={handleCardClick}>
        <button style={closeButtonStyle} onClick={onBack} aria-label="Cerrar">
          &times;
        </button>

        <section>
          <h1 style={titleStyle}>
            AVISO DE PRIVACIDAD Y AUTORIZACIÓN DE USO DE IMAGEN
          </h1>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, se informa que los datos personales e imagen recabados a través del servicio de tótem con avatar de inteligencia artificial (IA) serán tratados conforme a las siguientes políticas:
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            1. Finalidad del tratamiento
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            Los datos personales e imagen se utilizan exclusivamente para:
          </p>
          <ul style={listStyle}>
            <li>Capturar una fotografía del usuario mediante el tótem.</li>
            <li>Procesar la imagen para generar un avatar de inteligencia artificial.</li>
            <li>Enviar la imagen/avatar al correo electrónico proporcionado por el usuario.</li>
            <li>Llevar un registro interno de las interacciones para control de calidad, soporte y mejora del servicio.</li>
            <li>Cumplir con disposiciones legales aplicables en México.</li>
          </ul>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            No se utilizarán los datos personales ni la imagen para fines distintos a los mencionados, salvo que se obtenga nuevamente el consentimiento del titular.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            2. Datos recolectados
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            El servicio podrá recolectar:
          </p>
          <ul style={listStyle}>
            <li>Datos de contacto: nombre, correo electrónico.</li>
            <li>Imagen personal: fotografía tomada por el tótem.</li>
            <li>Metadatos técnicos derivados de la captura (fecha, hora, ubicación aproximada).</li>
          </ul>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            3. Base legal y consentimiento
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            El tratamiento se realiza con el consentimiento expreso del titular, otorgado al momento de usar el servicio y aceptar este aviso de privacidad. El usuario manifiesta que la imagen y datos proporcionados son de su titularidad y autoriza su tratamiento para las finalidades aquí descritas.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            4. Uso de imagen
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            El usuario autoriza a que su imagen sea procesada exclusivamente con fines de creación del avatar IA y envío del mismo al correo indicado.
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            En caso de que se requiera utilizar la imagen o el avatar para fines promocionales o de portafolio, se solicitará una autorización adicional por escrito o por medios electrónicos verificables.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            5. Transferencia de datos
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            No se transferirán datos personales ni imágenes a terceros sin autorización previa, salvo por requerimiento legal o autoridades competentes.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            6. Medidas de seguridad
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            Se implementan medidas administrativas, técnicas y físicas para proteger los datos contra daño, pérdida, alteración, destrucción o uso no autorizado.
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Los datos serán eliminados de los sistemas en un plazo máximo de 30 días posteriores a la entrega del avatar.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            7. Ejercicio de derechos ARCO
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            El titular podrá ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO), así como revocar su consentimiento, enviando una solicitud al correo electrónico habilitado para este fin.
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            La solicitud deberá contener: nombre, medio de contacto, descripción clara de la solicitud y copia de una identificación oficial vigente.
          </p>

          <h2 style={{ fontSize: isSmallScreen ? "16px" : "18px", marginTop: "20px", marginBottom: "10px", color: "#422E83" }}>
            8. Cambios al aviso de privacidad
          </h2>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Cualquier cambio a este aviso será publicado en los medios que se consideren pertinentes.
          </p>
        </section>

        {showBackButton && (
          <button style={buttonStyle} onClick={onBack}>
            Volver
          </button>
        )}
      </div>
    </div>
  );
};

export default Policy;
