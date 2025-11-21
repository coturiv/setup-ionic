import * as core from '@actions/core'
import {
  installCordova,
  installIonic,
  installCapacitor,
  installJava,
  installPods,
  logInstalledInfo,
  restoreCaches,
  saveCaches
} from './installer'

async function run(): Promise<void> {
  try {
    await restoreCaches()

    const legacyInput = core.getInput('legacy')
    const legacy = legacyInput && legacyInput.toLowerCase() === 'true'
    const builder = legacy ? 'cordova' : 'capacitor'
    if (!legacy) {
      const capVersion = core.getInput('capacitor-version') || 'latest'
      await installCapacitor(capVersion)
    } else {
      const cordovaVersion = core.getInput('cordova-version')
      if (cordovaVersion) {
        await installCordova(cordovaVersion)
      } else {
        await installCordova()
      }
    }

    const ionicVersion = core.getInput('ionic-version') || 'latest'
    await installIonic(ionicVersion)

    // install java if requested (Linux/macOS only)
    const installJavaFlag = core.getInput('install-java')
    if (!installJavaFlag || installJavaFlag.toLowerCase() === 'true') {
      const javaVersion = core.getInput('java-version') || '17'
      await installJava(javaVersion)
    }

    // install cocoapods if requested
    const installPodsFlag = core.getInput('install-pods')
    if (!installPodsFlag || installPodsFlag.toLowerCase() === 'true') {
      await installPods()
    }

    await logInstalledInfo(builder)

    await saveCaches()
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    core.setFailed(msg)
  }
}

run()
