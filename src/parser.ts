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
  // TODO
  return {
    [filename]: stringData,
  }
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
  val: parseVal,
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

  return parser(data, filename)
}
