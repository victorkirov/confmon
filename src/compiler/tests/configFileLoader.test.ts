import fs from 'fs'
import { getConfig } from '../configFileLoader'
import { parseFile } from '../parser'

jest.mock('fs')
jest.mock('../parser')

describe('getConfig', () => {
  const fileLoaders = { yaml: jest.fn() }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns an empty object when there are no config files', () => {
    jest.mocked(fs).readdirSync.mockReturnValueOnce([])
    const config = getConfig('/path/to/config', fileLoaders)
    expect(config).toEqual({})
  })

  it('reads and parses each config file in the directory in alphabetical order', () => {
    jest.mocked(fs).readdirSync.mockReturnValueOnce(['config3.yaml', 'config1.yaml', 'config2.yaml'] as any)
    jest
      .mocked(parseFile)
      .mockReturnValueOnce({ key1: 'value1' })
      .mockReturnValueOnce({ key2: 'value2' })
      .mockReturnValueOnce({ key3: 'value3' })
    const config = getConfig('/path/to/config', fileLoaders)
    expect(parseFile).toHaveBeenCalledWith('/path/to/config/config1.yaml', fileLoaders)
    expect(parseFile).toHaveBeenCalledWith('/path/to/config/config2.yaml', fileLoaders)
    expect(parseFile).toHaveBeenCalledWith('/path/to/config/config3.yaml', fileLoaders)
    expect(config).toEqual({ key1: 'value1', key2: 'value2', key3: 'value3' })
  })

  it('merges the parsed configs together', () => {
    jest.mocked(fs).readdirSync.mockReturnValueOnce(['config3.yaml', 'config1.yaml', 'config2.yaml'] as any)
    jest
      .mocked(parseFile)
      .mockReturnValueOnce({ key1: 'value1' })
      .mockReturnValueOnce({ key2: 'value2' })
      .mockReturnValueOnce({ key1: 'value1Priority', key3: 'value3' })
    const config = getConfig('/path/to/config', fileLoaders)
    expect(config).toEqual({ key1: 'value1Priority', key2: 'value2', key3: 'value3' })
  })
})
