#!/bin/zsh

pwd
cd ../../

echo $SENTRY_PROPERTIES | base64 -di > ios/sentry.properties
echo $GOOGLE_SERVICES_JSON | base64 -di > ios/GoogleService-Info.plist
echo "API_BASE_URL='$API_BASE_URL'" > .env

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node
#brew install cocoapods
brew install yarn
gem install cocoapods -v 1.16.2

yarn

cd ios
pod update hermes-engine --no-repo-update
pod install
