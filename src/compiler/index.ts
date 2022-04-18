import fs from 'fs'
import { merge, reReference } from 'statesis'

import { parseFile } from './parser'

import {
  PortType,
  StringType,
} from '../fieldTypes'
import { compileConfig } from './config'
import { ConvertToSubscribableSchema, Schema } from './types'

const compile = <T extends Schema>(schema: T): ConvertToSubscribableSchema<T> => {
  const compiledConfig = compileConfig(schema)

  const configDirectory = process.env.CONFMON_PATH || './config'

  const getConfig = () => {
    const configFiles = fs.readdirSync(configDirectory)
    return configFiles.reduce((acc, file) => {
      const filePath = `${configDirectory}/${file}`

      return merge(acc, parseFile(filePath))
    }, {})
  }

  let current = getConfig()
  compiledConfig.applyValue(current)

  fs.watch(configDirectory, (_eventType, _filename) => {
    // console.log(eventType)
    // console.log(filename)

    const newConfig = reReference(current, getConfig())
    // console.log(newConfig)
    // console.log(newConfig === current)
    // console.log((newConfig as any).database === (current as any).database)

    current = newConfig

    compiledConfig.applyValue(current)
  })

  return compiledConfig as any
}

export default {
  compile,
  asString: () => new StringType(),
  asPort: () => new PortType(),
}
