#!/bin/zsh

echo $SENTRY_PROPERTIES | base64 -di > ios/sentry.properties
echo $GOOGLE_SERVICES_JSON | base64 -di > ios/GoogleService-Info.plist
echo "API_BASE_URL='$API_BASE_URL'" > .env


export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node
brew install cocoapods
brew install yarn

pwd
cd ../..
yarn

cd ios
pod update hermes-engine --no-repo-update
pod install
