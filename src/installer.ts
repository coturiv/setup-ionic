import * as child from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as crypto from 'crypto'
import * as core from '@actions/core'
import * as cache from '@actions/cache'
import * as tc from '@actions/tool-cache'

/**
 * Install Cordova Cli
 *
 * https://www.npmjs.com/package/cordova
 *
 * @param version
 */
export const installCordova = async (version?: string): Promise<void> => {
  await installNpmPkg('cordova', version)
}

/**
 * Install Ionic Cli
 *
 * https://www.npmjs.com/package/@ionic/cli
 */
export const installIonic = async (version?: string): Promise<void> => {
  await installNpmPkg('@ionic/cli', version)
}

export const installCapacitor = async (version?: string): Promise<void> => {
  await installNpmPkg('@capacitor/cli', version)
}

/**
 * Install Java
 *
 */
export const installJava = async (version = '17'): Promise<void> => {
  if (process.platform === 'linux') {
    const pkg = `openjdk-${version}-jdk`
    await runCommand(`sudo apt-get update && sudo apt-get install -y ${pkg}`)
    await setJavaEnvPosix()
    return
  }

  if (process.platform === 'darwin') {
    await runCommand(`brew update && brew install openjdk@${version}`)
    try {
      const prefix = String(await runCommand(`brew --prefix`)).trim()
      const homeDir = path.join(prefix, `opt`, `openjdk@${version}`)
      const binDir = path.join(homeDir, `bin`)
      if (fs.existsSync(binDir)) {
        core.exportVariable('JAVA_HOME', homeDir)
        core.addPath(binDir)
      }
    } catch {
      void 0
    }
    return
  }

  if (process.platform === 'win32') {
    const major = parseInt(String(version), 10) || 17
    const pkg = `temurin${major}`
    try {
      await runCommand(`choco install -y ${pkg}`)
    } catch (e) {
      try {
        await runCommand(
          `powershell -NoProfile -ExecutionPolicy Bypass winget install --silent --id EclipseAdoptium.Temurin.${major}.JDK`
        )
      } catch (e2) {
        core.info('Failed to install Java via Chocolatey/Winget on Windows')
      }
    }
    await setJavaEnvWindows()
    return
  }
}

/**
 * Install CocoaPods
 *
 */
export const installPods = async (): Promise<void> => {
  if (process.platform === 'darwin') {
    await runCommand(`sudo gem install cocoapods`)
  }
}

/**
 * Logs installed information
 *
 */
export const logInstalledInfo = async (builder?: string): Promise<void> => {
  core.info('Cordova/Ionic environment has been setup successfully.')
  if (builder === 'capacitor') {
    core.info(`Capacitor: ${await runCommand('cap --version')}`)
  } else if (builder === 'cordova') {
    core.info(`Cordova: ${await runCommand('cordova -v')}`)
  }
}

/**
 * Install NPM Package
 *
 * @param pkg     : name of package
 * @param version : version
 */
export const installNpmPkg = async (
  pkg: string,
  version?: string
): Promise<void> => {
  const normalizedVersion = version?.trim()

  if (normalizedVersion) {
    const cachedDir = tc.find(pkg, normalizedVersion)
    if (cachedDir) {
      core.addPath(path.join(cachedDir, 'node_modules', '.bin'))
      return
    }
  }

  const tmpPrefix = fs.mkdtempSync(
    path.join(os.tmpdir(), `setup-ionic-${pkg}-`)
  )
  await runCommand(
    `npm install ${pkg}${
      normalizedVersion ? `@${normalizedVersion}` : ''
    } --prefix "${tmpPrefix}"`
  )

  const pkgJsonPath = path.join(tmpPrefix, 'node_modules', pkg, 'package.json')
  const installedVersion = fs.existsSync(pkgJsonPath)
    ? JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version
    : normalizedVersion || 'latest'

  const cachedDir = await tc.cacheDir(tmpPrefix, pkg, installedVersion)
  core.addPath(path.join(cachedDir, 'node_modules', '.bin'))
}

