#!/bin/zsh

set -e  # Exit on error

# Print current directory for debugging
echo "Current directory: $(pwd)"

# Navigate to project root (Xcode Cloud starts in ios/ci_scripts)
cd ../../

echo "Project root: $(pwd)"

# Create required files from environment variables
if [ ! -z "$SENTRY_PROPERTIES" ]; then
    echo "Creating sentry.properties..."
    echo $SENTRY_PROPERTIES | base64 -d > ios/sentry.properties
fi

if [ ! -z "$GOOGLE_SERVICES_JSON" ]; then
    echo "Creating GoogleService-Info.plist..."
    echo $GOOGLE_SERVICES_JSON | base64 -d > ios/GoogleService-Info.plist
fi

# Create .env file
echo "Creating .env file..."
echo "API_BASE_URL='$API_BASE_URL'" > .env

# Setup Homebrew and dependencies
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export PATH="/opt/homebrew/bin:$PATH"

# Install Node.js v22 (matching local environment)
echo "Installing Node.js v22..."
brew install node@22
export PATH="/usr/local/opt/node@22/bin:$PATH"

# Install Bun (matching local version 1.2.21)
echo "Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Setup Ruby environment for CocoaPods
echo "Setting up Ruby environment..."
if ! command -v rbenv &> /dev/null; then
    brew install rbenv
fi

# Initialize rbenv
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

# Install Ruby 3.4.1 (matching local version)
if ! rbenv versions | grep -q 3.4.1; then
    echo "Installing Ruby 3.4.1..."
    rbenv install 3.4.1
fi

rbenv global 3.4.1
rbenv rehash

# Install CocoaPods 1.16.2 (matching local version)
echo "Installing CocoaPods 1.16.2..."
rbenv exec gem install cocoapods -v 1.16.2

# Verify versions
echo "Node version: $(node --version || echo 'Node not found')"
echo "Node path: $(which node || echo 'Node not in PATH')"
echo "Bun version: $(bun --version || echo 'Bun not found')"
echo "Ruby version: $(ruby --version || echo 'Ruby not found')"
echo "Pod version: $(rbenv exec pod --version || echo 'Pod not found')"

# Install Node dependencies
echo "Installing Node dependencies with Bun..."
bun install --frozen-lockfile

# Verify bun installation
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not created. Retrying with npm..."
    npm install
fi

# Install iOS dependencies
echo "Installing CocoaPods dependencies..."
cd ios

# Clean previous installations if any
if [ -d "Pods" ]; then
    echo "Cleaning previous Pods installation..."
    rm -rf Pods
    rm -f Podfile.lock
fi

# Ensure rbenv is properly initialized for pod commands
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

# Ensure node is available for CocoaPods
export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/bin:$PATH"

# Debug: Check node availability
echo "Checking node for CocoaPods..."
echo "Node location: $(which node)"
echo "Node version: $(node --version)"

# Install pods (matching local setup)
echo "Running pod install..."
rbenv exec pod install

# If pod install fails, try with repo update
if [ $? -ne 0 ]; then
    echo "Pod install failed, trying with repo update..."
    rbenv exec pod install --repo-update
fi

# Verify iOS dependencies
echo "Verifying iOS dependencies..."
if [ -d "Pods" ]; then
    echo "✓ Pods directory created"
    echo "Number of pods installed: $(ls -1 Pods | wc -l)"
else
    echo "✗ Pods directory missing - build will likely fail"
    exit 1
fi

cd ..

# Verify created files (without printing sensitive content)
echo "\nVerifying configuration files..."
if [ -f "ios/sentry.properties" ]; then
    echo "✓ sentry.properties created"
else
    echo "⚠️  sentry.properties missing (may not be required)"
fi

if [ -f "ios/GoogleService-Info.plist" ]; then
    echo "✓ GoogleService-Info.plist created"
else
    echo "✗ GoogleService-Info.plist missing - Firebase will not work"
fi

if [ -f ".env" ]; then
    echo "✓ .env created"
else
    echo "✗ .env missing - API calls will fail"
    exit 1
fi

# Verify node_modules
if [ -d "node_modules" ]; then
    echo "✓ node_modules created"
    echo "Number of packages: $(ls -1 node_modules | wc -l)"
else
    echo "✗ node_modules missing - build will fail"
    exit 1
fi

echo "\n✅ Post-clone script completed successfully!"