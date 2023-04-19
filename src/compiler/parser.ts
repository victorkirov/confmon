import fs from 'fs'
import path from 'path'

export type FileLoaders = {
  [fileExtension: string]: (data: string, fileName?: string) => Record<string, unknown>
}

const parseJson = (stringData: string): Record<string, unknown> => JSON.parse(stringData)

const parseVal = (stringData: string, filename: string): Record<string, unknown> => {
  const breadcrumbs = filename.split('|')
  const fieldName = breadcrumbs.pop()

  if (!fieldName) {
    throw new Error(`Invalid filename for .confval extension: ${filename}`)
  }

  const parsedConfig = {} as Record<string, unknown>
  let current = parsedConfig

  for (const breadcrumb of breadcrumbs) {
    if (!breadcrumb) {
      throw new Error(`Invalid filename for .confval extension: ${filename}`)
    }

    if (!(breadcrumb in current)) {
      current[breadcrumb] = {}
    }
    current = current[breadcrumb] as Record<string, unknown>
  }

  current[fieldName] = stringData

  return parsedConfig
}

const extensionToParserMapping: Record<string, (stringData: string, filename: string) => Record<string, unknown>> = {
  json: parseJson,
  confval: parseVal,
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const processEnv = <T extends Record<string, unknown>>(config: T): T => {
  const envConfig = {} as T

  for (const key of Object.keys(config) as (keyof T)[]) {
    const value = config[key]
    if (isObject(value)) {
      envConfig[key] = processEnv(value)
    } else if (typeof value === 'string') {
      const match = value.match(/^\$\{(.*)\}$/)
      if (match && match[1]) {
        const envKey = match[1]
        envConfig[key] = process.env[envKey] as any
      } else {
        envConfig[key] = value
      }
    } else {
      envConfig[key] = value
    }
  }

  return envConfig
}

/**
 * Ensures that the file loaders are case-insensitive and that the default loaders are always present
 */
const fileLoaderCache = new WeakMap<FileLoaders, FileLoaders>()
const compileFileLoaders = (fileLoaders: FileLoaders): FileLoaders => {
  if (fileLoaderCache.has(fileLoaders)) {
    return fileLoaderCache.get(fileLoaders) as FileLoaders
  }

  const lowerCaseFileLoaders: FileLoaders = {}

  for (const [extension, parser] of Object.entries(fileLoaders)) {
    const extensionLower = extension.toLowerCase()

    if (extensionLower in lowerCaseFileLoaders) {
      throw new Error(`Duplicate file loader specified for extension ${extensionLower}`)
    }

    lowerCaseFileLoaders[extensionLower] = parser
  }

  const compiledFileLoaders = { ...extensionToParserMapping, ...lowerCaseFileLoaders } as FileLoaders

  fileLoaderCache.set(fileLoaders, compiledFileLoaders)

  return compiledFileLoaders
}

export const parseFile = (filePath: string, fileLoaders: FileLoaders): Record<string, unknown> => {
  const filename = path.basename(filePath, path.extname(filePath))
  const extension = path.extname(filePath).substring(1).toLowerCase()

  if (!extension) {
    throw new Error(`Could not determine extension of file ${filePath}`)
  }

  const combinedFileLoaders = compileFileLoaders(fileLoaders)

  const parser = combinedFileLoaders[extension]

  if (!parser) {
    throw new Error(`No parser for extension ${extension}`)
  }

  const data = fs.readFileSync(filePath, 'utf-8')

  const parsedData = parser(data, filename)

  if (filename.toLowerCase().endsWith('.env')) {
    return processEnv(parsedData)
  }

  return parsedData
}
