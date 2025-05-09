# Webcam-n8n

## Descripción
Esta aplicación web permite capturar imágenes desde la webcam del usuario y enviarlas automáticamente a un flujo de trabajo de n8n a través de un webhook. Utiliza React, Three.js y React Three Fiber para crear una interfaz 3D interactiva que muestra la transmisión de la webcam.

## Características
- Visualización en tiempo real de la webcam en un entorno 3D
- Captura de imágenes presionando la tecla 'M'
- Envío automático de las imágenes capturadas a n8n en formato base64
- Controles de cámara 3D para ajustar la vista

## Tecnologías utilizadas
- React
- TypeScript
- Three.js
- React Three Fiber (@react-three/fiber)
- React Three Drei (@react-three/drei)
- Axios para peticiones HTTP

## Configuración
1. Clona este repositorio
2. Instala las dependencias con `npm install`
3. Configura tu URL de webhook de n8n en el archivo `.env`:
   ```
   VITE_N8N_WEBHOOK_URL="https://tu-instancia-n8n.com/webhook/tu-id-webhook"
   ```
4. Ejecuta la aplicación en modo desarrollo con `npm run dev`
5. Para construir la aplicación para producción, usa `npm run build`

## Uso
1. Permite el acceso a la webcam cuando el navegador lo solicite
2. Presiona la tecla 'M' para capturar una imagen
3. La imagen se enviará automáticamente al webhook de n8n configurado
4. Utiliza los controles del ratón para ajustar la vista 3D (opcional)

## Estructura del proyecto
- `src/components/WebcamScene.tsx`: Componente principal que maneja la captura de la webcam y el envío de imágenes
- `.env`: Archivo de configuración para la URL del webhook de n8n

## Integración con n8n
Las imágenes se envían como datos base64 en formato JSON al webhook configurado. En n8n, puedes procesar estas imágenes para:
- Almacenarlas en un servicio de almacenamiento
- Analizarlas con servicios de visión artificial
- Enviarlas por correo electrónico
- Integrarlas con otros servicios o flujos de trabajo