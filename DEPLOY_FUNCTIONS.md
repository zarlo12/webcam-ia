# Guía Rápida: Deploy de Firebase Functions

## 🚀 Pasos Rápidos para Producción

### 1. Instalar dependencias

```bash
cd backend/functions
npm install
```

### 2. Configurar variables de entorno en Firebase

```bash
firebase functions:config:set \
  comfy.api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yc212eUtjdHVUU09IbVAxT2k3bUROM1lBNVEiLCJpYXQiOjE3NDcxMDQxMzN9.Z7lsrBuzQ4rP5Juq1q2JehMOLxT32KT7hlnCY-Gqvs4" \
  comfy.deployment_bebelac="b7a75f2f-6e62-49b6-8a9a-008c8b93f433" \
  comfy.deployment_ejecutivo="b7a75f2f-6e62-49b6-8a9a-008c8b93f433" \
  comfy.deployment_nutrilon="b7a75f2f-6e62-49b6-8a9a-008c8b93f433"
```

### 3. Actualizar index.js para usar config de Firebase

Reemplaza en `index.js`:

```javascript
const COMFY_DEPLOY_API_KEY = process.env.COMFY_DEPLOY_API_KEY;
```

Por:

```javascript
const COMFY_DEPLOY_API_KEY = functions.config().comfy.api_key;
```

Y actualiza los deployment IDs:

```javascript
const DEPLOYMENT_IDS = {
  bebelac: functions.config().comfy.deployment_bebelac,
  ejecutivo: functions.config().comfy.deployment_ejecutivo,
  nutrilon: functions.config().comfy.deployment_nutrilon,
};
```

### 4. Desplegar

```bash
firebase deploy --only functions
```

### 5. Obtener las URLs

Después del deploy, te dará las URLs. Ejemplo:

```
✔  functions[processImage(us-central1)]: https://us-central1-tu-project-id.cloudfunctions.net/processImage
✔  functions[getRunStatus(us-central1)]: https://us-central1-tu-project-id.cloudfunctions.net/getRunStatus
```

### 6. Actualizar .env del frontend

En la raíz del proyecto, actualiza `.env`:

```bash
VITE_FUNCTIONS_BASE_URL=https://us-central1-tu-project-id.cloudfunctions.net
```

### 7. Rebuild el frontend

```bash
npm run build
```

¡Listo! 🎉

---

## 🧪 Para Desarrollo Local

### 1. Configurar .env local

```bash
cd backend/functions
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Ejecutar emulador

```bash
npm run serve
```

### 3. Actualizar .env del frontend

```bash
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/TU_PROJECT_ID/us-central1
```

### 4. Iniciar frontend

```bash
npm run dev
```

---

## ⚠️ Importante

- Firebase Functions requiere **plan Blaze** para llamadas externas
- Asegúrate de tener el plan configurado antes de desplegar
- El tier gratuito cubre la mayoría de los casos de uso
