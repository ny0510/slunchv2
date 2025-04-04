#!/bin/zsh

pwd
cd ../../

echo $SENTRY_PROPERTIES | base64 -di > ios/sentry.properties
echo $GOOGLE_SERVICES_JSON | base64 -di > ios/GoogleService-Info.plist
echo "API_BASE_URL='$API_BASE_URL'" > .env

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install oven-sh/bun/bun
brew install rbenv
rbenv install 3.4.1
rbenv global 3.4.1
rbenv rehash
rbenv exec gem install bundler -v 2.4.13
rbenv exec gem install cocoapods -v 1.16.2
#brew install cocoapods
# gem install cocoapods -v 1.16.2

bun install

cd ios
pod update hermes-engine --no-repo-update
pod install
