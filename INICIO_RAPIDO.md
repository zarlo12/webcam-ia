# 🚀 Inicio Rápido - Cloud Functions con ComfyDeploy

## ✅ Configuración Completada

Tu proyecto ya está configurado con:

- ✅ Variables de entorno (.env) en frontend y backend
- ✅ Cloud Functions con todas las dependencias instaladas
- ✅ Firebase configurado (`firebase.json` y `.firebaserc`)
- ✅ Código actualizado para usar Cloud Functions en lugar de llamadas directas

---

## 🧪 Modo 1: Prueba Local con Emuladores

### Paso 1: Iniciar los emuladores de Firebase

```bash
cd backend/functions
npm run serve
```

Esto iniciará:

- **Functions Emulator**: http://127.0.0.1:5001/imagen-ia-845a3/us-central1
- **Emulator UI**: http://127.0.0.1:4000

### Paso 2: Configurar frontend para desarrollo local

Edita tu archivo `.env` en la raíz del proyecto y **comenta** la línea de producción:

```env
# Use esta URL para desarrollo local con emuladores:
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/imagen-ia-845a3/us-central1

# Comentar la URL de producción mientras pruebas en local:
# VITE_FUNCTIONS_BASE_URL=https://us-central1-imagen-ia-845a3.cloudfunctions.net
```

### Paso 3: Iniciar el frontend

En otra terminal:

```bash
npm run dev
```

### Paso 4: Probar la aplicación

1. Abre http://localhost:5173
2. Toma una foto o sube una imagen
3. Los logs aparecerán en la terminal donde ejecutaste `npm run serve`
4. Puedes ver los requests en la UI de emuladores: http://127.0.0.1:4000

---

## 🌐 Modo 2: Deploy en Producción

### Paso 1: Verificar que tengas Firebase Blaze Plan

Las Cloud Functions que hacen llamadas externas (a ComfyDeploy) requieren el **plan Blaze**.

### Paso 2: Configurar secretos en Firebase

```bash
# Configurar las variables de entorno en Firebase
firebase functions:config:set \
  comfydeploy.api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU4YjI3MmJhLTdjMzgtNDM0Yi1hYWRhLWZiZTY3OTc3OTI4MCIsImlhdCI6MTcxNDQ0Mzg1MH0.y1j9qVIwLFPCYyIRSoepMILHj2RM7iLs23PAmW0gOa4" \
  comfydeploy.deployment_id="b7a75f2f-6e62-49b6-8a9a-008c8b93f433"

# Verificar configuración
firebase functions:config:get
```

### Paso 3: Actualizar index.js para producción (opcional)

Si quieres usar `functions.config()` en lugar de `process.env`, actualiza las líneas 13-17 de `backend/functions/index.js`:

```javascript
// Para producción con functions.config()
const COMFY_DEPLOY_API_KEY = functions.config().comfydeploy?.api_key || process.env.COMFY_DEPLOY_API_KEY;
const DEPLOYMENT_ID = functions.config().comfydeploy?.deployment_id || process.env.COMFY_DEPLOY_DEPLOYMENT_ID;
```

### Paso 4: Deploy

```bash
firebase deploy --only functions
```

Espera a que termine el deploy (puede tomar 3-5 minutos).

### Paso 5: Configurar frontend para producción

En tu archivo `.env`:

```env
# Usa la URL de producción (ya configurada):
VITE_FUNCTIONS_BASE_URL=https://us-central1-imagen-ia-845a3.cloudfunctions.net
```

### Paso 6: Rebuild y desplegar frontend

```bash
npm run build
# Luego despliega a tu hosting (Vercel, Firebase Hosting, etc.)
```

---

## 🔍 Verificar que todo funciona

### En Local:

1. Terminal 1: `cd backend/functions && npm run serve`
2. Terminal 2: `npm run dev`
3. Navega a http://localhost:5173
4. Toma una foto
5. Verifica en la terminal de Functions que se ejecute `processImage`
6. Ve el progreso en la UI del emulador: http://127.0.0.1:4000

### En Producción:

1. Verifica que las functions se desplegaron:
   ```bash
   firebase functions:list
   ```
2. Deberías ver:
   - `processImage`
   - `getRunStatus`
   - `comfyDeployWebhook` (opcional)

3. Prueba la aplicación en tu URL de producción

4. Verifica logs en tiempo real:
   ```bash
   firebase functions:log
   ```

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa**: Firebase Admin necesita permisos para acceder a Storage.

**Solución**:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `imagen-ia-845a3`
3. Ve a **Project Settings → Service Accounts**
4. Asegúrate de que el SDK Admin esté habilitado

### Error: "CORS policy blocked"

**Causa**: La URL de las functions no es correcta o CORS no está habilitado.

**Solución**:

- Verifica que `VITE_FUNCTIONS_BASE_URL` en `.env` coincida con tu entorno (local o producción)
- En producción, verifica que la función se desplegó correctamente con `firebase functions:list`

### Error: "Network request failed" al llamar a ComfyDeploy

**Causa**: ComfyDeploy API key inválida o red bloqueada.

**Solución**:

1. Verifica que `COMFY_DEPLOY_API_KEY` esté correctamente configurada en `.env` (local) o en `firebase functions:config` (producción)
2. Prueba hacer un `curl` directo a ComfyDeploy desde tu máquina:
   ```bash
   curl -X POST https://api.comfydeploy.com/api/run \
     -H "Authorization: Bearer TU_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"deployment_id": "b7a75f2f-6e62-49b6-8a9a-008c8b93f433"}'
   ```

### Error: Node version warning en Firebase Functions

**Causa**: Tu Node local es 22.x pero Functions espera Node 18.

**Solución**: Esto es solo una advertencia. Para desarrollo local está bien. En producción, Firebase usará automáticamente Node 18.

---

## 📊 Monitoreo en Tiempo Real

### Logs de Functions (Producción):

```bash
# Ver logs en tiempo real
firebase functions:log --only processImage,getRunStatus

# Ver los últimos 50 logs
firebase functions:log --limit 50
```

### Firestore (Verificar runs guardados):

1. Ve a [Firebase Console → Firestore](https://console.firebase.google.com/project/imagen-ia-845a3/firestore)
2. Busca la colección `ComfyDeployRuns`
3. Cada documento representa un run con su estado

---

## 📚 Documentación Adicional

- **SOLUCION_CORS.md**: Explicación completa de la arquitectura y la solución CORS
- **DEPLOY_FUNCTIONS.md**: Guía detallada de deployment paso a paso
- **backend/functions/README.md**: Documentación técnica de las Cloud Functions
- **MIGRACION_COMFYDEPLOY.md**: Historial de migración desde n8n

---

## 🎯 Próximos Pasos Sugeridos

1. **Probar en local primero** con emuladores
2. **Verificar que todo funcione** antes de deploy a producción
3. **Configurar el webhook** (opcional) para recibir notificaciones de ComfyDeploy
4. **Agregar más estilos** en `DEPLOYMENT_IDS` según necesites
5. **Optimizar polling** ajustando el intervalo de 3 segundos si es necesario

---

**¿Todo listo?** Ejecuta estos comandos para empezar:

```bash
# Terminal 1: Emuladores
cd backend/functions && npm run serve

# Terminal 2: Frontend
npm run dev
```

Luego abre http://localhost:5173 y ¡prueba tu app! 🎉
