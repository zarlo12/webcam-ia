# Configuración de Firebase Functions + ComfyDeploy

Esta guía te ayudará a configurar y desplegar las Firebase Cloud Functions para evitar el problema de CORS con ComfyDeploy.

## 🎯 Problema Resuelto

**Antes:** El navegador bloqueaba las peticiones directas a ComfyDeploy por CORS.  
**Ahora:** Las peticiones pasan por Firebase Functions (backend) que actúa como proxy seguro.

## 📦 Instalación

### 1. Instalar Dependencias de Functions

```bash
cd backend/functions
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```bash
COMFY_DEPLOY_API_KEY=tu_api_key_aqui
COMFY_DEPLOYMENT_BEBELAC=tu_deployment_id_bebelac
COMFY_DEPLOYMENT_EJECUTIVO=tu_deployment_id_ejecutivo
COMFY_DEPLOYMENT_NUTRILON=tu_deployment_id_nutrilon
```

### 3. Configurar Firebase CLI

Si no tienes Firebase CLI instalado:

```bash
npm install -g firebase-tools
```

Iniciar sesión:

```bash
firebase login
```

### 4. Inicializar Firebase (si no está inicializado)

```bash
# En la raíz del proyecto
firebase init functions

# Seleccionar:
# - Usar un proyecto existente
# - JavaScript
# - NO sobrescribir archivos existentes
```

## 🧪 Desarrollo Local

### Ejecutar Functions Localmente

```bash
cd backend/functions
npm run serve
```

Esto iniciará las functions en:

- `http://localhost:5001/TU_PROJECT_ID/us-central1/processImage`
- `http://localhost:5001/TU_PROJECT_ID/us-central1/getRunStatus`

### Configurar Frontend para Local

En `/src/services/comfyDeployService.ts`, la variable `FUNCTIONS_BASE_URL` ya está configurada para desarrollo local.

Solo necesitas cambiar `YOUR_PROJECT_ID` por tu ID de proyecto real.

O mejor aún, en tu `.env` del frontend:

```bash
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/tu-project-id/us-central1
```

## 🚀 Despliegue a Producción

### 1. Configurar Variables de Entorno en Firebase

```bash
firebase functions:config:set \
  comfy.api_key="TU_API_KEY" \
  comfy.deployment_bebelac="TU_DEPLOYMENT_ID_BEBELAC" \
  comfy.deployment_ejecutivo="TU_DEPLOYMENT_ID_EJECUTIVO" \
  comfy.deployment_nutrilon="TU_DEPLOYMENT_ID_NUTRILON"
```

### 2. Actualizar el código para usar config de Firebase

En `backend/functions/index.js`, reemplaza las líneas:

```javascript
const COMFY_DEPLOY_API_KEY = process.env.COMFY_DEPLOY_API_KEY;
```

Por:

```javascript
const COMFY_DEPLOY_API_KEY = functions.config().comfy.api_key;
```

Y actualizar los deployment IDs de la misma manera.

### 3. Desplegar las Functions

```bash
cd backend/functions
npm run deploy
```

O desplegar funciones específicas:

```bash
firebase deploy --only functions:processImage
firebase deploy --only functions:getRunStatus
```

### 4. Actualizar URLs en el Frontend

Una vez desplegadas, obtendrás URLs como:

```
https://us-central1-tu-project-id.cloudfunctions.net/processImage
https://us-central1-tu-project-id.cloudfunctions.net/getRunStatus
```

Actualiza tu `.env` del frontend:

```bash
VITE_FUNCTIONS_BASE_URL=https://us-central1-tu-project-id.cloudfunctions.net
```

## 📝 Estructura de las Functions

### `processImage`

- **Método:** POST
- **Body:** FormData con `image` (Blob) y `style` (string)
- **Respuesta:** `{ success: true, runId: string, style: string }`
- **Descripción:** Recibe la imagen, la sube a Storage, llama a ComfyDeploy

### `getRunStatus`

- **Método:** GET
- **Query:** `?runId=xxx`
- **Respuesta:** Objeto completo de status de ComfyDeploy
- **Descripción:** Consulta el estado de un run y lo guarda en Firestore

### `comfyDeployWebhook` (Opcional)

- **Método:** POST
- **Body:** Notificación de ComfyDeploy
- **Descripción:** Recibe webhooks de ComfyDeploy si los configuran

## 🔐 Seguridad

### Ventajas de usar Cloud Functions:

1. ✅ **API Key oculta** - No se expone en el frontend
2. ✅ **Sin CORS** - El navegador no bloquea las peticiones
3. ✅ **Control de acceso** - Puedes agregar autenticación
4. ✅ **Rate limiting** - Firebase lo maneja automáticamente
5. ✅ **Logs centralizados** - Ver errores en Firebase Console

### Recomendaciones adicionales:

```javascript
// Agregar autenticación (opcional)
const admin = require('firebase-admin');

exports.processImage = functions.https.onRequest((req, res) => {
  // Verificar token de Firebase Auth
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      // Usuario autenticado, continuar...
    })
    .catch(error => {
      return res.status(401).json({ error: 'Token inválido' });
    });
});
```

## 🐛 Debugging

### Ver logs en tiempo real:

```bash
firebase functions:log --only processImage
```

### Ver logs en Firebase Console:

1. Ir a Firebase Console
2. Functions → Logs
3. Filtrar por función

### Errores comunes:

#### 1. "YOUR_PROJECT_ID" en la URL

**Solución:** Reemplazar con tu ID real de proyecto

#### 2. CORS sigue fallando

**Solución:** Verificar que estás llamando a la URL correcta de la function

#### 3. 401 Unauthorized

**Solución:** Verificar que las variables de entorno estén configuradas

#### 4. Timeout

**Solución:** Aumentar el timeout en la configuración de la function:

```javascript
.runWith({ timeoutSeconds: 540, memory: "1GB" })
```

## 💰 Costos

Firebase Functions tiene un tier gratuito generoso:

- **Invocaciones:** 2M/mes gratis
- **GB-segundo:** 400,000/mes gratis
- **CPU-segundo:** 200,000/mes gratis

Para este proyecto, es muy probable que estés dentro del tier gratuito.

## 📊 Monitoreo

Puedes monitorear el uso en:

1. Firebase Console → Functions → Dashboard
2. Ver invocaciones, errores, tiempos de ejecución
3. Configurar alertas si pasas ciertos límites

## 🔄 Workflow Completo

```
1. Usuario captura foto en frontend
   ↓
2. Frontend → Cloud Function (processImage)
   ↓
3. Function sube imagen a Storage
   ↓
4. Function llama a ComfyDeploy API
   ↓
5. Function retorna runId a frontend
   ↓
6. Frontend hace polling a Cloud Function (getRunStatus)
   ↓
7. Function consulta ComfyDeploy y actualiza Firestore
   ↓
8. Frontend recibe status actualizado
```

## 📞 Soporte

Si tienes problemas:

1. Revisar logs de Functions
2. Verificar variables de entorno
3. Probar primero en local con `npm run serve`
4. Verificar que el proyecto de Firebase tenga plan Blaze (requerido para llamadas externas)

---

**Nota importante:** Firebase Functions requiere el **plan Blaze** (pay-as-you-go) para hacer llamadas a APIs externas como ComfyDeploy. El plan tiene un tier gratuito generoso.
