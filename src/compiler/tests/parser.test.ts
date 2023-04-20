import fs from 'fs'

import { parseFile } from '../parser'

describe('parseFile', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('throws for files with no extensions', () => {
    const filePath = '/tmp/parserConfig'

    expect(() => parseFile(filePath, {})).toThrowError('Could not determine extension of file /tmp/parserConfig')
  })

  it('parses a JSON file', () => {
    const filePath = '/tmp/parserConfig.json'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => '{"fieldName": 1}')

    const result = parseFile(filePath, {})

    expect(result).toEqual({ fieldName: 1 })
    expect(fsSpy).toBeCalledWith(filePath, 'utf-8')
  })

  it('parses a .confval file', () => {
    const filePath = '/tmp/fieldName.confval'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => 'a string value')

    const result = parseFile(filePath, {})

    expect(result).toEqual({ fieldName: 'a string value' })
    expect(fsSpy).toBeCalledWith(filePath, 'utf-8')
  })

  it('parses an object .confval file', () => {
    const filePath = '/tmp/parent|child|fieldName.confval'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => 'a string value')

    const result = parseFile(filePath, {})

    expect(result).toEqual({ parent: { child: { fieldName: 'a string value' } } })
    expect(fsSpy).toBeCalledWith(filePath, 'utf-8')
  })

  it('object .confval file without field name throws error', () => {
    const filePath = '/tmp/parent|child|.confval'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => 'a string value')

    expect(() => parseFile(filePath, {})).toThrowError('Invalid filename for .confval extension: parent|child|')
    expect(fsSpy).toBeCalledWith(filePath, 'utf-8')
  })

  it('object .confval file with invalid name throws error', () => {
    const filePath = '/tmp/parent||fieldName.confval'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => 'a string value')

    expect(() => parseFile(filePath, {})).toThrowError('Invalid filename for .confval extension: parent||fieldName')
    expect(fsSpy).toBeCalledWith(filePath, 'utf-8')
  })

  it('processes .env files', () => {
    const filePath = '/tmp/parserConfig.env.json'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(
      () =>
        '{"fieldName": "${TEST_ENV_VAR}", "nonEnvField": "Bob", "nonStringField": 5, "child": { "innerFieldName": "${INNER_TEST_ENV_VAR}"} }',
    )

    const emptyResult = parseFile(filePath, {})

    expect(emptyResult).toEqual({
      fieldName: undefined,
      nonEnvField: 'Bob',
      nonStringField: 5,
      child: { innerFieldName: undefined },
    })

    process.env.TEST_ENV_VAR = 'a string value'
    process.env.INNER_TEST_ENV_VAR = 'another string value'

    const result = parseFile(filePath, {})

    expect(result).toEqual({
      fieldName: 'a string value',
      nonEnvField: 'Bob',
      nonStringField: 5,
      child: { innerFieldName: 'another string value' },
    })
  })

  it('throws an error if the extension is unknown', () => {
    expect(() => parseFile('/tmp/parserConfig.unknown', {})).toThrowError('No parser for extension unknown')
  })

  it('allows for custom parsers', () => {
    const filePathStr = '/tmp/parserConfig.customString'
    const fsSpy = jest.spyOn(fs, 'readFileSync')
    fsSpy.mockImplementation(() => 'a string value')

    const fileLoaders = {
      customString: (stringData: string) => ({ stringVal: stringData }),
      customNumber: (stringData: string) => ({ numberVal: +stringData }),
    }

    const resultStr = parseFile(filePathStr, fileLoaders)

    expect(resultStr).toEqual({ stringVal: 'a string value' })

    const filePathNum = '/tmp/parserConfig.customNumber'
    fsSpy.mockImplementation(() => '5')

    const result = parseFile(filePathNum, fileLoaders)

    expect(result).toEqual({ numberVal: 5 })
  })

  it('custom parsers with same name but different case, throws duplicate error', () => {
    const fileLoaders = {
      customLoader: (stringData: string) => ({
        str: stringData,
      }),
      CustomLoader: (stringData: string) => ({
        str: stringData,
      }),
    }

    expect(() => parseFile('/tmp/dummy.dummy', fileLoaders)).toThrowError(
      'Duplicate file loader specified for extension customloader',
    )
  })
})
