#!/bin/zsh

pwd
cd ../../

ls -al

echo $SENTRY_PROPERTIES | base64 -d > ios/sentry.properties
echo $GOOGLE_SERVICE_JSON | base64 -d > ios/GoogleService-Info.plist
echo "API_BASE_URL='$API_BASE_URL'" > .env

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install oven-sh/bun/bun ruby node fastfetch cocoapods

export CPPFLAGS="-I/opt/homebrew/opt/ruby/include"
export LDFLAGS="-L/opt/homebrew/opt/ruby/lib"
export PKG_CONFIG_PATH="/opt/homebrew/opt/ruby/lib/pkgconfig"
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

fastfetch

gem install bundler -v 2.4.13
# gem install cocoapods -v 1.16.2
# brew install cocoapods
# gem install cocoapods -v 1.16.2

bun install

cd ios
pod update hermes-engine --no-repo-update
pod install

ls -al
cd ..
cat ios/sentry.properties
cat ios/GoogleService-Info.plist
cat .env