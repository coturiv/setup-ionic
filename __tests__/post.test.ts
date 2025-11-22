jest.mock('../src/installer', () => ({
  saveCaches: jest.fn(async () => void 0)
}))

jest.mock('@actions/core', () => ({
  info: jest.fn(() => void 0)
}))

test('runs post and calls saveCaches', async () => {
  await import('../src/post')
  await new Promise(res => setTimeout(res, 0))
  const inst = await import('../src/installer')
  expect(inst.saveCaches as any).toHaveBeenCalled()
})

test('logs error when saveCaches throws', async () => {
  jest.resetModules()
  const inst = await import('../src/installer')
  ;(inst.saveCaches as any).mockImplementationOnce(async () => {
    throw new Error('boom')
  })
  const core = await import('@actions/core')
  await import('../src/post')
  await new Promise(res => setTimeout(res, 0))
  expect(core.info as any).toHaveBeenCalledWith('boom')
})
