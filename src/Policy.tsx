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
    background: "#ff7529",
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
          
          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "18px" : "20px", color: "#ff7529" }}>
            Uso de Datos Personales y Captura Temporal de Imagen Facial para Actividad de Avatar con Inteligencia Artificial
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Nutricia Exports B.V. («Nutricia»), término que incluye a cada miembro del grupo de compañías del cual Nutricia Exports B.V. es la compañía matriz, subsidiaria o afiliada), en cumplimiento de lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México y demás normativas aplicables, pone a su disposición el presente consentimiento informado.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            1. Finalidad del tratamiento de datos
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Los datos personales que se solicitarán son:
          </p>
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px", paddingLeft: "20px" }}>
            <li>Nombre o Alias</li>
            <li>Correo electrónico</li>
            <li>Captura temporal y transitoria de fotografía de su rostro</li>
          </ul>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            Dichos datos serán tratados con las siguientes finalidades:
          </p>
          <ol style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px", paddingLeft: "20px" }}>
            <li>Generar de forma inmediata un avatar con inteligencia artificial que proyecta su rostro en pantalla.</li>
            <li>Enviar por correo electrónico su avatar generado.</li>
            <li>Llevar un registro estadístico de participación en la actividad.</li>
          </ol>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Los datos no serán utilizados para fines distintos a los aquí mencionados.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            2. Naturaleza del procesamiento de la imagen facial
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            La captura de la fotografía de su rostro será temporal y transitoria, utilizada únicamente durante un lapso aproximado de 1 a 2 minutos para la generación del avatar.
          </p>
          
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Una vez procesada y enviada la imagen al correo electrónico proporcionado, tanto la fotografía original como la imagen generada con inteligencia artificial serán eliminadas.</li>
            <li>Únicamente Nutricia tendrá acceso autorizado a los datos, con el propósito exclusivo de entregar el resultado de la experiencia.</li>
          </ul>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            3. Consentimiento previo y voluntario
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "15px" }}>
            La participación en esta experiencia es completamente voluntaria.
          </p>
          
          <ul style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Usted podrá decidir libremente si desea o no participar.</li>
            <li>En caso de no otorgar su consentimiento, no se capturarán ni procesarán sus datos personales.</li>
          </ul>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            4. Medidas de seguridad
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            El tratamiento de sus datos personales se realizará con estrictas medidas de seguridad administrativas, técnicas y físicas que permiten proteger su información contra daño, pérdida, alteración, destrucción o uso indebido.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            5. Transferencia de datos
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Los datos personales obtenidos no serán compartidos con terceros, salvo que exista obligación legal de hacerlo.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Usted podrá ejercer en cualquier momento sus derechos de acceso, rectificación, cancelación u oposición (ARCO) respecto de sus datos personales, mediante solicitud enviada al siguiente{" "}
            <a 
              href="https://www.nutricia.com/es_ec/politica-de-privacidad/contacto-privacidad.html" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#0066cc", textDecoration: "none" }}
            >
              link
            </a>{" "}
            o directamente en el domicilio de Nutricia.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            7. Contacto del responsable de datos personales
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            Para cualquier consulta o ejercicio de derechos, podrá comunicarse con el área designada de protección de datos al correo en el siguiente{" "}
            <a 
              href="https://www.nutricia.com/es_ec/politica-de-privacidad/contacto-privacidad.html" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#0066cc", textDecoration: "none" }}
            >
              link
            </a>.
          </p>

          <h2 style={{ ...titleStyle, fontSize: isSmallScreen ? "16px" : "18px", color: "#ff7529" }}>
            DECLARACIÓN DE CONSENTIMIENTO
          </h2>
          
          <p style={{ fontSize: isSmallScreen ? "14px" : "16px", lineHeight: "1.5", marginBottom: "20px" }}>
            La forma de otorgar su consentimiento será mediante la acción de dar clic en la casilla de autorización de datos personales y consentimiento de uso de imagen al momento de la experiencia. Al hacerlo, usted confirma que ha leído y entendido el presente consentimiento informado, y acepta de manera libre, expresa, voluntaria e informada el tratamiento de sus datos personales conforme a lo descrito en este documento.
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
