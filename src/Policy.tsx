import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Policy = ({ onBack }: { onBack: () => void }) => {
  const location = useLocation();
  const showBackButton = location.pathname !== "/aviso_privacidad";

  // Detecta el ancho de la ventana para ajustes responsivos
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSmallScreen = windowWidth < 400;

  // Estilos del overlay modal
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

  // Estilos para la tarjeta de la política
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
    marginBottom: "30px",
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

  // Estilos para la tachita de cerrar (botón X)
  const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "transparent",
    border: "none",
    fontSize: isSmallScreen ? "20px" : "24px",
    cursor: "pointer",
  };

  // Evitar que el clic en el contenido propague el evento al overlay
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  };

  return (
    <div style={overlayStyle} onClick={onBack}>
      <div style={cardStyle} onClick={handleCardClick}>
        {/* Botón para cerrar la ventana (tachita) */}
        <button style={closeButtonStyle} onClick={onBack} aria-label="Cerrar">
          &times;
        </button>
        <h2 style={titleStyle}>CONSENTIMIENTO PREVIO</h2>
        <p style={textStyle}>
          En relación con la Ley 81 del 26 de marzo del 2019 de Protección de
          Datos Personales y al Acuerdo No. 001-2022 de 24 de febrero de 2022
          “Que establece lineamientos especiales para la protección de datos
          personales tratados por las entidades bancarias”, por este medio
          autorizo expresamente a <strong>THE BANK OF NOVA SCOTIA</strong> para
          que, de conformidad con la ley antes mencionada, con respecto a los
          datos e información de mi persona, capte, obtenga, solicite, recopile,
          registre, organice, estructure, almacene, conserve, adapte o
          modifique, según lo que permita u ordene la ley; extraiga, consulte,
          utilice, comunique, transmita, intercambie, comparta, difunda (en
          aquellos casos en los que la ley lo permita u ordene), limite, suprima
          o destruya (en aquellos datos en los que la ley lo permita u ordene) y
          en cualquier otra forma, trate dichos datos con respecto a las
          relaciones que mantengo o mantenga en el futuro con{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> y que sirvan para los fines
          específicos que se indican más adelante.
          <br />
          <br />
          Este consentimiento permite la transferencia transfronteriza de los
          datos antes indicados. Para los efectos establecidos en la Ley 81 del
          2019, los fines para los cuales se otorga la autorización en este
          documento son los que se indican a continuación y, en consecuencia,{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> quedará autorizado a lo
          siguiente, en adición a cualquier autorización otorgada por la Ley:
          <br />
          <br />• Ofrecerme productos financieros, servicios de cualquier tipo,
          promociones o campañas con base en la información que mantengo o
          mantenga con <strong>THE BANK OF NOVA SCOTIA</strong>, subsidiarias o
          afiliadas, ya sea de crédito, cuentas pasivas o de servicios prestados
          por <strong>THE BANK OF NOVA SCOTIA</strong>, subsidiarias o
          afiliadas.
          <br />
          <br />• Realizar análisis internos de los clientes de{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong>, ya sea para fines de
          mercadeo, negocios, reportes, análisis de riesgo, cumplimiento,
          análisis de crédito, análisis estratégicos, fines estadísticos,
          elaboración de perfiles/segmentaciones y auditorías internas.
          <br />
          <br />
          • Para mi localización en caso de requerir la actualización de la
          información de mi persona.
          <br />
          <br />• Envío y/o recepción de cualquier tipo de datos a socios
          comerciales de <strong>THE BANK OF NOVA SCOTIA</strong> y de
          comunicación por cualquier medio, incluyendo el envío de
          comunicaciones a través de personas o empresas subcontratadas por{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> para dicho propósito.
          <br />
          <br />
          • Realización de gestiones de cobranza, atención de reclamos y
          consultas, gestiones para mi localización para el mantenimiento de
          información actualizada según las políticas de “Conozca a su Cliente”,
          seguimiento post venta.
          <br />
          <br />• Transmisión y suministro de datos para los efectos de
          servicios prestados por proveedores externos, como fiduciarias,
          contadores, abogados, seguros, entre otros, que sean necesarios para
          perfeccionar los contratos de productos o servicios bancarios
          suscritos con <strong>THE BANK OF NOVA SCOTIA</strong>, subsidiarias o
          afiliadas.
          <br />
          <br />
          • Transmisión de datos para los efectos de reportes regulatorios a
          entidades del Estado.
          <br />
          <br />
          • Utilizar mis datos para la aplicación de procedimientos científicos,
          matemáticos, algorítmicos, o de cualquiera otra índole similar que
          sean necesarios para proporcionar cualquier tipo de puntuación o
          índice, la determinación de hábitos o comportamiento de consumo y para
          elaborar estudios de mercado.
          <br />
          <br />
          • La transferencia y suministro de datos en caso de venta de carteras
          de cualquier tipo.
          <br />
          <br />
          Mis datos podrán ser transferidos en forma local o transfronteriza a
          cualquier entidad relacionada al grupo de{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> o a proveedores externos de{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong>, siempre que los datos
          enviados a tales proveedores externos sean necesarios para los fines
          indicados anteriormente.
          <br />
          <br />
          Entiendo que, como titular de los datos personales, tengo, con los
          límites y excepciones establecidas en la ley, los denominados Derechos
          ARCO; a saber:
          <br />
          <br />
          • Derecho de acceso, es decir, el derecho a solicitar confirmación
          sobre mis datos que están recibiendo tratamiento y, en caso de que
          exista tratamiento, el derecho a conocer los fines del tratamiento,
          qué tipo de datos están siendo tratados, destinatarios del tratamiento
          o categorías de destinatarios a los que se les han comunicado estos,
          así como el plazo previsto de conservación de los mismos.
          <br />
          <br />• Derecho de rectificación, es decir, el derecho a que se
          rectifique cualquier dato que <strong>
            THE BANK OF NOVA SCOTIA
          </strong>{" "}
          mantenga y que sea corregido en caso de que esté incorrecto,
          irrelevante, incompleto, desfasado, inexacto, falso o impertinente.
          <br />
          <br />
          • Derecho de cancelación, es decir, el derecho a solicitar la
          eliminación de mis datos personales incorrectos, irrelevantes,
          incompletos, desfasados, inexactos, falsos o impertinentes.
          <br />
          <br />
          • Derecho de oposición, es decir, el derecho por motivos fundados y
          legítimos relacionados con una situación en particular, que me
          permiten negarme a proporcionar mis datos personales o que sean objeto
          de un determinado tratamiento, así como a revocar mi consentimiento.
          <br />
          <br />
          • Derecho de portabilidad, es decir, el derecho a obtener una copia de
          mis datos en forma estructurada, en formato genérico y de uso común,
          con las excepciones establecidas en la ley.
          <br />
          <br />
          Entiendo que puedo ejercer estos derechos escribiendo un correo
          electrónico con mi solicitud específica al Oficial de Protección de
          Datos de <strong>THE BANK OF NOVA SCOTIA</strong>, cuyo correo es:{" "}
          <a href="mailto:pa.privacidad@pa.scotiabank">
            pa.privacidad@pa.scotiabank
          </a>
          .
          <br />
          <br />
          En caso de tener alguna disconformidad relacionada con el tratamiento
          de mis datos personales, entiendo que puedo presentar ante{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> un reclamo o queja. En caso
          de que <strong>THE BANK OF NOVA SCOTIA</strong> no atienda mi
          solicitud o en caso de que la respuesta no me satisfaga, entiendo que
          tengo el derecho de interponer un reclamo ante la Superintendencia de
          Bancos, según se establece en la ley y los acuerdos bancarios
          correspondientes.
          <br />
          <br />
          Para los efectos indicados en la ley, el responsable de los datos es{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong> y para someter su reclamo a{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong>, o bien, para realizar
          cualquier consulta relacionada con el tratamiento de sus datos, lo
          podrá hacer personalmente en alguna de nuestras sucursales o a nuestro
          Centro de Atención Telefónica TeleScotia al{" "}
          <strong>800-2000 (local)</strong> /{" "}
          <strong>(507) 297-5400 (internacional)</strong> o visitándonos en
          cualquiera de nuestras sucursales.
          <br />
          <br />
          Entiendo que al firmar la presente autorización, la misma aplica para
          las relaciones contractuales que mantenga ahora o en el futuro con{" "}
          <strong>THE BANK OF NOVA SCOTIA</strong>.
          <br />
          <br />
          Igualmente, entiendo que <strong>THE BANK OF NOVA SCOTIA</strong>{" "}
          tiene una Política de Privacidad de los datos personales a la que
          puedo acceder en el sitio web:{" "}
          <a
            href="https://www.scotiabank.com.pa"
            target="_blank"
            rel="noreferrer"
          >
            www.scotiabank.com.pa
          </a>
          , donde puedo obtener información completa sobre el tipo de datos que
          se recopilan y el tratamiento que se les da.
          <br />
          <br />
          Entiendo que el plazo máximo durante el cual se podrán conservar los
          datos personales es de <strong>siete (7) años</strong>, contados a
          partir de la fecha en que se terminó la obligación legal de
          conservarlos, sin perjuicio de que se puedan eliminar en un plazo
          menor.
        </p>
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
