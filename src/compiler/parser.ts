import fs from 'fs'
import path from 'path'

import cson from 'cson'
import hJson from 'hjson'
import ini from 'ini'
import json5 from 'json5'
import toml from 'toml'
import X2js from 'x2js'
import yaml from 'yaml'

const parseCson = (stringData: string): Record<string, unknown> => (cson.parse(stringData))

const parseHJson = (stringData: string): Record<string, unknown> => (hJson.parse(stringData))

const parseIni = (stringData: string): Record<string, unknown> => (
  ini.parse(stringData)
)

const parseJson = (stringData: string): Record<string, unknown> => (JSON.parse(stringData))

const parseJson5 = (stringData: string): Record<string, unknown> => (json5.parse(stringData))

const parseToml = (stringData: string): Record<string, unknown> => (toml.parse(stringData))

const parseXml = (stringData: string): Record<string, unknown> => {
  const parser = new X2js()
  return parser.xml2js(stringData)
}

const parseYaml = (stringData: string): Record<string, unknown> => (yaml.parse(stringData))

const parseVal = (stringData: string, filename: string): Record<string, unknown> => {
  const breadcrumbs = filename.split('|')
  const fieldName = breadcrumbs.pop()

  if (!fieldName) {
    throw new Error(`Invalid filename for .confval extension: ${filename}`)
  }

  const parsedConfig = {} as Record<string, unknown>
  let current = parsedConfig

  for (const breadcrumb of breadcrumbs) {
    if (!(breadcrumb in current)) {
      current[breadcrumb] = {}
    }
    current = current[breadcrumb]  as Record<string, unknown>
  }

  current[fieldName] = stringData

  return parsedConfig
}

const extensionToParserMapping: Record<string, (stringData: string, filename: string) => Record<string, unknown>> = {
  cson: parseCson,
  hjson: parseHJson,
  ini: parseIni,
  json: parseJson,
  json5: parseJson5,
  toml: parseToml,
  xml: parseXml,
  yaml: parseYaml,
  confval: parseVal,
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
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
        if (process.env[envKey]) {
          envConfig[key] = process.env[envKey] as any
        }
      } else {
        envConfig[key] = value
      }
    } else {
      envConfig[key] = value
    }
  }

  return envConfig
}

export const parseFile = (filePath: string): Record<string, unknown> => {
  const filename = path.basename(filePath, path.extname(filePath))
  const extension = path.extname(filePath).substring(1)

  if (!extension) {
    throw new Error(`Could not determine extension of file ${filePath}`)
  }

  const parser = extensionToParserMapping[extension]

  if (!parser) {
    throw new Error(`No parser for extension ${extension}`)
  }

  const data = fs.readFileSync(filePath, 'utf-8')

  const parsedData =  parser(data, filename)

  if (filename.endsWith('.env')) {
    return processEnv(parsedData)
  }

  return parsedData
}
