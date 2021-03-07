## setup-ionic

[![](https://github.com/coturiv/setup-ionic/workflows/CI/badge.svg)](https://github.com/coturiv/setup-ionic/actions)

Set up your GitHub Actions workflow with Cordova/Ionic environment. Only supports macos & ubuntu at this time.

## example usage:

```
- name: Use coturiv/setup-ionic
  uses: coturiv/setup-ionic@v1
  with:
    java-version: 8
- name: Use coturiv/setup-ionic
  uses: coturiv/setup-ionic@v1
  with:
    cordova-version: 8

- name: Build
  run: |
    ionic cordova build android --prod

```

### important*

_From Ubuntu 20.04 runners, the default version of Java is 11, so you need to specify it to 8(1.8), due to the requirement of cordova, but will be removed in future releases. See [here](), and [here](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#java-development-kit-jdk)_

```
- name: Set up JDK 1.8
  uses: actions/setup-java@v1
  with:
    java-version: 1.8
```