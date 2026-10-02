#!/bin/bash

# 🟠 Claro media · DATA TECH — "15 minutos"
# Despliega SOLO las funciones de esta activación.
#
# Importante: se despliega por nombre a propósito. Un `firebase deploy --only functions`
# sin filtro volvería a desplegar claro-tech-summit —que está EN PRODUCCIÓN con
# participantes reales—, feria, circus y las funciones genéricas del mismo proyecto.

set -e

FUNCIONES="generateDatatechImage,datatechHealthCheck,listDatatechParticipantes"

echo "🟠 =========================================="
echo "🟠  CLARO MEDIA · DATA TECH · DEPLOY"
echo "🟠 =========================================="
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Ejecuta este script desde backend/functions/"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Falta el archivo .env con STORAGE_BUCKET y la clave del proveedor"
    exit 1
fi

# El proveedor y su clave tienen que cuadrar, o el kiosco falla en la primera
# foto del evento en vez de aquí.
PROVIDER=$(grep -E "^IMAGE_PROVIDER=" .env | cut -d= -f2- | tr -d ' "' | tr '[:upper:]' '[:lower:]')
PROVIDER=${PROVIDER:-replicate}

case "$PROVIDER" in
    fal)
        grep -qE "^FAL_KEY=.+" .env || { echo "❌ IMAGE_PROVIDER=fal pero falta FAL_KEY en .env"; exit 1; }
        echo "✅ Proveedor: fal.ai"
        ;;
    replicate)
        grep -qE "^REPLICATE_API_TOKEN=.+" .env || { echo "❌ IMAGE_PROVIDER=replicate pero falta REPLICATE_API_TOKEN en .env"; exit 1; }
        echo "✅ Proveedor: Replicate"
        ;;
    *)
        echo "❌ IMAGE_PROVIDER debe ser 'replicate' o 'fal'. Está en: '$PROVIDER'"
        exit 1
        ;;
esac

# Las plantillas viajan dentro del paquete: el backend las publica en Storage
# la primera vez que se usan.
for n in 1 2 3 4 5; do
    if [ ! -f "assets/datatech/plantilla-$n.jpg" ]; then
        echo "❌ Falta assets/datatech/plantilla-$n.jpg"
        echo "   Corre: python3 ../../scripts/prepare-datatech-assets.py"
        exit 1
    fi
done
echo "✅ Las 5 plantillas presentes"

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
echo "🟠 Funciones a desplegar:"
echo "   - generateDatatechImage      (POST · foto + plantilla → póster)"
echo "   - datatechHealthCheck        (GET  · estado y plantillas configuradas)"
echo "   - listDatatechParticipantes  (GET  · listado para el panel)"
echo ""
echo "⚠️  NO se tocan las funciones del Summit, que están en producción."
echo ""
read -p "¿Desplegar a Firebase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Despliegue cancelado"
    exit 0
fi

echo ""
echo "🚀 Desplegando..."
firebase deploy --only "functions:generateDatatechImage,functions:datatechHealthCheck,functions:listDatatechParticipantes"

echo ""
echo "🟠 =========================================="
echo "🟠  DESPLIEGUE COMPLETO 🎉"
echo "🟠 =========================================="
echo ""
echo "📋 Verifica el servicio:"
echo "   curl https://us-central1-imagen-ia-845a3.cloudfunctions.net/datatechHealthCheck"
echo ""
echo "⚠️  Si cambiaste una plantilla, borra el objeto viejo de Storage"
echo "   (claro-datatech/plantillas/) para que se vuelva a publicar."
echo ""
echo "🔍 Logs:"
echo "   firebase functions:log --only generateDatatechImage"
echo ""
