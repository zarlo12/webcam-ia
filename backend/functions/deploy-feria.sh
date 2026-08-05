#!/bin/bash

# 🌺 Antioquia nos enseña a llegar lejos (Claro · Feria de las Flores)
# Despliega SOLO las funciones de esta campaña.
#
# Importante: se despliega por nombre a propósito. Un `firebase deploy --only functions`
# sin filtro volvería a desplegar circus, VTEX y las funciones genéricas que viven en
# el mismo proyecto de Firebase.

set -e

FUNCTIONS="generateFeriaImage,feriaHealthCheck,getFeriaStatus"

echo "🌺 =========================================="
echo "🌺  FERIA DE LAS FLORES · DEPLOY"
echo "🌺 =========================================="
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Ejecuta este script desde backend/functions/"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Falta el archivo .env con REPLICATE_API_TOKEN y STORAGE_BUCKET"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f 2 | cut -d'.' -f 1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Se requiere Node.js 22 o superior (actual: $(node -v))"
    exit 1
fi
echo "✅ Node.js $(node -v)"

echo ""
echo "📦 Instalando dependencias..."
npm install

echo ""
echo "🔨 Compilando TypeScript..."
npm run build
echo "✅ Compilación correcta"

echo ""
echo "🌺 Funciones a desplegar:"
echo "   - generateFeriaImage   (POST · foto + filtro → foto generada)"
echo "   - feriaHealthCheck     (GET  · estado y plantillas configuradas)"
echo "   - getFeriaStatus       (GET  · ?predictionId=...)"
echo ""
read -p "¿Desplegar a Firebase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 0
fi

echo ""
echo "🚀 Desplegando..."
firebase deploy --only "functions:generateFeriaImage,functions:feriaHealthCheck,functions:getFeriaStatus"

echo ""
echo "🌺 =========================================="
echo "🌺  DESPLIEGUE COMPLETO 🎉"
echo "🌺 =========================================="
echo ""
echo "📋 Verifica el servicio:"
echo "   curl https://us-central1-\$(firebase use | grep -o '[a-z0-9-]*$')" \
     ".cloudfunctions.net/feriaHealthCheck"
echo ""
echo "   El frontend usa por defecto:"
echo "   https://us-central1-imagen-ia-845a3.cloudfunctions.net"
echo "   Si prefieres las URLs de Cloud Run que imprimió la CLI arriba,"
echo "   ponlas en VITE_FERIA_FUNCTIONS_URL del .env del frontend."
echo ""
echo "🔍 Logs:"
echo "   firebase functions:log --only generateFeriaImage"
echo ""
