#!/bin/bash

# Ejemplo de prueba con cURL
# Reemplaza "path/to/your/image.jpg" con la ruta real de tu imagen

echo "🧪 Testing AI Image Generation API with cURL..."

# Health Check primero
echo "1. Testing Health Check..."
curl -X GET "https://healthcheck-buybcovkna-uc.a.run.app" \
  -H "Accept: application/json"

echo -e "\n\n2. Testing AI Image Generation..."

# Generar imagen AI (reemplaza la ruta de la imagen)
curl -X POST "https://generateaiimage-buybcovkna-uc.a.run.app" \
  -F "image=@/path/to/your/image.jpg" \
  -F "prompt=Transform this into a professional headshot" \
  -F "style=professional" \
  -F "userId=test-user-curl" \
  --max-time 600

echo -e "\n✅ Test completed!"