export const restoreCaches = async (): Promise<void> => {
  const platform = process.platform

  await restoreNodeModules()
  await restoreGradle()
  if (platform === 'darwin') {
    await restoreCocoaPods()
  }
  await restoreAndroidSdk()
}

export const saveCaches = async (): Promise<void> => {
  const platform = process.platform

  await saveNodeModules()
  await saveGradle()
  if (platform === 'darwin') {
    await saveCocoaPods()
  }
  await saveAndroidSdk()
}

const restoreNodeModules = async (): Promise<void> => {
  const lock = resolveLockfile()
  if (!lock) return
  const key = `nm-${process.platform}-${hashFile(lock)}`
  try {
    await cache.restoreCache(['node_modules'], key)
  } catch {
    void 0
  }
}

const saveNodeModules = async (): Promise<void> => {
  if (!fs.existsSync('node_modules')) return
  const lock = resolveLockfile()
  if (!lock) return
  const key = `nm-${process.platform}-${hashFile(lock)}`
  try {
    await cache.saveCache(['node_modules'], key)
  } catch {
    void 0
  }
}

const restoreGradle = async (): Promise<void> => {
  const home = os.homedir()
  const cachesDir = path.join(home, '.gradle', 'caches')
  const wrapperDir = path.join(home, '.gradle', 'wrapper')
  const key = `gradle-${process.platform}`
  const paths: string[] = []
  if (fs.existsSync(cachesDir)) paths.push(cachesDir)
  if (fs.existsSync(wrapperDir)) paths.push(wrapperDir)
  if (paths.length === 0) {
    paths.push(cachesDir, wrapperDir)
  }
  try {
    await cache.restoreCache(paths, key)
  } catch {
    void 0
  }
}

const saveGradle = async (): Promise<void> => {
  const home = os.homedir()
  const cachesDir = path.join(home, '.gradle', 'caches')
  const wrapperDir = path.join(home, '.gradle', 'wrapper')
  const paths: string[] = []
  if (fs.existsSync(cachesDir)) paths.push(cachesDir)
  if (fs.existsSync(wrapperDir)) paths.push(wrapperDir)
  if (paths.length === 0) return
  const key = `gradle-${process.platform}`
  try {
    await cache.saveCache(paths, key)
  } catch {
    void 0
  }
}

const restoreCocoaPods = async (): Promise<void> => {
  const home = os.homedir()
  const cachesDir = path.join(home, 'Library', 'Caches', 'CocoaPods')
  const trunkDir = path.join(home, '.cocoapods')
  const podsDir = path.join(process.cwd(), 'ios', 'Pods')
  const keyBase = 'pods'
  const lock = path.join(process.cwd(), 'ios', 'Podfile.lock')
  const key = fs.existsSync(lock)
    ? `${keyBase}-${process.platform}-${hashFile(lock)}`
    : `${keyBase}-${process.platform}`
  const paths: string[] = []
  paths.push(cachesDir, trunkDir)
  if (fs.existsSync(podsDir)) paths.push(podsDir)
  try {
    await cache.restoreCache(paths, key)
  } catch {
    void 0
  }
}

const saveCocoaPods = async (): Promise<void> => {
  const home = os.homedir()
  const cachesDir = path.join(home, 'Library', 'Caches', 'CocoaPods')
  const trunkDir = path.join(home, '.cocoapods')
  const podsDir = path.join(process.cwd(), 'ios', 'Pods')
  const lock = path.join(process.cwd(), 'ios', 'Podfile.lock')
  const keyBase = 'pods'
  const key = fs.existsSync(lock)
    ? `${keyBase}-${process.platform}-${hashFile(lock)}`
    : `${keyBase}-${process.platform}`
  const paths: string[] = []
  if (fs.existsSync(cachesDir)) paths.push(cachesDir)
  if (fs.existsSync(trunkDir)) paths.push(trunkDir)
  if (fs.existsSync(podsDir)) paths.push(podsDir)
  if (paths.length === 0) return
  try {
    await cache.saveCache(paths, key)
  } catch {
    void 0
  }
}

