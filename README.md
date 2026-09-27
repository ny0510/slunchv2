## NYL, aka 선린급식

### Android release build (macOS)

Double-click `scripts/build-android-release.command`, or run it from a terminal. It checks every tool, file and variable below and lists all problems before building anything. When all checks pass, it builds and verifies a signed APK and AAB into `build/release/`.

Local files (all gitignored, same values as the GitHub Actions secrets):

| File | Source secret |
|---|---|
| `.env` | `API_BASE_URL` + 10 `*_AD_UNIT_ID` values |
| `google-services.json` | `GOOGLE_SERVICES_JSON` (base64-decoded) |
| `sentry.properties` (optional) | Sentry auth; without it uploads are skipped |
| `.release.env` | signing values, below |

`.release.env`:

```sh
RN_UPLOAD_STORE_FILE=/absolute/path/to/release.keystore   # KEYSTORE_BASE64, decoded
RN_UPLOAD_STORE_PASSWORD=...
RN_UPLOAD_KEY_ALIAS=...
RN_UPLOAD_KEY_PASSWORD=...
```

Toolchain: Node 22, Bun, JDK 17, Android SDK with `platforms;android-37.0`, `build-tools;37.0.0`, `ndk;29.0.13113456` and accepted licenses.
