import cson from 'cson'
import hJson from 'hjson'
import ini from 'ini'
import json5 from 'json5'
import toml from 'toml'
import X2js from 'x2js'
import yaml from 'yaml'

const parseXml = (stringData: string): Record<string, unknown> => {
  const parser = new X2js()
  return parser.xml2js(stringData)
}

const customParsers: Record<string, (stringData: string) => Record<string, unknown>> = {
  cson: cson.parse,
  hjson: hJson.parse,
  ini: ini.parse,
  json5: json5.parse,
  toml: toml.parse,
  xml: parseXml,
  yaml: yaml.parse,
}

export { customParsers }