const restoreAndroidSdk = async (): Promise<void> => {
  const sdkRoot = getAndroidSdkRoot()
  if (!sdkRoot) return
  const key = `android-sdk-${process.platform}-${hashString(
    androidSdkSignature(sdkRoot)
  )}`
  try {
    await cache.restoreCache([sdkRoot], key)
  } catch {
    void 0
  }
}

const saveAndroidSdk = async (): Promise<void> => {
  const sdkRoot = getAndroidSdkRoot()
  if (!sdkRoot) return
  const key = `android-sdk-${process.platform}-${hashString(
    androidSdkSignature(sdkRoot)
  )}`
  try {
    await cache.saveCache([sdkRoot], key)
  } catch {
    void 0
  }
}

const resolveLockfile = (): string | undefined => {
  const cwd = process.cwd()
  const candidates = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
  for (const f of candidates) {
    const p = path.join(cwd, f)
    if (fs.existsSync(p)) return p
  }
  return undefined
}

const hashFile = (p: string): string => {
  const buf = fs.readFileSync(p)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

const hashString = (s: string): string => {
  return crypto.createHash('sha256').update(s).digest('hex')
}

const getAndroidSdkRoot = (): string | undefined => {
  const envRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME
  if (envRoot && fs.existsSync(envRoot)) return envRoot
  const home = os.homedir()
  const candidates = [
    path.join(home, 'Library', 'Android', 'sdk'),
    path.join(home, 'Android', 'Sdk'),
    '/usr/local/android-sdk',
    '/opt/android-sdk',
    path.join(home, 'AppData', 'Local', 'Android', 'Sdk'),
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
      : ''
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return undefined
}

const androidSdkSignature = (root: string): string => {
  const parts: string[] = []
  const dirs = ['platforms', 'build-tools']
  for (const d of dirs) {
    const p = path.join(root, d)
    if (fs.existsSync(p)) {
      try {
        const items = fs.readdirSync(p)
        parts.push(`${d}:${items.join(',')}`)
      } catch {
        void 0
      }
    }
  }
  return parts.join('|') || 'empty'
}

const runCommand = async (command: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    child.exec(command, (err: any, stdout: any, stderr: any) => {
      if (stderr) {
        resolve(stdout)
      }

      if (err) {
        core.setFailed(JSON.stringify(err))
        reject(err)
      }

      resolve(stdout)
    })
  })
}

const setJavaEnvPosix = async (): Promise<void> => {
  try {
    const which = String(await runCommand('which javac'))
      .trim()
      .split(/\r?\n/)[0]
    if (!which) return
    const binDir = path.dirname(which)
    const homeDir = path.dirname(binDir)
    core.exportVariable('JAVA_HOME', homeDir)
    core.addPath(binDir)
  } catch {
    void 0
  }
}

const setJavaEnvWindows = async (): Promise<void> => {
  try {
    const where = String(
      await runCommand(
        'powershell -NoProfile -ExecutionPolicy Bypass where.exe java'
      )
    )
      .trim()
      .split(/\r?\n/)[0]
    if (where) {
      const binDir = path.dirname(where)
      const homeDir = path.dirname(binDir)
      core.exportVariable('JAVA_HOME', homeDir)
      core.addPath(binDir)
      return
    }
  } catch {
    void 0
  }
  try {
    const base = 'C:/Program Files/Eclipse Adoptium'
    const items = fs.existsSync(base) ? fs.readdirSync(base) : []
    for (const it of items) {
      const homeDir = path.join(base, it)
      const binDir = path.join(homeDir, 'bin')
      const javaExe = path.join(binDir, 'java.exe')
      if (fs.existsSync(javaExe)) {
        core.exportVariable('JAVA_HOME', homeDir)
        core.addPath(binDir)
        return
      }
    }
  } catch {
    void 0
  }
}
