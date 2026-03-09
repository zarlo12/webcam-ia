# Migración a ComfyDeploy API - Documentación

## 📝 Resumen de Cambios

Esta documentación detalla la migración completa del sistema de generación de imágenes desde un flujo basado en n8n + endpoints PHP externos hacia una integración directa con la API de ComfyDeploy.

## 🔄 Arquitectura Anterior vs Nueva

### ❌ Arquitectura Anterior:

1. **AvatarPhoto** → Enviaba imagen a webhook de n8n (diferentes URLs por estilo)
2. **App.tsx** → Hacía polling cada 2s a `proyectoshm.com/.../callback_nutricia2.php`
3. **Waiting.tsx** → Hacía polling cada 3s a `proyectoshm.com/.../check_error_nutricia.php`
4. **AvatarResult** → Llamaba a `proyectoshm.com/.../clear_image_data_nutricia2.php`

### ✅ Arquitectura Nueva:

1. **AvatarPhoto** → Envía imagen directamente a ComfyDeploy API
2. **App.tsx** → Gestiona el flujo entre componentes con el `runId`
3. **Waiting.tsx** → Hace polling cada 3s a ComfyDeploy API para verificar status del run
4. **AvatarResult** → Ya no necesita endpoint de limpieza
5. **Firestore** → Guarda todos los status de runs sin duplicar

## 📂 Archivos Nuevos Creados

### 1. `/src/types/comfyDeploy.ts`

Define todos los tipos TypeScript para las respuestas de la API de ComfyDeploy:

- `ComfyDeployQueueRequest`: Request para encolar un procesamiento
- `ComfyDeployQueueResponse`: Respuesta al encolar (incluye run_id)
- `ComfyDeployStatusResponse`: Respuesta completa del status de un run
- `ComfyDeployOutput`: Estructura de los outputs (texto e imágenes)
- `ComfyDeployError`: Estructura de errores

### 2. `/src/services/comfyDeployService.ts`

Servicio completo con las siguientes funciones:

#### Funciones Principales:

- `queueImageProcessing(imageBlob, style)`: Envía imagen a ComfyDeploy
- `getRunStatus(runId)`: Obtiene el estado actual de un run
- `saveRunStatusToFirestore(runId, status)`: Guarda status en Firestore (sin duplicar)
- `extractGeneratedImageUrl(status)`: Extrae la URL de la imagen generada
- `extractErrorMessage(status)`: Extrae mensajes de error
- `waitForRunCompletion(runId, onProgress)`: Polling automático con callback

#### Funciones Auxiliares:

- `blobToDataUrl(blob)`: Convierte Blob a Data URL
- `uploadImageToTemporaryStorage(imageBlob)`: Sube imagen a Firebase Storage para obtener URL pública

## 🔧 Modificaciones en Componentes Existentes

### AvatarPhoto.tsx

**Cambios principales:**

- ❌ Eliminadas dependencias de `axios` y webhooks de n8n
- ✅ Agregado `import { queueImageProcessing }` del servicio
- ✅ Agregado estado `isProcessing` para feedback visual
- ✅ Modificada prop `onProcess` para recibir y pasar `runId`
- ✅ `handleProcessImage` ahora usa ComfyDeploy directamente

### App.tsx

**Cambios principales:**

- ❌ Eliminado polling a endpoint PHP
- ❌ Eliminado `useEffect` de limpieza inicial
- ✅ Agregado estado `runId` para el ID del run de ComfyDeploy
- ✅ `handleProcess` ahora recibe y guarda el `runId`
- ✅ Prop `onImageUrlChange` agregada a Waiting para actualizar la imagen

### Waiting.tsx

**Cambios principales:**

- ❌ Eliminado polling a endpoint de errores PHP
- ❌ Eliminada función `checkForErrors`
- ✅ Agregado estado `runStatus` tipo `ComfyDeployStatusResponse`
- ✅ Agregado estado `statusMessage` para mostrar progreso
- ✅ Nuevo `useEffect` con polling a ComfyDeploy cada 3 segundos
- ✅ Manejo de estados: `queued`, `running`, `success`, `failed`
- ✅ Muestra progreso en porcentaje y `live_status`
- ✅ Prop `runId` reemplaza a `imagenGenerada`
- ✅ Prop `onImageUrlChange` para actualizar imagen en App

### AvatarResult.tsx

**Cambios principales:**

- ❌ Eliminada llamada a endpoint de limpieza PHP
- ✅ `handleReset` simplificado (solo timeout de 500ms)

### MergeImage.tsx

**Cambios principales:**

- ❌ Eliminados imports de logos
- ❌ Eliminada configuración `LOGO_CONFIG`
- ✅ Simplificado para solo usar la imagen original sin logos adicionales

## 🔐 Variables de Entorno

Crear archivo `.env` basado en `.env.example`:

```bash
# Firebase Configuration (mantener las actuales)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# ComfyDeploy Configuration (NUEVO)
VITE_COMFY_DEPLOY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ComfyDeploy Deployment IDs (NUEVO - uno por estilo)
VITE_COMFY_DEPLOYMENT_BEBELAC=b7a75f2f-6e62-49b6-8a9a-008c8b93f433
VITE_COMFY_DEPLOYMENT_EJECUTIVO=b7a75f2f-6e62-49b6-8a9a-008c8b93f433
VITE_COMFY_DEPLOYMENT_NUTRILON=b7a75f2f-6e62-49b6-8a9a-008c8b93f433
```

