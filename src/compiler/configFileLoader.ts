import fs from 'fs'
import { merge } from 'statesis'

import { FileLoaders, parseFile } from './parser'

export const getConfig = (configDirectory: string, fileLoaders: FileLoaders) => {
  const configFiles = fs.readdirSync(configDirectory)
  configFiles.sort()

  return configFiles.reduce((acc, file) => {
    const filePath = `${configDirectory}/${file}`
    const parsedConfig = parseFile(filePath, fileLoaders)

    return merge(acc, parsedConfig)
  }, {})
}
