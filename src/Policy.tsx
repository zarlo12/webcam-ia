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
    background: "#31afda",
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
            AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
          </h1>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            En virtud del presente documento, de forma libre y espontánea, declaro que:
          </p>

          <ol style={{...listStyle, listStyleType: 'decimal'}}>
            <li style={{ marginBottom: "15px" }}>
              <strong>AUTORIZO</strong> a GRUPO XNOVA SAS para que, en desarrollo de LA ACTIVIDAD, haga tratamiento de mis datos personales, incluyendo sin limitarse a nombres, apellidos, datos de identificación, fotografías y videos.
            </li>
            
            <li style={{ marginBottom: "15px" }}>
              <strong>AUTORIZO</strong> a GRUPO XNOVA SAS a recolectar y hacer tratamiento de mis datos personales, que estén contenidos en los registros fotográficos y/o fílmicos que ésta realice durante LA ACTIVIDAD. El tratamiento que podrá dársele a estos datos incluye su uso, sin costo alguno, para efectuar Publicaciones en redes sociales, página web corporativa, medios impresos y/o publicitarios y medios internos de GRUPO XNOVA SAS
            </li>
            
            <li style={{ marginBottom: "15px" }}>
              <strong>GRUPO XNOVA SAS</strong> me informó:
              <ol style={{...listStyle, listStyleType: 'lower-alpha', marginTop: "10px"}}>
                <li style={{ marginBottom: "8px" }}>
                  Que el tratamiento de mis datos personales se realizará conforme a su política de tratamiento de datos personales;
                </li>
                <li style={{ marginBottom: "8px" }}>
                  el alcance de su política tratamiento de datos personales, mis derechos respecto los mismos y la forma de ejercerlos; y
                </li>
                <li style={{ marginBottom: "8px" }}>
                  que su política de tratamiento de datos se encuentra establecida en el manual de tratamiento de datos personales.
                </li>
              </ol>
            </li>
          </ol>
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
