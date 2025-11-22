#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-testapp}"
GRADLE_FILE="$APP_DIR/android/build.gradle"

if [[ ! -f "$GRADLE_FILE" ]]; then
  echo "Gradle file not found: $GRADLE_FILE" >&2
  exit 1
fi

SNIPPET='
subprojects { subproject ->
    afterEvaluate {
        if (subproject.plugins.hasPlugin("com.android.library") || subproject.plugins.hasPlugin("com.android.application")) {
            subproject.android.compileOptions {
                sourceCompatibility JavaVersion.VERSION_17
                targetCompatibility JavaVersion.VERSION_17
            }
        }
    }
}
'

printf "%s\n" "$SNIPPET" >> "$GRADLE_FILE"

(
  cd "$APP_DIR/android"
  ./gradlew assembleDebug
)