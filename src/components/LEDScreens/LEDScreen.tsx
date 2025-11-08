import React, { useEffect, useState } from 'react';
import ledScreenService, { LEDImageData } from '../../services/ledScreenService';
import './LEDScreen.scss';

interface LEDScreenProps {
  screenNumber: 1 | 2 | 3;
  title?: string;
}

const LEDScreen: React.FC<LEDScreenProps> = ({ screenNumber, title }) => {
  const [currentImage, setCurrentImage] = useState<LEDImageData | null>(null);
  const [nextImage, setNextImage] = useState<LEDImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rotationStarted, setRotationStarted] = useState(false);
  const [imagePreloaded, setImagePreloaded] = useState(false);
  const [imageCache] = useState<Set<string>>(new Set()); // 🗂️ Cache de URLs precargadas

  // 🖼️ Función para precargar imágenes con cache
  const preloadImage = (url: string): Promise<void> => {
    // Si ya está en cache, resolver inmediatamente
    if (imageCache.has(url)) {
      console.log(`⚡ Imagen en cache: ${url.substring(0, 50)}...`);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.add(url); // Agregar al cache
        console.log(`💾 Imagen cacheada: ${url.substring(0, 50)}...`);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  useEffect(() => {
    console.log(`📺 Pantalla ${screenNumber} inicializada`);
    
    // Iniciar el sistema de rotación si no está iniciado
    if (!rotationStarted) {
      ledScreenService.startRotationSystem();
      setRotationStarted(true);
      console.log(`🎬 Sistema de rotación iniciado desde Pantalla ${screenNumber}`);
    }
    
    // Suscripción en tiempo real a la pantalla
    const unsubscribe = ledScreenService.subscribeToScreen(
      screenNumber,
      async (imageData) => {
        console.log(`📺 Pantalla ${screenNumber} nueva imagen recibida:`, imageData);
        
        if (!imageData) {
          setCurrentImage(null);
          setIsLoading(false);
          return;
        }

        // 🚀 Precargar la imagen antes de mostrarla
        setImagePreloaded(false);
        setNextImage(imageData);
        
        try {
          await preloadImage(imageData.imageUrl);
          console.log(`✅ Imagen precargada para Pantalla ${screenNumber}`);
          
          // ✨ Transición suave: cambiar a la imagen precargada
          setCurrentImage(imageData);
          setImagePreloaded(true);
          setIsLoading(false);
        } catch (error) {
          console.error(`❌ Error precargando imagen en Pantalla ${screenNumber}:`, error);
          // Mostrar de todos modos aunque falle la precarga
          setCurrentImage(imageData);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log(`📺 Pantalla ${screenNumber} desmontada`);
      unsubscribe();
    };
  }, [screenNumber, rotationStarted]);

  return (
    <div className={`led-screen screen-${screenNumber}`}>
      <div className="screen-header">
        <h2>{title || `Pantalla ${screenNumber}`}</h2>
      </div>
      
      <div className="screen-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Esperando imágenes...</p>
          </div>
        ) : currentImage ? (
          <div className={`image-display ${imagePreloaded ? 'fade-in' : ''}`}>
            <img 
              src={currentImage.imageUrl} 
              alt={currentImage.nombre}
              className="led-image"
            />
            <div className="image-info">
              <h3>{currentImage.nombre}</h3>
              <p>{currentImage.empresa}</p>
            </div>
          </div>
        ) : nextImage ? (
          // 🔄 Mostrar la imagen anterior mientras se precarga la siguiente
          <div className="image-display">
            <img 
              src={nextImage.imageUrl} 
              alt={nextImage.nombre}
              className="led-image"
            />
            <div className="image-info">
              <h3>{nextImage.nombre}</h3>
              <p>{nextImage.empresa}</p>
            </div>
            <div className="preloading-indicator">
              <div className="mini-spinner"></div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>En espera de contenido...</p>
          </div>
        )}
      </div>

      <div className="screen-footer">
        <span className="screen-badge">Pantalla {screenNumber}</span>
      </div>
    </div>
  );
};

export default LEDScreen;
