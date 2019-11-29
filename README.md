## setup-ionic

[![](https://github.com/coturiv/setup-ionic/workflows/CI/badge.svg)](https://github.com/coturiv/setup-ionic/actions)

Set up your GitHub Actions workflow with Cordova/Ionic environment. Only supports macos & ubuntu at this time.

## example usage:

```
- name: Use coturiv/setup-ionic
  uses: coturiv/setup-ionic@v1.0.0
  with:
    cordova-version: 8

- name: Build
  run: |
    ionic cordova build android --prod

```