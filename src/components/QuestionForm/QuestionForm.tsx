import React, { useState } from "react";
import "./QuestionForm.scss";
import logo from "../../assets/clarosport/Logo.png";

interface QuestionFormProps {
  onComplete: (selectedService: string, accessories: string[]) => void;
}

interface ServicePoints {
  [key: string]: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  // Definición de las preguntas y opciones
  const questions = [
    {
      question: "¿Cómo prefieres mantenerte al día con el mundo?",
      options: [
        {
          text: "Escuchando la radio o viendo las noticias en la TV.",
          services: { "redmas noticias": 3, "radiola tv": 3, "portal redmas.com.co": 1 }
        },
        {
          text: "Leyendo titulares y artículos en mi teléfono o tablet.",
          services: { "portal redmas.com.co": 3, "mobile marketing": 3, "redmas noticias": 1, "15 minutos": 1 }
        },
        {
          text: "A través de videos y transmisiones en vivo en plataformas de streaming.",
          services: { "Sin Limites tv": 3, "Claro Musica": 3, "Un café claro": 1 }
        }
      ]
    },
    {
      question: "¿Dónde haces la mayoría de tus compras de ocio?",
      options: [
        {
          text: "En grandes tiendas por departamento o centros comerciales.",
          services: { "plaza claro": 3, "Un café claro": 1 }
        },
        {
          text: "Principalmente online, aprovechando ofertas y promociones exclusivas.",
          services: { "mobile marketing": 3, "portal redmas.com.co": 3, "reaserch": 1 }
        },
        {
          text: "En mercados locales o tiendas de emprendedores.",
          services: { "reaserch": 3, "Un café claro": 3, "Salud 1010": 1 }
        }
      ]
    },
    {
      question: "¿Cómo te gustaría que las marcas se comuniquen contigo?",
      options: [
        {
          text: "A través de mensajes directos y personalizados en mi celular.",
          services: { "mobile marketing": 3, "Salud 1010": 3, "Claro Musica": 1 }
        },
        {
          text: "Mediante campañas publicitarias creativas y que me hagan pensar.",
          services: { "reaserch": 3, "plaza claro": 1 }
        },
        {
          text: "Con contenido de valor y ofertas que me lleguen por correo electrónico.",
          services: { "Un café claro": 3, "15 minutos": 3, "portal redmas.com.co": 1 }
        }
      ]
    },
    {
      question: "¿Cuál de estas actividades harías en tu tiempo libre?",
      options: [
        {
          text: "Explorar nuevos géneros musicales y crear playlists.",
          services: { "Claro Musica": 3, "Sin Limites tv": 3, "radiola tv": 1 }
        },
        {
          text: "Ir a un lugar tranquilo para leer y tomar un café.",
          services: { "Un café claro": 3, "Salud 1010": 3, "reaserch": 1 }
        },
        {
          text: "Ver los programas de televisión del momento.",
          services: { "Sin Limites tv": 3, "radiola tv": 3, "15 minutos": 1 }
        }
      ]
    }
  ];

  // Mapeo de servicios a accesorios
  const serviceAccessories: { [key: string]: string[] } = {
    "15 minutos": [
      "Unos lentes de sol de diseñador",
      "Una revista enrollada bajo el brazo",
      "Maleta",
      "Un smartphone con un selfie stick",
      "Un vaso tipo stanley"
    ],
    "reaserch": [
      "Una lupa gigante con un ícono de datos",
      "Un portapapeles y un bolígrafo",
      "Unos lentes de montura gruesa",
      "Un reloj de pulsera con gráficos",
      "Un gorro de detective"
    ],
    "plaza claro": [
      "Bolsas de compras de diferentes marcas",
      "Una taza de café",
      "Un globo con forma de plato de comida",
      "Un scooter o patineta eléctrica",
      "Una cámara fotográfica para capturar momentos"
    ],
    "Un café claro": [
      "Un termo de café",
      "Una tablet con una noticia de última hora",
      "Unas gafas de realidad virtual",
      "Una mochila ligera",
      "Unos auriculares de diadema"
    ],
    "Salud 1010": [
      "Una botella de agua reutilizable",
      "Una banda de ejercicio",
      "Un reloj inteligente que monitorea su actividad física",
      "Una mochila de senderismo",
      "Unas zapatillas deportivas"
    ],
    "Claro Musica": [
      "Audífonos de estilo urbano",
      "Una gorra de béisbol con el logo de una disquera",
      "Un micrófono de estudio",
      "Un tatuaje de una nota musical",
      "Una chaqueta bomber"
    ],
    "portal redmas.com.co": [
      "Un portátil con el sitio web abierto",
      "Unos lentes de lectura",
      "Un vaso de café o té",
      "Un widget de gráficos de economía flotando",
      "Un libro sobre economía o política"
    ],
    "mobile marketing": [
      "Un smartphone con notificaciones pop-up",
      "Un aro de luz para selfies",
      "Un power bank en su bolsillo",
      "Un audífono inalámbrico en una oreja",
      "Unas zapatillas de deporte, listo para moverse"
    ],
    "radiola tv": [
      "Un sombrero de estilo popular",
      "Una guitarra o un acordeón",
      "Unos botines de cuero",
      "Una flor en el ojal",
      "Un televisor antiguo con una antena"
    ],
    "Sin Limites tv": [
      "Un vinilo con un álbum de música anglo",
      "Unos auriculares de alta fidelidad",
      "Unos vaqueros",
      "Un boleto de concierto en el bolsillo de su pantalón",
      "Una camiseta con la imagen de una banda de rock"
    ]
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex.toString()];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calcular el servicio ganador
      calculateWinningService(newAnswers);
    }
  };

  const calculateWinningService = (finalAnswers: string[]) => {
    const servicePoints: ServicePoints = {};

    // Calcular puntos para cada servicio
    finalAnswers.forEach((answer, questionIndex) => {
      const answerIndex = parseInt(answer);
      const selectedOption = questions[questionIndex].options[answerIndex];
      
      Object.entries(selectedOption.services).forEach(([service, points]) => {
        servicePoints[service] = (servicePoints[service] || 0) + points;
      });
    });

    // Encontrar el servicio con más puntos
    let winningService = "";
    let maxPoints = 0;

    Object.entries(servicePoints).forEach(([service, points]) => {
      if (points > maxPoints) {
        maxPoints = points;
        winningService = service;
      }
    });

    console.log("🏆 Resultados del cuestionario:", {
      servicePoints,
      winningService,
      maxPoints
    });

    // Obtener los accesorios del servicio ganador
    const accessories = serviceAccessories[winningService] || [];

    // Completar el formulario
    onComplete(winningService, accessories);
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="question-form-container">
      {/* Cabecera superior con fondo rojo y logo centrado */}
      <div className="header">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="main-content">
        <div className="question-card">
          {/* Barra de progreso */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="progress-text">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>

          {/* Pregunta actual */}
          <div className="question-content">
            <h2 className="question-title">
              {questions[currentQuestion].question}
            </h2>

            <div className="options-container">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className="option-button"
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="option-text">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Botón de retroceso */}
            {currentQuestion > 0 && (
              <button className="back-button" onClick={goBack}>
                ← Anterior
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
