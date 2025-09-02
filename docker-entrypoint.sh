#!/bin/sh

# Docker entrypoint script for Sereia Bot
# This script handles session creation and bot startup

echo "🧜‍♀️ Sereia Bot - Starting up..."

# Check if session directory exists and has content
if [ ! -d "/app/session" ] || [ -z "$(ls -A /app/session 2>/dev/null)" ]; then
    echo "📱 No session found. Starting session creation..."
    echo "⚠️  You need to scan the QR code to create a session."
    echo "⚠️  The container will wait for you to complete the setup."
    
    # Start the bot in session creation mode
    echo "🚀 Starting bot for session creation..."
    exec "$@"
else
    echo "✅ Session found. Starting bot normally..."
    exec "$@"
fi
