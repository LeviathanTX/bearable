#!/bin/bash

# Mayo Care Platform - Voice Agent Deployment Script
# This script deploys the voice agent to Railway

set -e  # Exit on error

echo "🚀 Deploying Mayo Voice Agent to Railway..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI authenticated"
echo ""

# Initialize project if needed
if [ ! -f ".railway" ]; then
    echo "📦 Initializing Railway project..."
    railway init --name mayo-voice-agent
else
    echo "✅ Railway project already initialized"
fi

echo ""
echo "🔑 Setting environment variables from .env file..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with all required variables."
    exit 1
fi

# Load and set environment variables from .env
source .env
railway variables set LIVEKIT_API_KEY="$LIVEKIT_API_KEY"
railway variables set LIVEKIT_API_SECRET="$LIVEKIT_API_SECRET"
railway variables set LIVEKIT_URL="$LIVEKIT_URL"
railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
railway variables set ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY"
railway variables set DEEPGRAM_API_KEY="$DEEPGRAM_API_KEY"
railway variables set BACKEND_URL="$BACKEND_URL"
railway variables set LOG_LEVEL="${LOG_LEVEL:-INFO}"

echo "✅ Environment variables set"
echo ""

# Deploy
echo "🚢 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 To view logs:"
echo "   railway logs"
echo ""
echo "🔗 To open Railway dashboard:"
echo "   railway open"
echo ""
