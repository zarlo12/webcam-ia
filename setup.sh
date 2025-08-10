#!/bin/bash

echo "🚀 Configurando Webcam AI Project..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 22+ primero."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Se recomienda Node.js 22+. Tienes la versión $(node -v)"
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
npm install

# Configurar backend
echo "📦 Instalando dependencias del backend..."
cd backend/functions
npm install
cd ../..

# Crear archivos .env si no existen
if [ ! -f .env ]; then
    echo "📝 Creando .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  Por favor configura las variables de entorno en .env"
fi

if [ ! -f backend/functions/.env ]; then
    echo "📝 Creando backend/.env desde .env.example..."
    cp backend/functions/.env.example backend/functions/.env
    echo "⚠️  Por favor configura REPLICATE_API_TOKEN en backend/functions/.env"
fi

# Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI no está instalado. Instalando..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI detectado"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu REPLICATE_API_TOKEN en backend/functions/.env"
echo "2. Configura tus variables de Firebase en .env"
echo "3. Ejecuta 'firebase login' y 'firebase use --add your-project-id'"
echo ""
echo "🚀 Para iniciar el desarrollo:"
echo "   Frontend: npm run dev"
echo "   Backend:  npm run functions:serve"
echo ""
echo "📖 Lee el README.md para más detalles"
