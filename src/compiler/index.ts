import fs from 'fs'
import { merge, reReference } from 'statesis'

import { parseFile } from './parser'

import { compileConfig } from './config'
import { ConvertToSubscribableSchema, NonReserved, Schema } from './types'

export const compile = <T extends Schema>(schema: NonReserved<T>): ConvertToSubscribableSchema<T> => {
  const compiledConfig = compileConfig(schema)

  // TODO: extract to file-load-manager and ensure files processed alphabetically
  const configDirectory = process.env.CONFMON_PATH || './config'

  const getConfig = () => {
    const configFiles = fs.readdirSync(configDirectory)
    return configFiles.reduce((acc, file) => {
      const filePath = `${configDirectory}/${file}`
      const parsedConfig = parseFile(filePath)

      return merge(acc, parsedConfig)
    }, {})
  }

  let current = getConfig()
  compiledConfig.__applyValue(current)

  fs.watch(configDirectory, (_eventType, _filename) => {
    const newConfig = reReference(current, getConfig())
    current = newConfig

    compiledConfig.__applyValue(current)
  })

  return compiledConfig as any
}
