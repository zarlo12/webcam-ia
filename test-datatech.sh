#!/bin/bash

# 🟠 Pruebas de los endpoints de Claro media · DATA TECH
#
# Uso:  ./test-datatech.sh ruta/a/una/foto.jpg [plantilla] [proveedor]
#       plantilla = 1 DATA | 2 CONECTO | 3 INSIGHTS | 4 AUDIENCIAS | 5 SEÑALES
#                   (por defecto 1)
#       proveedor = replicate | fal   (por defecto, el que tenga desplegado)

BASE_URL="${DATATECH_BASE_URL:-https://us-central1-imagen-ia-845a3.cloudfunctions.net}"
PHOTO="$1"
PLANTILLA="${2:-1}"
PROVEEDOR="$3"

echo "🟠 1. Health check — proveedor activo y plantillas configuradas"
curl -s "$BASE_URL/datatechHealthCheck" | python3 -m json.tool

if [ -z "$PHOTO" ]; then
    echo ""
    echo "ℹ️  Para probar la generación pasa una foto:"
    echo "   ./test-datatech.sh mi-foto.jpg 5"
    exit 0
fi

if [ ! -f "$PHOTO" ]; then
    echo "❌ No existe el archivo: $PHOTO"
    exit 1
fi

echo ""
echo "🟠 2. Generando con la plantilla $PLANTILLA${PROVEEDOR:+ vía $PROVEEDOR} (entre 15 s y 3 min)..."

curl -X POST "$BASE_URL/generateDatatechImage" \
  -F "image=@$PHOTO" \
  -F "plantilla=$PLANTILLA" \
  ${PROVEEDOR:+-F "provider=$PROVEEDOR"} \
  -F "correo=prueba@ejemplo.com" \
  --max-time 600 \
  -s | python3 -m json.tool

echo ""
echo "✅ Listo. La URL en 'imageUrl' es el póster final en Firebase Storage."
