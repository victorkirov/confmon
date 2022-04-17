import fs from 'fs'
import { merge, reReference } from 'statesis'

import { parseFile } from './parser'
import cf from './compiler'

const configDirectory = process.env.CONFMON_PATH || './config'

const getConfig = () => {
  const configFiles = fs.readdirSync(configDirectory)
  return configFiles.reduce((acc, file) => {
    const filePath = `${configDirectory}/${file}`

    return merge(acc, parseFile(filePath))
  }, {})
}

let current = getConfig()
console.log(current)

fs.watch(configDirectory, (eventType, filename) => {
  console.log(eventType)
  console.log(filename)

  const newConfig = reReference(current, getConfig())
  console.log(newConfig)
  console.log(newConfig === current)
  console.log((newConfig as any).database === (current as any).database)

  current = newConfig
})

const configSchema = {
  server: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000),
  },
  temp: cf.asString(),
  // baseUrl: 'I Should Fail',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const myConfig = cf.compile(configSchema)

console.log(myConfig)
/*
// How to get from API or custom func?
const configSchema = {
  server: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000),
  },
  baseURL: cf.asString(),
  logging: {
    level: cf.asEnum('INFO', 'DEBUG', 'WARN', 'ERROR').default('INFO'),
  },
  hostType: cf.asString(),
  jwt: {
    secret: cf.asString(),
  },
  apiEndpoint: cf.asString((val) => val.startsWith('https://')),
  database: {
    host: cf.asString(),
    port: cf.asPort(),
    version: cf.asNumber(),
    client: cf.asEnum('mysql', 'postgres', 'sqlite3'),
    connection: {
      user: cf.asString(),
      password: cf.asString(),
      database: cf.asString(),
    },
  },
  report: {
    title: cf.asString(),
    emailTo: cf.asList(cf.asString((val) => isEmail(val))),
  }
}

const options = {
  validate: true,
  throwOnError: true,
  onError: (err) => { console.log(err) },
}

const config = cf.compile(configSchema, options)

// onError in options or:
config.on('error', (err) => { console.log(err) })
// or
config.onError((err) => { console.log(err) })

const endSubscription = config.on.server.change((newValue) => {})
const endSubscription2 = config.on.server.host.change((newValue) => {})

endSubscription()
*/
