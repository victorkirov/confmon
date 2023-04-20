import fs, { FSWatcher, WatchListener } from 'fs'

import confmon from '../index'

const createTestSchema = () => {
  const structuredSchema = {
    fieldNum: confmon.asNumber(),
    fieldString: confmon.asString(),
  }

  const schema = {
    parent: {
      child: {
        fieldNumDefault: confmon.asNumber().default(1),
        fieldNum: confmon.asNumber(),
        fieldStr: confmon.asString(),
        fieldPort: confmon.asPort(),
        fieldEnum: confmon.asEnum(['a', 'b', 'c'] as const),
        fieldUnstructured: confmon.asUnstructuredObject(),
        fieldStructured: confmon.asStruct(structuredSchema),
        field: confmon.asList(confmon.asNumber()),
      },
    },
  }

  return schema
}

const createTestValues = () => ({
  parent: {
    child: {
      fieldNumDefault: 2,
      fieldNum: 1,
      fieldStr: 'string',
      fieldPort: 8080,
      fieldEnum: 'a',
      fieldUnstructured: { a: 1 },
      fieldStructured: { fieldNum: 1, fieldString: '1' },
      field: [1, 2, 3],
    },
  },
})

describe('parseFile', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns defaults if no files in config dir', async () => {
    jest.useFakeTimers()

    jest.spyOn(fs, 'watch').mockImplementation(() => jest.fn() as unknown as FSWatcher)

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => [])

    const schema = createTestSchema()

    const config = confmon.compile(schema, { configDirectory: '/tmp' })

    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
    expect(await config.parent.child.fieldNumDefault).toBe(1)
  })

  it('throws if required field not set', async () => {
    jest.useFakeTimers()

    jest.spyOn(fs, 'watch').mockImplementation(() => jest.fn() as unknown as FSWatcher)

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => [])

    const schema = {
      ...createTestSchema(),
      requiredField: confmon.asNumber().required(),
    }

    expect(() => confmon.compile(schema, { configDirectory: '/tmp' })).toThrowError(
      'Key "requiredField" missing in config object {}',
    )
    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
  })

  it('throws if required field on required struct not set', async () => {
    jest.useFakeTimers()

    jest.spyOn(fs, 'watch').mockImplementation(() => jest.fn() as unknown as FSWatcher)

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => [])

    const schema = {
      ...createTestSchema(),
      requiredField: confmon.asStruct({ inner: confmon.asNumber().required() }).required(),
    }

    expect(() => confmon.compile(schema, { configDirectory: '/tmp' })).toThrowError(
      'Key "requiredField" missing in config object {}',
    )
    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
  })

  it('does not throw if required field on non-required struct not set', async () => {
    jest.useFakeTimers()

    jest.spyOn(fs, 'watch').mockImplementation(() => jest.fn() as unknown as FSWatcher)

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => [])

    const schema = {
      ...createTestSchema(),
      requiredField: confmon.asStruct({ inner: confmon.asNumber().required() }),
    }

    expect(() => confmon.compile(schema, { configDirectory: '/tmp' })).not.toThrow()
    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
  })

  it('parses a JSON file', async () => {
    jest.useFakeTimers()

    jest.spyOn(fs, 'watch').mockImplementation(() => jest.fn() as unknown as FSWatcher)

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => ['config.json'] as any)

    const testValue = createTestValues()
    const fsFileSpy = jest.spyOn(fs, 'readFileSync')
    fsFileSpy.mockImplementation(() => JSON.stringify(testValue))

    const schema = createTestSchema()

    const config = confmon.compile(schema, { configDirectory: '/tmp' })

    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
    expect(fsFileSpy).toHaveBeenCalledWith('/tmp/config.json', 'utf-8')
    expect(await config).toEqual(testValue)
  })

  it('picks up changes on a JSON file', async () => {
    jest.useFakeTimers()

    let triggerFileWatcher: WatchListener<string> | undefined = undefined

    jest.spyOn(fs, 'watch').mockImplementation((_dir, handler) => {
      triggerFileWatcher = handler
      return jest.fn() as unknown as FSWatcher
    })

    const fsDirSpy = jest.spyOn(fs, 'readdirSync')
    fsDirSpy.mockImplementation(() => ['config.json'] as any)

    const testValue = createTestValues()
    const fsFileSpy = jest.spyOn(fs, 'readFileSync')
    fsFileSpy.mockReturnValueOnce(JSON.stringify(testValue))

    const schema = createTestSchema()

    // generate config with initial values
    const config = confmon.compile(schema, { configDirectory: '/tmp' })

    const parentListener = jest.fn()
    const childListener = jest.fn()
    const unchangingFieldListener = jest.fn()
    const fieldListener = jest.fn()
    const structFieldListener = jest.fn()

    config.parent.confListen(parentListener)
    config.parent.child.confListen(childListener)
    config.parent.child.fieldPort.confListen(unchangingFieldListener)
    config.parent.child.fieldNum.confListen(fieldListener)
    config.parent.child.fieldStructured.confListen(structFieldListener)

    expect(fsDirSpy).toHaveBeenCalledWith('/tmp')
    expect(fsFileSpy).toHaveBeenCalledWith('/tmp/config.json', 'utf-8')
    expect(await config).toEqual(testValue)

    expect(parentListener).not.toHaveBeenCalled()
    expect(childListener).not.toHaveBeenCalled()
    expect(unchangingFieldListener).not.toHaveBeenCalled()
    expect(fieldListener).not.toHaveBeenCalled()
    expect(structFieldListener).not.toHaveBeenCalled()

    // simulate file change with same values in file
    // config values should remain the same and no change events should be emitted
    const testValueSame = createTestValues()
    fsFileSpy.mockReset()
    fsFileSpy.mockReturnValueOnce(JSON.stringify(testValueSame))

    triggerFileWatcher!('change', '/tmp/config.json')

    expect(fsFileSpy).toHaveBeenCalledWith('/tmp/config.json', 'utf-8')
    expect(await config).toEqual(testValue)

    expect(parentListener).not.toHaveBeenCalled()
    expect(childListener).not.toHaveBeenCalled()
    expect(unchangingFieldListener).not.toHaveBeenCalled()
    expect(fieldListener).not.toHaveBeenCalled()
    expect(structFieldListener).not.toHaveBeenCalled()

    // simulate file change with different values in file
    // updated values should be returned and events emitted
    const testValueUpdates = createTestValues()
    testValueUpdates.parent.child.fieldNum = 2
    testValueUpdates.parent.child.fieldStr = '2'
    testValueUpdates.parent.child.fieldEnum = 'b'
    fsFileSpy.mockReset()
    fsFileSpy.mockReturnValueOnce(JSON.stringify(testValueUpdates))

    triggerFileWatcher!('change', '/tmp/config.json')

    expect(fsFileSpy).toHaveBeenCalledWith('/tmp/config.json', 'utf-8')
    expect(await config).toEqual(testValueUpdates)

    expect(parentListener).toHaveBeenCalledTimes(1)
    expect(childListener).toHaveBeenCalledTimes(1)
    expect(unchangingFieldListener).not.toHaveBeenCalled()
    expect(fieldListener).toHaveBeenCalledTimes(1)
    expect(structFieldListener).not.toHaveBeenCalled()

    parentListener.mockReset()
    childListener.mockReset()
    fieldListener.mockReset()

    // simulate file change with different values in file for inner struct
    // updated values should be returned and events emitted
    const testValueUpdatesStruct = createTestValues()
    testValueUpdatesStruct.parent.child.fieldNum = 2
    testValueUpdatesStruct.parent.child.fieldStructured.fieldNum = 2
    testValueUpdatesStruct.parent.child.fieldStructured.fieldString = '2'
    fsFileSpy.mockReset()
    fsFileSpy.mockReturnValueOnce(JSON.stringify(testValueUpdatesStruct))

    triggerFileWatcher!('change', '/tmp/config.json')

    expect(fsFileSpy).toHaveBeenCalledWith('/tmp/config.json', 'utf-8')
    expect(await config).toEqual(testValueUpdatesStruct)

    expect(parentListener).toHaveBeenCalledTimes(1)
    expect(childListener).toHaveBeenCalledTimes(1)
    expect(unchangingFieldListener).not.toHaveBeenCalled()
    expect(fieldListener).not.toHaveBeenCalled()
    expect(structFieldListener).toHaveBeenCalledTimes(1)
  })
})
