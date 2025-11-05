#!/bin/bash
# Setup script to enable Claude to deploy autonomously

echo "🔧 Setting up deployment tools for Claude..."
echo ""

# Step 1: Check GitHub CLI
echo "1️⃣ Checking GitHub CLI (gh)..."
if command -v gh &> /dev/null; then
    echo "   ✅ GitHub CLI installed: $(gh --version | head -1)"

    # Check authentication
    if gh auth status &> /dev/null; then
        echo "   ✅ GitHub CLI authenticated"
    else
        echo "   ⚠️  GitHub CLI not authenticated"
        echo "   📝 Run: gh auth login"
    fi
else
    echo "   ❌ GitHub CLI not installed"
    echo "   📝 Install: brew install gh (Mac) or see https://cli.github.com"
fi

echo ""

# Step 2: Check Vercel CLI
echo "2️⃣ Checking Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo "   ✅ Vercel CLI installed: $(vercel --version)"

    # Check authentication
    if vercel whoami &> /dev/null; then
        echo "   ✅ Vercel CLI authenticated"
    else
        echo "   ⚠️  Vercel CLI not authenticated"
        echo "   📝 Run: vercel login"
    fi
else
    echo "   ❌ Vercel CLI not installed"
    echo "   📝 Install: npm install -g vercel"
fi

echo ""

# Step 3: Check other useful tools
echo "3️⃣ Checking additional tools..."
for tool in git curl jq npm node; do
    if command -v $tool &> /dev/null; then
        echo "   ✅ $tool installed"
    else
        echo "   ❌ $tool not installed"
    fi
done

echo ""
echo "=========================================="
echo "📋 SUMMARY"
echo "=========================================="
echo ""
echo "Run these commands to enable full automation:"
echo ""
echo "# If gh needs authentication:"
echo "gh auth login"
echo ""
echo "# If vercel needs installation:"
echo "npm install -g vercel"
echo ""
echo "# If vercel needs authentication:"
echo "vercel login"
echo ""
echo "Once complete, Claude can:"
echo "  ✅ Create PRs automatically"
echo "  ✅ Deploy to Vercel preview/production"
echo "  ✅ Monitor deployment status"
echo "  ✅ Run full CI/CD workflows"
echo ""
