import fs from 'fs'
import { reReference } from 'statesis'

import { FileLoaders } from './parser'
import { getConfig } from './configFileLoader'

import { compileConfig } from './config'
import { ConvertToSubscribableSchema, NonReserved, Schema } from './types'

export type ConfMonOptions = {
  configDirectory?: string
  fileLoaders?: FileLoaders
}

export const compile = <T extends Schema>(
  schema: NonReserved<T>,
  options?: ConfMonOptions,
): ConvertToSubscribableSchema<T> => {
  const compiledConfig = compileConfig(schema)

  const configDirectory = options?.configDirectory ?? './config'
  const fileLoaders = { ...options?.fileLoaders }

  let current = getConfig(configDirectory, fileLoaders)
  compiledConfig.__applyValue(current)

  fs.watch(configDirectory, (_eventType, _filename) => {
    const newConfig = reReference(current, getConfig(configDirectory, fileLoaders))

    if (newConfig === current) return

    current = newConfig

    compiledConfig.__applyValue(current)
  })

  return compiledConfig as any
}
