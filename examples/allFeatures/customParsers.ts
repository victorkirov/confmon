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

const parseJson5 = (stringData: string): Record<string, unknown> => (json5.parse(stringData))

const parseToml = (stringData: string): Record<string, unknown> => (toml.parse(stringData))

const parseXml = (stringData: string): Record<string, unknown> => {
  const parser = new X2js()
  return parser.xml2js(stringData)
}

const parseYaml = (stringData: string): Record<string, unknown> => (yaml.parse(stringData))

const customParsers: Record<string, (stringData: string) => Record<string, unknown>> = {
  cson: parseCson,
  hjson: parseHJson,
  ini: parseIni,
  json5: parseJson5,
  toml: parseToml,
  xml: parseXml,
  yaml: parseYaml,
}

export { customParsers }
