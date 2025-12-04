#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/patch-ios.sh [target-dir ...]

if [[ $# -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=("platforms/ios")
fi

# Helper for portable sed - macOS needs -i ''
if [[ "$(uname -s)" == "Darwin" ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

echo "Patching iOS generated files for targets: ${TARGETS[*]}"

for BASE in "${TARGETS[@]}"; do
  echo "Processing target: ${BASE}"
  PBX_PATH="${BASE}/App.xcodeproj/project.pbxproj"
  APPDELEGATE_PATH="${BASE}/App/AppDelegate.swift"
  XC_CONFIG_DIR="${BASE}/xcconfigs"
  XC_CONFIG_PATH="${XC_CONFIG_DIR}/ci-overrides.xcconfig"
  PODFILE_PATH="${BASE}/Podfile"

  # 1) Bump IPHONEOS_DEPLOYMENT_TARGET to 13.0 (only if file exists)
  if [[ -f "$PBX_PATH" ]]; then
    echo " - Updating deployment target in ${PBX_PATH}"
    "${SED_INPLACE[@]}" "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9]\{1,2\}\.[0-9]\{1,2\} *;/IPHONEOS_DEPLOYMENT_TARGET = 13.0;/g" "$PBX_PATH" || true

    # Do not modify pbxproj with sdk-conditional settings; use xcconfig below instead
  else
    echo " - ${PBX_PATH} not found, skipping deployment target patch"
  fi

  # 2) Add @available(iOS 13.0, *) before extension AppDelegate { if not already present
  if [[ -f "$APPDELEGATE_PATH" ]]; then
    if ! grep -q "@available(iOS 13.0" "$APPDELEGATE_PATH"; then
      echo " - Adding @available(iOS 13.0, *) to ${APPDELEGATE_PATH}"
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
    if grep -q "^\s*platform\s*:\s*.*ios" "$PODFILE_PATH"; then
      awk '
        {
          if ($0 ~ /^\s*platform\s*:\s*.*ios/) {
            print "platform :ios, '\''13.0'\''"
          } else {
            print
          }
        }
      ' "$PODFILE_PATH" > "${PODFILE_PATH}.patched" && mv "${PODFILE_PATH}.patched" "$PODFILE_PATH" || true
    else
      # Prepend platform line if missing
      {
        echo "platform :ios, '13.0'"
        cat "$PODFILE_PATH"
      } > "${PODFILE_PATH}.patched" && mv "${PODFILE_PATH}.patched" "$PODFILE_PATH"
    fi

    # Ensure pods build with at least iOS 13.0 (add post_install if missing)
    if ! grep -q "post_install" "$PODFILE_PATH"; then
      cat >> "$PODFILE_PATH" <<'PODPATCH'
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
PODPATCH
    fi

    echo " - Running CocoaPods install with repo update"
    (
      cd "$BASE"
      pod install --repo-update --silent || pod install --repo-update || true
    )
  else
    echo " - ${PODFILE_PATH} not found, skipping Podfile patch"
  fi

  # 4) Create an xcconfig to add GeneratedModuleMaps-iphonesimulator to header search paths
  mkdir -p "$XC_CONFIG_DIR"
  cat > "$XC_CONFIG_PATH" <<'XC'
HEADER_SEARCH_PATHS = $(inherited) $(DERIVED_FILE_DIR)/GeneratedModuleMaps-iphonesimulator
EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64
ONLY_ACTIVE_ARCH = YES
XC
  echo " - Created ${XC_CONFIG_PATH}"

done

echo "Patching complete."
