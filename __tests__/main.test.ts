jest.mock('../src/installer', () => ({
  installCordova: jest.fn(async () => void 0),
  installIonic: jest.fn(async () => void 0),
  installCapacitor: jest.fn(async () => void 0),
  installJava: jest.fn(async () => void 0),
  installPods: jest.fn(async () => void 0),
  logInstalledInfo: jest.fn(async () => void 0),
  restoreCaches: jest.fn(async () => void 0),
  saveCaches: jest.fn(async () => void 0)
}))

jest.mock('@actions/core', () => ({
  getInput: jest.fn((name: string) => {
    if (name === 'legacy') return 'false'
    if (name === 'capacitor-version') return 'latest'
    if (name === 'ionic-version') return 'latest'
    if (name === 'install-java') return 'true'
    if (name === 'java-version') return '17'
    if (name === 'install-pods') return 'false'
    return ''
  }),
  info: jest.fn(() => void 0),
  setFailed: jest.fn(() => void 0)
}))

test('runs main and calls installers', async () => {
  await import('../src/main')
  await new Promise(res => setTimeout(res, 0))
  const inst = await import('../src/installer')
  expect(inst.restoreCaches as any).toHaveBeenCalled()
  expect(inst.installCapacitor as any).toHaveBeenCalledWith('latest')
  expect(inst.installIonic as any).toHaveBeenCalledWith('latest')
  expect(inst.installJava as any).toHaveBeenCalledWith('17')
  expect(inst.installPods as any).not.toHaveBeenCalled()
  expect(inst.saveCaches as any).toHaveBeenCalled()
})