## 🗄️ Estructura de Firestore

### Nueva Colección: `ComfyDeployRuns`

Cada documento tiene el ID del `run_id` y contiene:

```typescript
{
  runId: string;
  status: "queued" | "running" | "success" | "failed";
  progress: number; // 0.0 a 1.0
  live_status: string | null; // "Executing SaveImage", etc.
  workflow_inputs: {
    imageInput: string; // URL de la imagen original
  };
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  outputs: ComfyDeployOutput[]; // Array con imágenes y textos generados
  lastChecked: string; // Timestamp de última actualización
}
```

**Ventaja:** No se duplican documentos gracias al uso del `run_id` como ID del documento.

## 📊 Flujo de Estados de ComfyDeploy

```
1. Usuario captura foto → AvatarPhoto
   ↓
2. Se envía a ComfyDeploy API → queueImageProcessing()
   ↓
3. ComfyDeploy retorna run_id
   ↓
4. Se pasa a pantalla Waiting con run_id
   ↓
5. Polling cada 3s para verificar status:

   STATUS "queued":
   - Mensaje: "En cola, esperando procesamiento..."
   - Continuar polling

   STATUS "running":
   - Mensaje: "Procesando... X% - [live_status]"
   - Continuar polling

   STATUS "success":
   - Extraer URL de imagen generada
   - Detener polling
   - Pasar a pantalla Result

   STATUS "failed":
   - Extraer mensaje de error
   - Mostrar alerta con error
   - Redirigir a home
```

## 🚀 Beneficios de la Migración

1. ✅ **Elimina dependencias externas** (n8n, endpoints PHP)
2. ✅ **Comunicación directa** con ComfyDeploy
3. ✅ **Mejor manejo de errores** con estados específicos
4. ✅ **Feedback en tiempo real** con progreso y status
5. ✅ **Registro completo** de todos los runs en Firestore
6. ✅ **Sin duplicación** de datos en Firestore
7. ✅ **Código más mantenible** y modular
8. ✅ **TypeScript completo** con tipos definidos

## 🧪 Testing

### Verificar que todo funciona:

1. **Captura de foto:**
   - Debe mostrar preview inmediatamente
   - Botón "Tomar otra" debe funcionar

2. **Selección de estilo:**
   - Debe permitir elegir entre Bebelac, Ejecutivo, Nutrilon
   - Validación: no permitir procesar sin seleccionar estilo

3. **Procesamiento:**
   - Botón debe cambiar a "Enviando..."
   - Debe redirigir a pantalla Waiting
   - Console debe mostrar: runId, estilo seleccionado

4. **Pantalla Waiting:**
   - Debe mostrar estado inicial "Iniciando..."
   - Debe actualizar a "En cola..." o "Procesando... X%"
   - Debe mostrar progreso y estado actual
   - Console debe mostrar polling cada 3 segundos

5. **Resultado exitoso:**
   - Debe extraer URL de imagen
   - Debe pasar a pantalla Result
   - Debe guardar en Firestore colección "Nutricia"

6. **Manejo de errores:**
   - Si falla, debe mostrar alerta con mensaje
   - Debe redirigir automáticamente al home

7. **Firestore:**
   - Verificar colección `ComfyDeployRuns`
   - Verificar que no haya documentos duplicados con mismo runId
   - Verificar que se actualice el status conforme avanza

## 📝 Notas Importantes

### Temporalización de Imágenes:

- Las imágenes se suben primero a Firebase Storage (carpeta `temp_uploads/`)
- Se obtiene URL pública para que ComfyDeploy pueda acceder
- ComfyDeploy genera nueva imagen
- Imagen final se sube a Firebase Storage (carpeta `Nutricia_avatars/`)

### Polling:

- Intervalo de 3 segundos (configurable en Waiting.tsx)
- Se detiene automáticamente en estados finales (`success`, `failed`)
- Máximo 120 intentos (6 minutos) en `waitForRunCompletion` del servicio

### Limpieza

Ya no es necesario:

- ❌ Limpiar endpoints PHP
- ❌ Reiniciar servicios externos
- ❌ Verificar webhooks de n8n

## 🔮 Mejoras Futuras Sugeridas

1. **Timeout configurable** por estilo
2. **Retry automático** en caso de error
3. **Caché de imágenes** para evitar reprocesar
4. **Panel admin** para ver todos los runs
5. **Notificaciones push** cuando termine el procesamiento
6. **Estimación de tiempo** basada en duración promedio
7. **Queue position** visible para el usuario

---

## 📞 Soporte

Si hay problemas con la migración, verificar:

1. ✅ Variables de entorno configuradas correctamente
2. ✅ API Key de ComfyDeploy válida
3. ✅ Deployment IDs correctos para cada estilo
4. ✅ Firebase configurado y con reglas de Storage apropiadas
5. ✅ Consola del navegador para mensajes de debug

---

**Última actualización:** 9 de marzo de 2026
**Versión:** 2.0.0 - Migración ComfyDeploy
