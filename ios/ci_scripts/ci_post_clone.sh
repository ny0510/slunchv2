#!/bin/zsh

pwd
cd ../../

ls -al

echo $SENTRY_PROPERTIES_BASE64 | base64 -d > ios/sentry.properties
echo $GOOGLE_SERVICE_JSON | base64 -d > ios/GoogleService-Info.plist
echo $ENV_BASE64 | base64 -d > .env

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install oven-sh/bun/bun ruby@3.3 node fastfetch

export CPPFLAGS="-I/opt/homebrew/opt/ruby/include"
export LDFLAGS="-L/opt/homebrew/opt/ruby/lib"
export PKG_CONFIG_PATH="/opt/homebrew/opt/ruby/lib/pkgconfig"
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"

fastfetch

sudo gem install bundler -v 2.4.13
bundle config set deployment true
bundle install

bun install

cd ios
bundle exec pod update hermes-engine --no-repo-update
bundle exec pod install

ls -al
cd ..

# cat ios/sentry.properties
# cat ios/GoogleService-Info.plist
# cat .env