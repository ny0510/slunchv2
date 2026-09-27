#!/bin/bash
# One-click signed Android release build for macOS.
# Double-click in Finder, or run: scripts/build-android-release.command
# Checks every tool, file and variable first, then builds. Artifacts: build/release/.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="$PWD/build/release"

errors=()
fail() { errors+=("$*"); }
ok() { printf '  \033[32m✔\033[0m %s\n' "$*"; }
step() { printf '\n\033[36m▶ %s\033[0m\n' "$*"; }

# Signing values: environment (e.g. `op run --env-file=.release.env -- ...`) or local .release.env.
if [[ -f .release.env ]]; then set -a; source .release.env; set +a; fi

step "Checking tools"
if command -v node >/dev/null; then
  major=$(node -p 'process.versions.node.split(".")[0]')
  ((major >= 20)) && ok "node $(node --version)" || fail "Node >= 20 required (found $(node --version)); CI uses 22."
else fail "node not found (install Node 22)."; fi
command -v bun >/dev/null && ok "bun $(bun --version)" || fail "bun not found."

JAVA_HOME=${JAVA_HOME:-$(/usr/libexec/java_home -v 17+ 2>/dev/null || true)}
if [[ -n "$JAVA_HOME" && -x "$JAVA_HOME/bin/java" ]]; then
  export JAVA_HOME
  jv=$("$JAVA_HOME/bin/java" -XshowSettings:properties -version 2>&1 | awk -F'= ' '/java.specification.version/{print $2}')
  ((${jv%%.*} >= 17)) && ok "JDK $jv ($JAVA_HOME)" || fail "JDK >= 17 required (found $jv); CI uses 17."
else fail "JDK 17 not found (install one, or set JAVA_HOME)."; fi

export ANDROID_HOME=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}
if [[ -d "$ANDROID_HOME" ]]; then
  ok "Android SDK $ANDROID_HOME"
  [[ -d "$ANDROID_HOME/platforms/android-37.0" || -d "$ANDROID_HOME/platforms/android-37" ]] \
    && ok "platforms;android-37.0" || fail "SDK package missing: platforms;android-37.0"
  [[ -x "$ANDROID_HOME/build-tools/37.0.0/apksigner" ]] && ok "build-tools;37.0.0" || fail "SDK package missing: build-tools;37.0.0"
  [[ -d "$ANDROID_HOME/ndk/29.0.13113456" ]] && ok "ndk;29.0.13113456" || fail "SDK package missing: ndk;29.0.13113456"
  [[ -d "$ANDROID_HOME/licenses" ]] && ok "SDK licenses directory" || fail "SDK licenses not accepted ($ANDROID_HOME/licenses missing)."
else fail "Android SDK not found at $ANDROID_HOME (set ANDROID_HOME)."; fi

step "Checking files"
if [[ -f .env ]]; then
  ok ".env"
  for key in API_BASE_URL \
    ANDROID_HOME_BANNER_AD_UNIT_ID ANDROID_NOTI_BANNER_AD_UNIT_ID ANDROID_SCHEDULE_NATIVE_AD_UNIT_ID ANDROID_MEAL_NATIVE_AD_UNIT_ID ANDROID_NOTI_NATIVE_AD_UNIT_ID \
    IOS_HOME_BANNER_AD_UNIT_ID IOS_NOTI_BANNER_AD_UNIT_ID IOS_SCHEDULE_NATIVE_AD_UNIT_ID IOS_MEAL_NATIVE_AD_UNIT_ID IOS_NOTI_NATIVE_AD_UNIT_ID; do
    grep -Eq "^${key}=.+" .env || fail ".env: $key is missing or empty."
  done
else fail ".env missing in repo root."; fi

if [[ -f google-services.json ]]; then
  if node -e 'const j=require("./google-services.json");process.exit(j.client.some(c=>c.client_info.android_client_info.package_name==="kr.ny64.slunchv2")?0:1)' 2>/dev/null; then
    ok "google-services.json (kr.ny64.slunchv2)"
  else fail "google-services.json has no client for kr.ny64.slunchv2 (or is invalid JSON)."; fi
else fail "google-services.json missing in repo root."; fi

if [[ -f sentry.properties ]]; then ok "sentry.properties (Sentry uploads on)"
else
  printf '  - sentry.properties missing: Sentry uploads will be skipped.\n'
  export SENTRY_DISABLE_AUTO_UPLOAD=true SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD=true
fi

step "Checking signing variables"
missing_sign=0
for v in RN_UPLOAD_STORE_FILE RN_UPLOAD_STORE_PASSWORD RN_UPLOAD_KEY_ALIAS RN_UPLOAD_KEY_PASSWORD; do
  if [[ -n "${!v:-}" ]]; then ok "$v"; else fail "$v not set (put it in .release.env)."; missing_sign=1; fi
done
if ((missing_sign == 0)) && [[ -n "${JAVA_HOME:-}" ]]; then
  if [[ ! -f "$RN_UPLOAD_STORE_FILE" ]]; then fail "Keystore not found: $RN_UPLOAD_STORE_FILE"
  elif "$JAVA_HOME/bin/keytool" -list -keystore "$RN_UPLOAD_STORE_FILE" -storepass:env RN_UPLOAD_STORE_PASSWORD \
       -alias "$RN_UPLOAD_KEY_ALIAS" >/dev/null 2>&1; then ok "keystore opens and contains alias"
  else fail "Keystore password wrong or alias '$RN_UPLOAD_KEY_ALIAS' not in $RN_UPLOAD_STORE_FILE."; fi
fi

step "Checking disk"
free_kb=$(df -Pk . | awk 'NR==2{print $4}')
free_gb=$(( free_kb / 1024 / 1024 ))
(( free_gb >= 20 )) && ok "${free_gb} GiB free" || fail "Only ${free_gb} GiB free; need >= 20 GiB."

[[ -n "${JAVA_HOME:-}" ]] || ((missing_sign)) || fail "Keystore not checked: needs a JDK (keytool)."

if ((${#errors[@]})); then
  printf '\n\033[31m✖ %d problem(s); nothing was built:\033[0m\n' "${#errors[@]}" >&2
  printf '  - %s\n' "${errors[@]}" >&2
  exit 1
fi

step "All checks passed. Building."
caffeinate -dims -w $$ &
bun install --frozen-lockfile
cp google-services.json android/app/google-services.json
[[ ! -f sentry.properties ]] || cp sentry.properties android/sentry.properties
(cd android && ./gradlew app:assembleRelease app:bundleRelease --no-daemon \
  -Dorg.gradle.jvmargs="-Xmx6144m -XX:MaxMetaspaceSize=512m")

step "Verifying signatures"
apk=android/app/build/outputs/apk/release/app-release.apk
aab=android/app/build/outputs/bundle/release/app-release.aab
"$ANDROID_HOME/build-tools/37.0.0/apksigner" verify "$apk"
"$JAVA_HOME/bin/jarsigner" -verify "$aab" >/dev/null
mkdir -p "$OUT"
cp "$apk" "$aab" "$OUT/"
step "Done: $OUT/app-release.apk, $OUT/app-release.aab"
open "$OUT"
