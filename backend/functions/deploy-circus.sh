#!/bin/bash

# 🎪 Circus AI - Deploy Script
# Deploys only circus-specific Cloud Functions

set -e  # Exit on error

echo "🎪 =========================================="
echo "🎪  CIRCUS AI - DEPLOYMENT SCRIPT"
echo "🎪 =========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Please run this script from backend/functions/ directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your credentials:"
        echo "   REPLICATE_API_TOKEN=your_token_here"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f 2 | cut -d'.' -f 1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Error: Node.js 22 or higher required"
    echo "   Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Confirm deployment
echo ""
echo "🎪 Ready to deploy circus functions:"
echo "   - generateCircusImage"
echo "   - circusHealthCheck"
echo "   - getCircusStatus"
echo ""
read -p "Deploy to Firebase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Deploy circus functions
echo ""
echo "🚀 Deploying circus functions..."
firebase deploy --only functions:generateCircusImage,functions:circusHealthCheck,functions:getCircusStatus

if [ $? -eq 0 ]; then
    echo ""
    echo "🎪 =========================================="
    echo "🎪  DEPLOYMENT SUCCESSFUL! 🎉"
    echo "🎪 =========================================="
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy the Cloud Function URLs from the output above"
    echo "   2. Update src/services/aiImageService.ts with new URLs:"
    echo "      - generateImageUrl"
    echo "      - healthCheckUrl"  
    echo "      - processingStatusUrl"
    echo "   3. Rebuild frontend: npm run build"
    echo "   4. Test with: npm run dev"
    echo ""
    echo "🔍 Monitor logs with:"
    echo "   firebase functions:log --only generateCircusImage"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo "   Check the error messages above"
    echo "   Common issues:"
    echo "   - Not logged in: firebase login"
    echo "   - Wrong project: firebase use your-project-id"
    echo "   - Missing permissions: check IAM roles"
    exit 1
fi
