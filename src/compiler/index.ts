import fs from 'fs'
import { merge, reReference } from 'statesis'

import { parseFile } from './parser'

import { compileConfig } from './config'
import { ConvertToSubscribableSchema, Schema } from './types'

export const compile = <T extends Schema>(schema: T): ConvertToSubscribableSchema<T> => {
  const compiledConfig = compileConfig(schema)

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
