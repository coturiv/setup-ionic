import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

jest.mock(
  '@actions/cache',
  () => ({
    restoreCache: jest.fn(async () => void 0),
    saveCache: jest.fn(async () => 0)
  }),
  {virtual: true}
)

jest.mock(
  '@actions/core',
  () => ({
    addPath: jest.fn(() => void 0),
    exportVariable: jest.fn(() => void 0),
    info: jest.fn(() => void 0),
    setFailed: jest.fn(() => void 0)
  }),
  {virtual: true}
)

jest.mock(
  'child_process',
  () => ({
    exec: (cmd: string, cb: (err: any, stdout: any, stderr: any) => void) => {
      if (cmd.includes('which javac')) cb(null, '/usr/bin/javac\n', '')
      else if (cmd.includes('brew --prefix')) cb(null, '/opt/homebrew\n', '')
      else if (cmd.includes('where.exe java'))
        cb(null, 'C:/Program Files/Eclipse Adoptium/jdk-17/bin/java.exe\n', '')
      else cb(null, '', '')
    }
  }),
  {virtual: true}
)

jest.mock(
  '@actions/tool-cache',
  () => ({
    find: jest.fn(() => ''),
    cacheDir: jest.fn(async () => '/cached')
  }),
  {virtual: true}
)

import {
  installJava,
  installNpmPkg,
  restoreCaches,
  saveCaches
} from '../src/installer'

const core = require('@actions/core')
const cache = require('@actions/cache')

describe('installer', () => {
  const originalPlatform = process.platform
  afterEach(() => {
    Object.defineProperty(process, 'platform', {value: originalPlatform})
    jest.clearAllMocks()
  })

  test('installJava sets env on linux', async () => {
    Object.defineProperty(process, 'platform', {value: 'linux'})
    await installJava('17')
    expect(core.exportVariable).toHaveBeenCalledWith('JAVA_HOME', '/usr')
    expect(core.addPath).toHaveBeenCalledWith('/usr/bin')
  })

  test('installNpmPkg caches bin path', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-test-'))
    await installNpmPkg('@capacitor/cli', 'latest')
    const call = (core.addPath as any).mock.calls.find((c: any[]) => {
      const arg = String(c[0])
      return arg.includes('node_modules') && arg.includes('.bin')
    })
    expect(call).toBeTruthy()
    fs.rmdirSync(tmp, {recursive: true})
  })

  test('android sdk cache restore/save with env root', async () => {
    const sdkRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'android-sdk-'))
    fs.mkdirSync(path.join(sdkRoot, 'platforms'))
    fs.mkdirSync(path.join(sdkRoot, 'build-tools'))
    process.env.ANDROID_SDK_ROOT = sdkRoot
    await restoreCaches()
    await saveCaches()
    const restoreCall = (cache.restoreCache as any).mock.calls.find(
      (c: any[]) => Array.isArray(c[0]) && c[0][0] === sdkRoot
    )
    const saveCall = (cache.saveCache as any).mock.calls.find(
      (c: any[]) => Array.isArray(c[0]) && c[0][0] === sdkRoot
    )
    expect(restoreCall).toBeTruthy()
    expect(saveCall).toBeTruthy()
    fs.rmdirSync(sdkRoot, {recursive: true})
    delete process.env.ANDROID_SDK_ROOT
  })
})
