/**
* This example shows off all the features of ConfMon
*/

import axios from 'axios'
import cf, { BaseType } from '../../src'

// ? Custom schema type
class URLType extends BaseType<string> {
  validate(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(`${this.constructor.name} must be a string`)
    }

    if (!value.startsWith('http')) {
      throw new Error(`${this.constructor.name} must start with http`)
    }

    return value
  }
}

const configSchema = {
  // ? server shows required and default values
  server: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000),
  },

  // ? This is an optional value which will be undefined by default
  temp: cf.asString(),

  // ? Using a custom schema type
  apiEndpoint: new URLType().required(),

  // ? Enum values are also supported
  logging: {
    level: cf.asEnum(['INFO', 'DEBUG', 'WARN', 'ERROR']).default('INFO'),
  },

  // ? This is set to be pulled from the environment variable "HOSTTYPE"
  hostType: cf.asString().required(),

  // ? This is populated from a confval file
  fromVal: {
    innerVal: cf.asString().required(),
  },

  // ? This is populated from a custom source, in this case, a remote API, and polled for every 4 seconds
  catFacts: cf.asObject().from(async () => {
    const resp = await axios.get('https://catfact.ninja/fact')
    return resp.data
  }, {
    pollInterval: 4000,
  }),

  // ? 'then' is a reserved key in the ConfMon schema, so we assign it to a different key to that of the origin
  thenSurrogate: cf.asString().fromKey('then')
}

const myConfig = cf.compile(configSchema)

// ? Get values synchronously
console.log('Then Surrogate Sync:', myConfig.thenSurrogate.getSync())
console.log('Server Sync:', myConfig.server.getSync())

// ? Get values asynchronously
myConfig.server.then(serverValue => console.log('Server:', serverValue))
myConfig.server.host.then(serverHostValue => console.log('Host:', serverHostValue))
myConfig.temp.then(tempValue => console.log('Temp:', tempValue))
myConfig.apiEndpoint.then(apiValue => console.log('API Endpoint:', apiValue))
myConfig.logging.then(logLevel => console.log('LogLevel:', logLevel))
myConfig.hostType.then(tempValue => console.log('Host Type:', tempValue))
myConfig.catFacts.then(tempValue => console.log('Cat facts:', tempValue.fact)) // TODO: fix typing or get rid of object type
myConfig.fromVal.innerVal.then(tempValue => console.log('Custom Val File:' , tempValue))

// ? setup listeners
myConfig.server.confListen(newServerValue => console.log('Server changed:', newServerValue))
myConfig.logging.level.confListen((newLogLevel, oldLogLevel) => console.log('Log level changed from <', oldLogLevel, '> to <', newLogLevel, '>'))
myConfig.catFacts.confListen(newCatFactsValue => console.log('Cat facts changed:', newCatFactsValue.fact))

/*
TODO

const configSchema = {
  report: {
    title: cf.asString(),
    fields: cf.asList(cf.asString()),
    credentials: cf.asList({
      user: cf.asString(),
      password: cf.asString(),
    }),
  },
}

const options = {
  throwOnError: true,
  strict, // ???? Only allow specified values and throw on any unrecognised ones
  onError: (err) => { console.log(err) },
}

const config = cf.compile(configSchema, options)

// onError in options or:
config.on('error', (err) => { console.log(err) })
// or
config.onError((err) => { console.log(err) })

*/
