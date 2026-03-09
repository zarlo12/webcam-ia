# ✅ Solución al Problema de CORS con ComfyDeploy

## 🎯 Problema

El navegador bloqueaba las peticiones directas a ComfyDeploy API por política de CORS.

## ✅ Solución Implementada

Firebase Cloud Functions actúa como backend/proxy para manejar las peticiones a ComfyDeploy de forma segura.

---

## 📁 Archivos Creados/Modificados

### Backend (Cloud Functions)

- ✅ `backend/functions/package.json` - Dependencias de las functions
- ✅ `backend/functions/index.js` - Lógica de las Cloud Functions
- ✅ `backend/functions/.env.example` - Template de variables de entorno
- ✅ `backend/functions/README.md` - Documentación completa

### Frontend (Servicio)

- ✅ `src/services/comfyDeployService.ts` - Actualizado para usar Cloud Functions

### Documentación

- ✅ `DEPLOY_FUNCTIONS.md` - Guía rápida de deploy
- ✅ `SOLUCION_CORS.md` - Este archivo

---

## 🚀 Setup Rápido

### 1⃣ Instalar Dependencias de Functions

```bash
cd backend/functions
npm install
```

### 2⃣ Para Desarrollo Local

#### a) Configurar variables de entorno

```bash
cd backend/functions
cp .env.example .env
```

Editar `.env` con tus credenciales.

#### b) Ejecutar emulador de Functions

```bash
npm run serve
```

Esto iniciará las functions en `http://localhost:5001`

#### c) Configurar frontend

En la raíz del proyecto, crea/actualiza `.env`:

```bash
# Reemplazar TU_PROJECT_ID con tu ID real de Firebase
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/TU_PROJECT_ID/us-central1
```

#### d) Iniciar frontend

```bash
npm run dev
```

### 3⃣ Para Producción

#### a) Configurar variables en Firebase

```bash
firebase functions:config:set \
  comfy.api_key="TU_API_KEY" \
  comfy.deployment_bebelac="TU_DEPLOYMENT_ID" \
  comfy.deployment_ejecutivo="TU_DEPLOYMENT_ID" \
  comfy.deployment_nutrilon="TU_DEPLOYMENT_ID"
```

#### b) Actualizar index.js para usar config

Reemplaza `process.env.COMFY_DEPLOY_API_KEY` por `functions.config().comfy.api_key`

#### c) Desplegar functions

```bash
firebase deploy --only functions
```

#### d) Actualizar .env del frontend

```bash
VITE_FUNCTIONS_BASE_URL=https://us-central1-tu-project-id.cloudfunctions.net
```

#### e) Rebuild frontend

```bash
npm run build
```

---

## 🔄 Flujo Actualizado

### Antes (Con CORS):

```
Frontend → ❌ ComfyDeploy API → CORS Error
```

### Ahora (Sin CORS):

```
Frontend → ✅ Cloud Function → ComfyDeploy API → Success
```

---

## 📝 Cloud Functions Disponibles

### `processImage`

**Endpoint:** `POST /processImage`  
**Body:** FormData con `image` (Blob) y `style` (string)  
**Retorna:** `{ success: true, runId: string, style: string }`

**Función:**

1. Recibe la imagen del frontend
2. Sube imagen a Firebase Storage
3. Obtiene URL pública
4. Llama a ComfyDeploy API con la URL
5. Guarda run inicial en Firestore
6. Retorna runId al frontend

### `getRunStatus`

**Endpoint:** `GET /getRunStatus?runId=xxx`  
**Retorna:** Objeto completo de status de ComfyDeploy

**Función:**

1. Recibe runId
2. Consulta status en ComfyDeploy API
3. Actualiza status en Firestore
4. Retorna status al frontend

### `comfyDeployWebhook` (Opcional)

**Endpoint:** `POST /comfyDeployWebhook`  
Webhook para recibir notificaciones de ComfyDeploy

---

## 🔐 Ventajas de esta Solución

1. ✅ **Sin CORS** - Las peticiones van desde backend
2. ✅ **API Key segura** - No se expone en el frontend
3. ✅ **Centralizado** - Logs y monitoreo en un solo lugar
4. ✅ **Escalable** - Firebase maneja el scaling automático
5. ✅ **Gratis** (en su mayoría) - Tier gratuito generoso
6. ✅ **Fácil debugging** - Logs centralizados en Firebase Console

---

## ⚠️ Requisitos Importantes

### Plan Blaze de Firebase

Las Cloud Functions necesitan el plan Blaze (pay-as-you-go) para hacer llamadas a APIs externas.

**¿Es gratuito?**

- Tier gratuito: 2M invocaciones/mes
- Para este proyecto probablemente sea gratis
- Solo pagas si superas los límites

**Activar Plan Blaze:**

1. Ir a Firebase Console
2. Upgrade to Blaze
3. Agregar método de pago (no se cobra si no superas límites)

---

## 🧪 Verificar que Funciona

### En Local:

1. Iniciar emulador de functions:

   ```bash
   cd backend/functions && npm run serve
   ```

2. En otro terminal, iniciar frontend:

   ```bash
   npm run dev
   ```

3. Abrir `http://localhost:5173`

4. Tomar una foto y procesar

5. Verificar en consola del navegador:
   - ✅ "Enviando imagen a Cloud Function..."
   - ✅ "Respuesta de Cloud Function: { runId: ... }"
   - ❌ NO debe aparecer error de CORS

### En Producción:

1. Deploy de functions
2. Actualizar .env con las URLs de producción
3. Rebuild del frontend
4. Deploy del frontend
5. Probar en la URL de producción

---

## 🐛 Troubleshooting

### Error: "YOUR_PROJECT_ID"

**Solución:** Reemplazar con tu ID real de Firebase en el .env

### Error: CORS sigue apareciendo

**Solución:** Verificar que VITE_FUNCTIONS_BASE_URL apunte correctamente a tus functions

### Error: 401 Unauthorized

**Solución:** Verificar que las variables de entorno estén configuradas en Firebase

### Error: Timeout

**Solución:** Las functions ya tienen 540s de timeout, debería ser suficiente

### Functions no se despliegan

**Solución:**

1. Verificar que tienes plan Blaze
2. `firebase login`
3. `firebase use --add` para seleccionar proyecto

---

## 📊 Monitoreo

Ver logs en tiempo real:

```bash
firebase functions:log
```

O en Firebase Console:

1. Functions → Logs
2. Filtrar por función específica
3. Ver errores, tiempos de ejecución, etc.

---

## 💡 Próximos Pasos

1. ✅ Implementar autenticación (opcional)
2. ✅ Agregar rate limiting personalizado (opcional)
3. ✅ Implementar webhooks de ComfyDeploy (opcional)
4. ✅ Agregar caché para imágenes repetidas (opcional)

---

## 📞 Soporte

Si tienes problemas:

1. Revisar `backend/functions/README.md` para documentación completa
2. Revisar `DEPLOY_FUNCTIONS.md` para guía rápida
3. Ver logs en Firebase Console
4. Verificar que el plan Blaze esté activo

---

**¡Listo para usar!** 🎉
