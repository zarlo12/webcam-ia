#!/bin/bash

# 🔴 Pruebas de los endpoints de Claro Tech Summit 2026
#
# Uso:  ./test-summit.sh ruta/a/una/foto.jpg [estilo] [proveedor]
#       estilo    = 1 acuarela | 2 ilustración | 3 universo fantástico | 4 cyberpunk
#                   (por defecto 1)
#       proveedor = replicate | fal   (por defecto, el que tenga desplegado)

BASE_URL="${SUMMIT_BASE_URL:-https://us-central1-imagen-ia-845a3.cloudfunctions.net}"
PHOTO="$1"
FILTRO="${2:-1}"
PROVEEDOR="$3"

echo "🔴 1. Health check — proveedor activo, estilos y referencias"
curl -s "$BASE_URL/summitHealthCheck" | python3 -m json.tool

if [ -z "$PHOTO" ]; then
    echo ""
    echo "ℹ️  Para probar la generación pasa una foto:"
    echo "   ./test-summit.sh mi-foto.jpg 4"
    exit 0
fi

if [ ! -f "$PHOTO" ]; then
    echo "❌ No existe el archivo: $PHOTO"
    exit 1
fi

echo ""
echo "🔴 2. Generando con el estilo $FILTRO${PROVEEDOR:+ vía $PROVEEDOR} (entre 10 s y 3 min según el proveedor)..."

curl -X POST "$BASE_URL/generateSummitImage" \
  -F "image=@$PHOTO" \
  -F "filtro=$FILTRO" \
  ${PROVEEDOR:+-F "provider=$PROVEEDOR"} \
  -F "nombre=Prueba" \
  -F "apellido=cURL" \
  -F "cedula=1000000000" \
  -F "correo=prueba@ejemplo.com" \
  -F "autorizaDatos=true" \
  --max-time 600 \
  -s | python3 -m json.tool

echo ""
echo "✅ Listo. La URL en 'imageUrl' es la imagen final, ya con el marco de la campaña."
