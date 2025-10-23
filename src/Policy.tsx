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






  const buttonStyle: React.CSSProperties = {
    padding: isSmallScreen ? "8px 16px" : "10px 20px",
    fontSize: isSmallScreen ? "14px" : "16px",
    background: "#006937",
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
            FORMATO DE CONSENTIMIENTO INFORMADO
          </h1>
          
          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "18px" : "20px", color: "#006937" }}>
            Uso de Datos Personales y Captura Temporal de Imagen Facial
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            <strong>Evento:</strong> Congreso de Comunicaciones "IA: Realidad que transforma"
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            <strong>Entidad Responsable:</strong> Policía Nacional de Colombia
          </p>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            En cumplimiento de la Ley 1581 de 2012 y demás normas sobre protección de datos personales, la Policía Nacional de Colombia, a través de la Dirección de Comunicaciones Estratégicas, pone a su disposición el presente consentimiento informado.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            1. Finalidad del tratamiento de datos personales
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Durante su participación en la actividad "IA: Realidad que transforma", se podrán recopilar los siguientes datos personales:
          </p>
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px", paddingLeft: "20px" }}>
            <li>Nombre completo o alias</li>
            <li>Correo electrónico</li>
            <li>Captura temporal de su imagen facial</li>
          </ul>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Estos datos serán utilizados exclusivamente para los siguientes fines:
          </p>
          <ol style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px", paddingLeft: "20px" }}>
            <li>Generar un avatar o imagen digital mediante tecnología de inteligencia artificial que incorpore su rostro.</li>
            <li>Enviar al correo electrónico proporcionado el avatar o la imagen generada.</li>
            <li>Realizar estadísticas internas sobre participación en la experiencia.</li>
          </ol>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Los datos no serán utilizados para propósitos diferentes a los aquí descritos.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            2. Naturaleza del procesamiento de la imagen facial
          </h2>
          
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px", paddingLeft: "20px" }}>
            <li>La fotografía de su rostro será capturada de manera temporal, durante un lapso aproximado de 1 a 2 minutos, únicamente con el fin de generar el avatar digital.</li>
            <li>Una vez enviada la imagen generada a su correo electrónico, tanto la fotografía original como el resultado serán eliminados de forma segura.</li>
            <li>Solo personal autorizado de la Policía Nacional y del proveedor tecnológico participante tendrá acceso a los datos, y únicamente para los fines aquí indicados.</li>
          </ul>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            3. Consentimiento previo, libre y voluntario
          </h2>
          
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Su participación en la actividad es completamente voluntaria.</li>
            <li>En caso de no otorgar su consentimiento, no se realizará la captura ni el procesamiento de sus datos personales.</li>
          </ul>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            4. Medidas de seguridad
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            La Policía Nacional de Colombia implementa medidas técnicas, administrativas y físicas para garantizar la protección, confidencialidad e integridad de sus datos personales, de conformidad con la normativa vigente.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            5. Transferencia y tratamiento por terceros
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            Los datos personales no serán compartidos con terceros distintos a los proveedores tecnológicos que apoyan la experiencia de generación de avatar, quienes actúan bajo acuerdos de confidencialidad y seguridad equivalentes a los exigidos por la ley.
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            No se realizarán transferencias internacionales de datos.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            6. Derechos del titular de los datos (Derechos ARCO)
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Usted puede, en cualquier momento:
          </p>
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px", paddingLeft: "20px" }}>
            <li>Acceder a sus datos personales.</li>
            <li>Solicitar su rectificación o actualización.</li>
            <li>Solicitar su eliminación cuando no sean necesarios para los fines descritos.</li>
            <li>Oponerse al tratamiento de los mismos.</li>
          </ul>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            Para ejercer estos derechos, puede comunicarse con:
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "10px" }}>
            <strong>Correo electrónico:</strong>{" "}
            <a 
              href="mailto:coestpolicia8@gmail.com" 
              style={{ color: "#0066cc", textDecoration: "none" }}
            >
              coestpolicia8@gmail.com
            </a>
          </p>
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            <strong>Dirección:</strong> Dirección de Comunicaciones Estratégicas – Policía Nacional de Colombia
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#006937" }}>
            7. Declaración de consentimiento
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Al participar en la actividad y marcar la casilla de autorización, firmar o realizar cualquier acción equivalente de aceptación, usted declara que ha leído, comprendido y acepta de manera libre, expresa e informada el tratamiento de sus datos personales bajo las condiciones señaladas.
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
