## setup-ionic

[![](https://github.com/coturiv/setup-ionic/workflows/CI/badge.svg)](https://github.com/coturiv/setup-ionic/actions)

Set up your GitHub Actions workflow with Capacitor or Cordova environment. Supports macOS, Ubuntu, and Windows.

## example usage

```
# Capacitor (default)
- name: Setup environment
  uses: coturiv/setup-ionic@v2
  with:
    legacy: false
    capacitor-version: latest
    java-version: 17

- name: Build Android
  run: |
    npx cap sync android
    cd android
    ./gradlew assembleDebug

- name: Build iOS (macOS only)
  run: |
    npx cap sync ios
    xcodebuild -workspace ios/App/App.xcworkspace -scheme App -sdk iphonesimulator -configuration Debug build

# Cordova (legacy)
- name: Setup environment
  uses: coturiv/setup-ionic@v2
  with:
    legacy: true
    cordova-version: 10
    java-version: 17

- name: Build Android
  run: |
    ionic cordova build android --prod
```

### caching

- Automatically restores/saves caches for:
  - `node_modules` keyed by lockfile
  - Gradle caches and wrapper
  - CocoaPods caches (macOS) and `ios/Pods`
  - Android SDK directory keyed by installed platforms/build-tools
