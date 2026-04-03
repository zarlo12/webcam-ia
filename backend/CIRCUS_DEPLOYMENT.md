# 🎪 Circus AI Image Generation - Backend

## Descripción

Cloud Functions específicas para el proyecto de circo con transformaciones de personajes que preservan la identidad facial.

## Funciones Desplegadas

### 1. `generateCircusImage`

- **Endpoint**: `/generateCircusImage`
- **Método**: POST
- **Descripción**: Genera transformación de personaje de circo preservando identidad facial
- **Timeout**: 540 segundos (9 minutos)
- **Memoria**: 2GiB
- **Formato**: multipart/form-data o application/json

**Parámetros**:

- `image` (file): Imagen capturada de la webcam
- `prompt` (string): Prompt detallado del personaje (generado en frontend)
- `style` (string): Modo seleccionado (terror/clasico + estilo específico)
- `userId` (string, opcional): ID del usuario

**Response**:

```json
{
  "success": true,
  "imageUrl": "https://...",
  "message": "Circus character transformation complete",
  "requestId": "circus-123456",
  "debug": {
    "originalImage": "https://...",
    "finalImage": "https://...",
    "mode": "terror-payaso-maldito"
  }
}
```

### 2. `circusHealthCheck`

- **Endpoint**: `/circusHealthCheck`
- **Método**: GET
- **Descripción**: Verifica que el servicio esté funcionando

**Response**:

```json
{
  "success": true,
  "service": "Circus AI Image Generation",
  "message": "🎪 Circus transformation service is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "features": [
    "Identity-preserving transformations",
    "10 circus character styles",
    "Modo Terror (5 styles)",
    "Modo Clásico (5 styles)"
  ]
}
```

### 3. `getCircusStatus`

- **Endpoint**: `/getCircusStatus?predictionId=xyz`
- **Método**: GET
- **Descripción**: Obtiene estado de procesamiento asíncrono

## Deployment

### Prerequisitos

```bash
# Node.js 22
node --version  # v22.x.x

# Firebase CLI
npm install -g firebase-tools
firebase login
```

### Variables de Entorno

Crea archivo `.env` en `backend/functions/`:

```env
REPLICATE_API_TOKEN=r8_your_token_here
STORAGE_BUCKET=imagen-ia-845a3.appspot.com
```

### Deploy

```bash
cd backend/functions

# Instalar dependencias
npm install

# Build TypeScript
npm run build

# Deploy todas las funciones
npm run deploy

# Deploy solo funciones de circo
firebase deploy --only functions:generateCircusImage,functions:circusHealthCheck,functions:getCircusStatus
```

### Después del Deploy

1. Firebase mostrará las URLs de las Cloud Functions:

```
✔  functions[us-central1-generateCircusImage(...)...): Successful create operation.
Function URL (generateCircusImage(...)...): https://generatecircusimage-XXXXX-uc.a.run.app
```

2. Copia las URLs y actualízalas en el frontend:
   - Archivo: `src/services/aiImageService.ts`
   - Líneas: 42-44 (Production URLs)

## Arquitectura

### Flujo de Datos

```
Frontend (webcam capture)
    ↓
aiImageService.ts (FormData)
    ↓
Cloud Function: generateCircusImage
    ↓
circusController.ts (parse multipart)
    ↓
circusReplicateService.ts
    ↓
Replicate API (nano-banana-pro)
    ↓
Firebase Storage (result upload)
    ↓
Response con URL final
```

### Optimizaciones para Identidad Facial

- **Resolution**: 1K para detalles de retrato
- **Aspect Ratio**: 9:16 (vertical para móvil/totem)
- **Image Search**: Desactivado (no buscar referencias externas)
- **Google Search**: Desactivado
- **Guidance Scale**: 7.5 (adherencia fuerte al prompt)
- **Inference Steps**: 50 (más pasos = mejor calidad)

### Diferencias con Functions Generales

| Característica | General Functions          | Circus Functions             |
| -------------- | -------------------------- | ---------------------------- |
| **Modelo**     | nano-banana-pro (genérico) | nano-banana-pro (optimizado) |
| **Prompts**    | Básicos                    | Premium cinematográficos     |
| **Identidad**  | Transformación completa    | Preservación facial          |
| **Storage**    | `generated-images/`        | `circus-generated/`          |
| **Logging**    | `[requestId]`              | `[CIRCUS-requestId]` 🎪      |
| **Endpoint**   | `/generateAIImage`         | `/generateCircusImage`       |

## Monitoreo

### Logs en tiempo real

```bash
firebase functions:log --only generateCircusImage
```

### Ver todas las funciones

```bash
firebase functions:list
```

### Ver config actual

```bash
firebase functions:config:get
```

## Testing Local

```bash
cd backend/functions

# Emuladores locales
npm run serve

# URL local: http://localhost:5001/imagen-ia-845a3/us-central1/generateCircusImage
```

Actualiza `aiImageService.ts` para testing local:

```typescript
const baseUrl = "http://localhost:5001/imagen-ia-845a3/us-central1";
```

## Troubleshooting

### Error: "REPLICATE_API_TOKEN not found"

```bash
cd backend/functions
echo "REPLICATE_API_TOKEN=r8_your_token" > .env
```

### Error: "Permission denied"

```bash
firebase login
firebase use imagen-ia-845a3
```

### Error: "Function timeout"

- Verificar que el timeout esté configurado a 540s
- Verificar que Replicate API esté respondiendo
- Revisar logs: `firebase functions:log`

### Error: "Out of memory"

- Verificar memory: "2GiB" en función
- Optimizar tamaño de imagen antes de enviar

## Costos Estimados

### Firebase Functions

- **Invocaciones**: ~$0.40 por millón
- **Compute Time (2GiB, 9min)**: ~$0.000072 por invocación
- **Network Egress**: ~$0.12 por GB

### Replicate API

- **nano-banana-pro**: ~$0.003 por imagen
- **Tiempo promedio**: 30-90 segundos

### Firebase Storage

- **Storage**: $0.026 por GB-mes
- **Download**: $0.12 por GB

**Estimación por imagen**: ~$0.01 USD

## Próximas Mejoras

- [ ] Caché de resultados para misma foto + prompt
- [ ] Batch processing para múltiples personas
- [ ] Webhooks para procesamiento asíncrono
- [ ] Rate limiting por usuario
- [ ] Analytics de uso por estilo
- [ ] A/B testing de prompts

## Support

Para problemas o preguntas sobre el deployment, contactar al equipo de desarrollo.
