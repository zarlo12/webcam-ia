# Webcam IA - AI Image Generation

Una aplicación moderna de generación de imágenes con IA que captura fotos de la webcam y las procesa usando Replicate AI en lugar de n8n/comfydeploy.

## 🚀 Características

- **Captura de webcam en tiempo real** con React y TypeScript
- **Generación de imágenes con IA** usando Replicate.com
- **Múltiples estilos de IA**: Profesional, Realista, Artístico, Cartoon, Vintage
- **Backend profesional** con Google Cloud Functions
- **Firebase Storage** para almacenamiento de imágenes
- **Interfaz moderna** con React y Sass
- **TypeScript** en todo el stack

## 🏗️ Arquitectura

```
Frontend (React + TypeScript + Vite)
    ↓
Google Cloud Functions (Node.js + TypeScript)
    ↓
Replicate API (AI Image Generation)
    ↓
Firebase Storage (Image Storage)
```

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
