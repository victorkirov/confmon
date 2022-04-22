import cf from '../src'

console.log('ENV HOSTTYPE: ', process.env.HOSTTYPE)

const configSchema = {
  server: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000),
  },
  temp: cf.asString(),
  hostType: cf.asString().required(),
  fromVal: {
    innerVal: cf.asString().required(),
  },
}

const myConfig = cf.compile(configSchema)

myConfig.server.then(serverValue => console.log('Server: ', serverValue))
myConfig.server.host.then(serverHostValue => console.log('Host: ', serverHostValue))
myConfig.temp.then(tempValue => console.log('Temp: ', tempValue))
myConfig.hostType.then(tempValue => console.log('Host Type: ', tempValue))
myConfig.fromVal.innerVal.then(tempValue => console.log('Custom Val File: ', tempValue))

myConfig.server.confListen(newServerValue => console.log('Server changed: ', newServerValue))
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
  strict, // ???? Only allow specified values and throw on any unrecognised ones
  onError: (err) => { console.log(err) },
}

const config = cf.compile(configSchema, options)

// onError in options or:
config.on('error', (err) => { console.log(err) })
// or
config.onError((err) => { console.log(err) })

const endSubscription = config.on.server.change((newValue) => {})
const endSubscription2 = config.on.server.host.change((newValue) => {})

const configValue = await config.get.server.host
const endSubscription2 = config.on.server.host.change((newValue) => {})
// or
const configValue = await config.server.host.val()
const endSubscription2 = config.server.host.onChange((newValue) => {})

endSubscription()
*/