#!/usr/bin/env bash
set -euo pipefail

# Paths
PBX_PATH="platforms/ios/App.xcodeproj/project.pbxproj"
APPDELEGATE_PATH="platforms/ios/App/AppDelegate.swift"
XC_CONFIG_DIR="platforms/ios/xcconfigs"
XC_CONFIG_PATH="${XC_CONFIG_DIR}/ci-overrides.xcconfig"
PODFILE_PATH="platforms/ios/Podfile"

# Helper for portable sed - macOS needs -i ''
if [[ "$(uname -s)" == "Darwin" ]]; then
  SED_CMD=(sed -i "")
  SED_EXT_ARG=(-E)
else
  SED_CMD=(sed -i)
  SED_EXT_ARG=(-r)
fi

echo "Patching iOS generated files..."

# 1) Bump IPHONEOS_DEPLOYMENT_TARGET to 13.0 (only if file exists)
if [[ -f "$PBX_PATH" ]]; then
  echo " - Updating deployment target in ${PBX_PATH}"
  # Use a regex that matches X.Y with 1-2 digits
  "${SED_CMD[@]}" "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9]\{1,2\}\.[0-9]\{1,2\} *;/IPHONEOS_DEPLOYMENT_TARGET = 13.0;/g" "$PBX_PATH" || true
else
  echo " - ${PBX_PATH} not found, skipping deployment target patch"
fi

# 2) Add @available(iOS 13.0, *) before extension AppDelegate { if not already present
if [[ -f "$APPDELEGATE_PATH" ]]; then
  if ! grep -q "@available(iOS 13.0" "$APPDELEGATE_PATH"; then
    echo " - Adding @available(iOS 13.0, *) to ${APPDELEGATE_PATH}"
    # Insert the attribute on the line before 'extension AppDelegate {'
    awk '
      BEGIN { added=0 }
      {
        if (!added && $0 ~ /^extension[[:space:]]+AppDelegate[[:space:]]*\{/ ) {
          print "@available(iOS 13.0, *)"
          added=1
        }
        print $0
      }
    ' "$APPDELEGATE_PATH" > "${APPDELEGATE_PATH}.patched" && mv "${APPDELEGATE_PATH}.patched" "$APPDELEGATE_PATH"
  else
    echo " - @available already present in ${APPDELEGATE_PATH}"
  fi
else
  echo " - ${APPDELEGATE_PATH} not found, skipping AppDelegate patch"
fi

# 3) Ensure Podfile platform is at least 13.0
if [[ -f "$PODFILE_PATH" ]]; then
  echo " - Ensuring Podfile platform is at least iOS 13.0"
  # Replace lines like: platform :ios, '11.0'  or platform :ios, "11.0"
  awk '
    BEGIN{OFS=FS}
    {
      if ($0 ~ /^\s*platform\s*:\s*ios\s*,/) {
        sub(/[:space:]*platform[[:space:]]*:[[:space:]]*ios[[:space:]]*,[[:space:]]*['"]?[0-9]+\.[0-9]+['"]?/, "platform :ios, '13.0'")
      }
      print
    }
  ' "$PODFILE_PATH" > "${PODFILE_PATH}.patched" && mv "${PODFILE_PATH}.patched" "$PODFILE_PATH" || true
else
  echo " - ${PODFILE_PATH} not found, skipping Podfile patch"
fi

# 4) Create an xcconfig to add GeneratedModuleMaps-iphonesimulator to header search paths
mkdir -p "$XC_CONFIG_DIR"
cat > "$XC_CONFIG_PATH" <<'XC'
HEADER_SEARCH_PATHS = $(inherited) $(DERIVED_FILE_DIR)/GeneratedModuleMaps-iphonesimulator
XC

echo " - Created ${XC_CONFIG_PATH}"

echo "Patching complete."