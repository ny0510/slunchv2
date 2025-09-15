#!/bin/zsh

set -e  # Exit on error

# Print current directory for debugging
echo "Current directory: $(pwd)"

# Navigate to project root (Xcode Cloud starts in ios/ci_scripts)
cd ../../

echo "Project root: $(pwd)"

echo "Creating sentry.properties..."
echo $SENTRY_PROPERTIES | base64 -d > ios/sentry.properties

echo "Creating GoogleService-Info.plist..."
echo $GOOGLE_SERVICES_JSON | base64 -d > ios/GoogleService-Info.plist

echo "Creating .env file..."
echo $ENV | base64 -d > .env

# Setup Homebrew and dependencies
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export PATH="/opt/homebrew/bin:$PATH"

# Install Node.js v22 
echo "Installing Node.js v22..."
brew install node@22
export PATH="/usr/local/opt/node@22/bin:$PATH"

# Install Bun 
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

# Install CocoaPods 1.16.2 
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
