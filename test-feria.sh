#!/bin/bash

# 🌺 Pruebas de los endpoints de la campaña "Antioquia nos enseña a llegar lejos"
#
# Uso:  ./test-feria.sh ruta/a/una/foto.jpg [filtro]
#       filtro = 1 | 2 | 3   (por defecto 1)

BASE_URL="${FERIA_BASE_URL:-https://us-central1-imagen-ia-845a3.cloudfunctions.net}"
PHOTO="$1"
FILTRO="${2:-1}"

echo "🌺 1. Health check — muestra plantillas y prompts configurados"
curl -s "$BASE_URL/feriaHealthCheck" | python3 -m json.tool

if [ -z "$PHOTO" ]; then
    echo ""
    echo "ℹ️  Para probar la generación pasa una foto:"
    echo "   ./test-feria.sh mi-foto.jpg 1"
    exit 0
fi

if [ ! -f "$PHOTO" ]; then
    echo "❌ No existe el archivo: $PHOTO"
    exit 1
fi

echo ""
echo "🌺 2. Generando con el filtro $FILTRO (puede tardar entre 20 s y 2 min)..."

curl -X POST "$BASE_URL/generateFeriaImage" \
  -F "image=@$PHOTO" \
  -F "filtro=$FILTRO" \
  -F "nombre=Prueba cURL" \
  -F "cedula=1000000000" \
  -F "celular=3000000000" \
  -F "correo=prueba@ejemplo.com" \
  --max-time 600 \
  -s | python3 -m json.tool

echo ""
echo "✅ Listo. La URL en 'imageUrl' es la foto final en Firebase Storage."
