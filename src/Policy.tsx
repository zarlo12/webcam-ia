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
            Por medio del presente documento y conforme a lo consagrado en la Ley 1581 de 2012, el Decreto Reglamentario 1377 de 2013 y demás decretos reglamentarios, de manera libre, expresa, voluntaria, inequívoca y debidamente informada, declara que:
          </p>
          <p style={textStyle}>
            Autorizo a <strong>GRÜNENTHAL COLOMBIANA SA (GRÜNENTHAL)</strong>, para que, a través de sus empleados, consultores, asesores o contratistas, realice el tratamiento y disposición de mis datos personales indicados más adelante (Datos Personales). De esta manera conozco y acepto que GRÜNENTHAL es el responsable de la información que suministra y que en los casos en que recolecte otros datos míos, será informado.
          </p>
          <p style={textStyle}>
            Autorizo expresamente a GRÜNENTHAL para que se realice el tratamiento de mis Datos Personales para las siguientes finalidades:
          </p>
          <ol style={listStyle}>
            <li>
              Programar y realizar visitas médicas.
            </li>
            <li>
              Contactarme para la realización de conferencias, estudios clínicos, asistencia a reuniones educativas y otras actividades sean o no en ejecución de contratos suscritos con GRÜNENTHAL, así como para realizarme pagos por servicios que hubiere prestado.
            </li>
            <li>
              Enviarme información educativa y científica relacionada con la especialidad de mi interés.
            </li>
            <li>
              Enviarme información relacionada con los productos de GRÜNENTHAL.
            </li>
            <li>
              Contactarme para participar en encuestas relacionadas con los productos de GRÜNENTHAL o mercados en los que GRÜNENTHAL participa.
            </li>
          </ol>
          <p style={textStyle}>
            Autorizo ser contactado personalmente, a través de SMS, mensajería instantánea, redes sociales, correo electrónico, llamadas de voz, videoconferencias y por cualquier otra plataforma o medio digital conocido y/o por conocer. Autorizo igualmente a que mis datos sean transferidos y/o transmitidos a las demás empresas relacionadas con GRÜNENTHAL, así como también a terceros contratistas que presten servicios a GRÜNENTHAL y que deban realizar el Tratamiento de datos personales. La mencionada transferencia y/o transmisión de Datos Personales podrá realizarse incluso a empresas que se encuentren fuera del territorio nacional en donde las normas de protección de datos no tengan un nivel de protección de datos equivalente a las normas colombianas. Entendiendo que en el evento de transferencia y/o transmisión, mis Datos Personales serán tratados bajo estrictas medidas de confidencialidad y seguridad.
          </p>
          <p style={textStyle}>
            Se me ha informado que mis Datos Personales serán tratados de acuerdo con la Política de Datos Personales que podrá consultar solicitándola al correo electrónico <a href="mailto:datospersonales.colombia@grunenthal.com">datospersonales.colombia@grunenthal.com</a>. Igualmente, se me ha informado que los derechos que tengo como titular de los datos son los consagrados en el artículo 8 de la Ley 1581 de 2012 y especialmente aquellos de conocer, actualizar, rectificar, solicitar la supresión de los datos y revocar la autorización otorgada salvo que tenga algún deber legal de permanecer en la base de datos creada, o que mis datos sean requeridos para el cumplimiento de obligaciones contractuales.
          </p>
          <p style={textStyle}>
            Para cualquier solicitud o requerimiento relacionado con mis datos personales entiendo que podré contactar al correo electrónico <a href="mailto:datospersonales.colombia@grunenthal.com">datospersonales.colombia@grunenthal.com</a>.
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
