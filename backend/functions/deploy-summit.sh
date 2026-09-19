#!/bin/bash

# 🔴 Claro Tech Summit 2026 · Soluciones Digitales
# Despliega SOLO las funciones de esta activación.
#
# Importante: se despliega por nombre a propósito. Un `firebase deploy --only functions`
# sin filtro volvería a desplegar feria, circus, VTEX y las funciones genéricas que
# viven en el mismo proyecto de Firebase.

set -e

echo "🔴 =========================================="
echo "🔴  CLARO TECH SUMMIT 2026 · DEPLOY"
echo "🔴 =========================================="
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Ejecuta este script desde backend/functions/"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Falta el archivo .env con REPLICATE_API_TOKEN y STORAGE_BUCKET"
    exit 1
fi

# Las referencias de estilo y el marco viajan dentro del paquete de la función:
# el backend las publica en Storage la primera vez que se usan.
for asset in resultado-marco.png resultado-mascara.png referencia-1.jpg referencia-2.jpg referencia-3.jpg referencia-4.jpg; do
    if [ ! -f "assets/summit/$asset" ]; then
        echo "❌ Falta assets/summit/$asset"
        echo "   Corre: python3 ../../scripts/prepare-summit-assets.py"
        exit 1
    fi
done
echo "✅ Artes de la campaña presentes"

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
echo "🔴 Funciones a desplegar:"
echo "   - generateSummitImage  (POST · foto + filtro → imagen con marco)"
echo "   - summitHealthCheck    (GET  · estado y estilos configurados)"
echo "   - getSummitStatus      (GET  · ?predictionId=...)"
echo ""
read -p "¿Desplegar a Firebase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 0
fi

echo ""
echo "🚀 Desplegando..."
firebase deploy --only "functions:generateSummitImage,functions:summitHealthCheck,functions:getSummitStatus"

echo ""
echo "🔴 =========================================="
echo "🔴  DESPLIEGUE COMPLETO 🎉"
echo "🔴 =========================================="
echo ""
echo "📋 Verifica el servicio:"
echo "   curl https://us-central1-imagen-ia-845a3.cloudfunctions.net/summitHealthCheck"
echo ""
echo "   El frontend usa por defecto:"
echo "   https://us-central1-imagen-ia-845a3.cloudfunctions.net"
echo "   Si prefieres las URLs de Cloud Run que imprimió la CLI arriba,"
echo "   ponlas en VITE_SUMMIT_FUNCTIONS_URL del .env del frontend."
echo ""
echo "⚠️  Si cambiaste un arte de estilo, borra el objeto viejo de Storage"
echo "   (claro-tech-summit/referencias/) para que se vuelva a publicar."
echo ""
echo "🔍 Logs:"
echo "   firebase functions:log --only generateSummitImage"
echo ""
