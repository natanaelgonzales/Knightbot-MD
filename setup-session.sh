#!/bin/bash

# Setup script for Sereia Bot session creation
# This script helps you create a valid session before running in production

echo "🧜‍♀️ Sereia Bot - Session Setup"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📱 This script will help you create a valid WhatsApp session."
echo "⚠️  Make sure you have your phone ready to scan the QR code."
echo ""

# Create necessary directories
mkdir -p session logs tmp

echo "🔧 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting container for session creation..."
echo "📱 You will see a QR code in the logs. Scan it with WhatsApp."
echo "⏳ After scanning, the bot will create the session and exit."
echo ""

# Start container in interactive mode for session creation
docker-compose run --rm sereia-bot npm start

echo ""
echo "✅ Session creation completed!"
echo "🎉 You can now run the bot normally with: docker-compose up -d"
echo ""
