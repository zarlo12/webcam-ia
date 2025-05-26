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

  const textStyle: React.CSSProperties = {
    marginBottom: "15px",
    fontSize: isSmallScreen ? "14px" : "16px",
    lineHeight: "1.5",
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
    background: "#007bff",
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
            Consentimiento para Uso de Imagen y Tratamiento de Datos Personales
          </h1>
          <p style={textStyle}>
            Yo, por medio del presente autorizo a Grünenthal para:
          </p>
          <ol style={listStyle}>
            <li>
              Captura y uso de mi imagen mediante una fotografía que será procesada con inteligencia artificial para generar una representación visual tipo avatar con rasgos similares a los míos.
            </li>
            <li>
              Uso de dicha imagen con fines promocionales, comerciales, académicos o informativos, en medios físicos, digitales y redes sociales, en el marco de la presente actividad.
            </li>
            <li>
              Recolección y tratamiento de mis datos personales, tales como: nombre, correo electrónico, especialidad médica y ciudad de procedencia, los cuales serán utilizados exclusivamente para:
              <ul style={listStyle}>
                <li>El envío de la imagen generada por correo electrónico.</li>
                <li>Estadísticas internas del evento.</li>
                <li>Comunicación relacionada con esta activación y servicios relacionados.</li>
              </ul>
            </li>
          </ol>
          <p style={textStyle}>
            Declaro que he sido informado(a) de que:
          </p>
          <ul style={listStyle}>
            <li>Mis datos serán tratados conforme a la Ley 1581 de 2012 y demás normas concordantes sobre protección de datos personales en Colombia.</li>
            <li>En cualquier momento podré ejercer mis derechos de acceso, rectificación, actualización o supresión de mis datos enviando una solicitud al correo [correo de contacto de la empresa].</li>
          </ul>
          <p style={textStyle}>
            Conozco y acepto los términos aquí establecidos.
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
