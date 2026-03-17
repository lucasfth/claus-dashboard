#!/bin/bash

# Setup Convex GitHub Actions Secret
# This script helps you add your Convex deploy key to GitHub Actions

set -e

echo "🔧 Setting up Convex GitHub Actions integration..."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
  echo "   https://cli.github.com/manual/installation"
  exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated with GitHub. Please run: gh auth login"
  exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q)
echo "📦 Repository: $REPO"
echo ""

# Provide instructions for getting deploy key
echo "📋 Instructions to get your Convex Deploy Key:"
echo "   1. Open https://dashboard.convex.dev in your browser"
echo "   2. Click on your 'claus-dashboard' project"
echo "   3. Go to Settings → Authentication"
echo "   4. Under 'API Keys' or 'Deploy Keys', find your key"
echo "   5. Click the copy icon (📋) next to the key to copy the full key value"
echo "   ⚠️  Make sure you copy the FULL KEY VALUE (long base64 string), not just the name!"
echo ""

# Prompt for deploy key
read -sp "🔐 Paste your Convex deploy key and press Enter: " DEPLOY_KEY
echo ""

if [ -z "$DEPLOY_KEY" ]; then
  echo "❌ No deploy key provided. Aborting."
  exit 1
fi

# Validate the key format (basic check)
if [ ${#DEPLOY_KEY} -lt 50 ]; then
  echo "❌ Deploy key seems too short (got ${#DEPLOY_KEY} chars, expected 50+)."
  echo "   Make sure you copied the FULL KEY VALUE, not just the key name."
  echo "   The key should be a long base64-encoded string starting with 'eyJ'"
  exit 1
fi

# Add the secret to GitHub
echo "🚀 Adding CONVEX_DEPLOY_KEY to GitHub secrets..."
gh secret set CONVEX_DEPLOY_KEY --body "$DEPLOY_KEY" --repo "$REPO"

if [ $? -eq 0 ]; then
  echo "✅ Success! CONVEX_DEPLOY_KEY secret has been added to GitHub."
  echo ""
  echo "📌 Next steps:"
  echo "   1. Push a commit to the main branch"
  echo "   2. Go to https://github.com/$REPO/actions"
  echo "   3. Watch the 'Convex Sync' workflow run"
  echo "   4. It should complete successfully!"
  echo ""
else
  echo "❌ Failed to add secret. Please try again or add it manually:"
  echo "   1. Go to https://github.com/$REPO/settings/secrets/actions"
  echo "   2. Click 'New repository secret'"
  echo "   3. Name: CONVEX_DEPLOY_KEY"
  echo "   4. Value: <your deploy key>"
  exit 1
fi
