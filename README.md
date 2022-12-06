# ConfMon &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/victorkirov/confmon/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/confmon.svg?style=flat)](https://www.npmjs.com/package/confmon)

ConfMon loads configuration from a variety of files and custom sources and combines them into one global object. It then monitors those files for changes and allows the user to subscribe to change events on any node in the configuration, so that the software can react to configuration changes without a restart.

This library was specifically designed for, but is not limited to, use in Kubernetes where Config Maps and Secrets update when their value is changed and they are mounted in a container as a file.

Please note, this library is still in alpha phase, so the interface and usage can change without notice.

## TODOS to get to beta
- Do the TODO comments
- Tests, tests, tests
- Figure out when errors are thrown and how they should be handled... e.g. remove a required field from config files and error is thrown

## Contents
- [Why ConfMon?](#why-confmon)
- [Quick start](#quick-start)
- [Config files](#config-files)
  - [**Direct value files with .confval files**](#direct-value-files-with-confval-files)
  - [**Loading environment variables**](#loading-environment-variables)
  - [**Custom file loaders**](#custom-file-loaders)
  - [**Compile options**](#compile-options)
- [Building a config schema](#building-a-config-schema)
  - [**Reserved Keys**](#reserved-keys)
  - [**Other config value sources**](#other-config-value-sources)
  - [**Lists**](#lists)
  - [**Custom Schema Types**](#custom-schema-types)
- [Querying values from a compiled configuration](#querying-values-from-a-compiled-configuration)
  - [**Getting config values (Sync)**](#getting-config-values-sync)
  - [**Getting config values (Async)**](#getting-config-values-async)
  - [**Subscribing to/unsubscribing from change events**](#subscribing-tounsubscribing-from-change-events)

## Why ConfMon?
ConfMon was designed with 2 main requirements in mind.

1. Create a configuration manager which is Typescript capable by default, so that you don't have to guess the structure of your configuration and manually cast values to types
2. Enable hot reloading of configuration values from files so that you don't have to restart your application each time you deploy a new Kubernetes configMap or secret.

## Quick start
**Step 1 -  Import ConfMon module**
```javascript
import cf from 'confmon'
```

**Step 2 -  Define your schema**
```javascript
const configSchema = {
  server: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000)
  },
  defaultResponse: cf.asString().default('Hello World!'),
  turtles: cf.asNumber().default(5607)
}
```

**Step 3 - Compile your config instance from the schema**
```javascript
const myConfig = cf.compile(configSchema)
```

**Step 4 - Use your config**
```javascript
const host = myConfig.server.host.getSync()
// typescript will automatically see `typeof host` as a string

// or, preferably, in async we can just await a node in the config to get its value

const port = await myConfig.server.port
// typescript will automatically see `typeof port` as a number

const server = await myConfig.server
/*
  typescript will automatically see `typeof server` as
  {
    host: string
    port: number
  }
*/

const entireConfig = await myConfig
// You can even retrieve the full config object which is also typed correctly
```

**Step 5 - Setup change listeners**
```javascript
myConfig.server.confListen(newServerValue => console.log('Server changed: ', newServerValue))
```

## Config files
Configuration files should exist in a single directory. They can be in the `json` format by default or you can specify custom file loaders and use other formats (see [**Custom file loaders**](#custom-file-loaders)). A custom extension, `confval`, was also implemented and is described [below](#direct-value-files-with-confval-files). You are also able to add your own, custom file loaders to handle other file formats, as describe [below](#custom-file-loaders).

By default, the configuration directory is located at `<working_directory>/config`. This can be set to a relative path from the working directory, or to an absolute path by setting the `configDirectory` in the options argument given to the compiler.

Files in the config directory are loaded alphabetically with a lexicographical ordering and merged in that order. This means that a value defined in a file will be overwritten if it exists in a file with a later lexicographical filename.

### **Direct value files with .confval files**
If you have a file which fully contains the value of a node in your schema (e.g. a Kubernetes Secret mounted into a container), then you can name it with the path to the field in the schema, separated with pipes (`|`) and having extension `.confval`. This will load the entirety of the file into the configuration instance.

Example:

With the below schema:
```javascript
const schema = {
  database: {
    credentials: {
      password: cf.asString().required()
    }
  }
}
```

We can load the password from the contents of a file:
#### **`database|credentials|password.confval`**
```
my-super-secret-database-password
```

### **Loading environment variables**
To load configuration from environment variables as specified in a file, we can add the extension `.env.<SUPPORTED_EXT>` and have values formatted as `${ENV_VAR_NAME}`.

Example:

With the below schema:
```javascript
const schema = {
  database: {
    credentials: {
      password: cf.asString().required()
    }
  }
}
```

We can load the password from an environment variable named `DB_PASS` with the following config file:
#### **`database.env.yaml`**
```yaml
database:
  credentials:
    password: ${DB_PASS}
```

### **Custom file loaders**
TODO

### **Compile options**
TODO

## Building a config schema
In order to allow Typescript to work its magic, we need to define the schema of the configuration that we are expecting. There are a variety of schema types which ConfMon exposes, and you can also create your own [custom](#custom-schema-types) ones.

When building a schema, you will need to define the structure of your configuration data using a javascript object whose leaf nodes are ConfMon schema objects.

Example:
```javascript
import cf from 'confmon'

const mySchema = {
  database: {
    host: cf.asString().default('localhost'),
    credentials: {
      username: cf.asString().required(),
      password: cf.asString().required()
    }
  },
  logLevel: cf.asEnum('DEBUG', 'INFO', 'WARN', 'ERROR').from(() => {
      const resp = await axios.get('http://my-conf-service/loglevel')
      return resp.data ?? 'INFO'
    }, {
      pollInterval: 10000,
    }
  }),
  thenSurrogate: cf.asString().fromKey('then')
}
```

Each schema object has the following chainable methods:

`.default(<default_value>)` - Specify a default value if one is not found from the configuration files.

`.required()` - Mark a field as required. If this field ever gets a null or undefined value, an error will be thrown.

`.from(<async_func>, <options>)` - When the configuration is loaded, this field will get its value from the specified function instead of from a file. This will allow you to get a value from an API or a custom source. The `options` argument allows you to configure how this function is called. For instance, this function will only be called on startup by default and you can set it up to be called continuously with an interval by specifying the `pollInterval` option. See [other config value sources](#other-config-value-sources) below.

`.fromKey(<key>)` - This will allow you to map a key in the configuration object from the files to a different one in your schema. See [reserved keys](#reserved-keys) below.

### **Reserved Keys**
There are a few keys which are reserved and cannot be used in your schema as they would clash with the functionality fo the library. The list has been kept small and as obscure as possible.

These are: `then`, `confListen`, `confRemoveListener`, `getSync`

There is a workaround which will allow you to load values with these names by mapping them to a schema field with a different name. Note that this will only work for leaf nodes for now.

Example:
#### **`config.yaml`**
```yaml
afterCall:
  then: 42
```
The schema could be defined as
```javascript
const mySchema = {
  afterCall: {
    thenDo: cf.asNumber().fromKey('then')
  }
}
```

### **Other config value sources**
ConfMon allows you to load parts of your schema from completely custom sources by allowing you to specify a function which will feed the value of the configuration field. This is done by using the `.from(<func>, <options>)` schema class method.

Note:
These are just examples and possibly not the best way to implement global log levels, for example. An alternative approach could be to have a global Kubernetes ConfigMap which is mounted into the config folder for all of your deployments. You could have no log level specified by default allowing service to specify their own defaults, but if you had to debug an issue throughout all your services, you could update that config-map with 'INFO' or 'DEBUG' for the log level. There are many ways to skin a fish, the below is just one of them.

Example:
```javascript
import cf from 'confmon'
import axios from 'axios'

const mySchema = {
  // Here we get the log level from an API call to a config service in our cluster
  // This would allow us to globally change the log level for all applications in the cluster from one location
  logLevel: cf.asEnum('DEBUG', 'INFO', 'WARN', 'ERROR').from(() => {
      const resp = await axios.get('http://my-conf-service/loglevel')
      return resp.data ?? 'INFO'
    }, {
      pollInterval: 10000,
    }
  }),
  // We can even load values from the environment using this method if we know that those values will never change
  // This would be an alternative to the .env.<EXT> files
  myProcessId: cf.asNumber().from(() => process.env.PROC_ID)
}
```

### **Lists**
Config values containing lists are supported. The type of item in the list is defined as a separate schema and can include a completely structured object definition, as shown in the examples below.

If multiple sources define the values of the list, the source which is loaded last will fully define the contents of the list (i.e. lists are not merged form multiple sources).

Example:
```javascript
import cf from 'confmon'
import axios from 'axios'

const mySchema = {
  // A list of strings
  emailAddresses: cf.asList(cf.asString()),

  // a list of any object type
  emailBodyTemplates: cf.asList(cf.asUnstructuredObject())

  // a list of objects of a particular structure
  emailTemplateFields: cf.asList(cf.asStruct({
    name: cf.asString(),
    value: cf.asString(),
    order: cf.asNumber(),
  }))
}
```

### **Custom Schema Types**
While many schema types exist, you may want to create your own custom ones with their own value validation.

To do this, you will need to import the `BaseType` abstract class and create a custom implementation of it. You can then use your custom schema type when building your schema.

Example:
If we want to create a custom Email schema type accepting email addresses from only the ACME INC. domain, we can define a new schema type and use it as follows:
```javascript
import cf, { BaseType } from 'confmon'

const acmeEmailRX = /^[a-zA-Z0-9\.\-+]+@acme\.com$/

class EmailACME extends BaseType<string> {
  validate = (value: unknown): string => {
    if (typeof value !== 'string') {
      throw new Error(`${this.constructor.name} must be a string`)
    }

    if (!acmeEmailRX.test('@acme.com')) {
      throw new Error(`${this.constructor.name} must be an ACME email address`)
    }

    return value
  }
}

const mySchema = {
  adminEmail: new EmailACME().default('admin@acme.com'),
  password: cf.asString().required()
}
```

## Querying values from a compiled configuration
Once we have defined our schema and compiled our config object, we will need to be able to extract values from it and to know if a value has changed. We can get values [synchronously](#getting-config-values-sync) or [asynchronously](#getting-config-values-async).

For base nodes in the schema where the values are pulled from a file, using the asynchronous and synchronous methods will have the same effect almost all the time (unless a value changes during the execution of the async promise).

Nodes which specify a `.from(<from_func>)` source and are retrieved in a custom manner, **could result in different values for the sync and async retrieval methods, especially on startup.** This is because the config compilation is done synchronously for file sources but in a promise or custom sources. For custom source nodes, it is recommended to use the asynchronous retrieval or to setup a listener for value changes.

This example illustrates the issue:
```javascript
import cf from 'confmon'
import axios from 'axios'

const mySchema = {
  logLevel: cf.asEnum('DEBUG', 'INFO', 'WARN', 'ERROR').from(() => {
      const resp = await axios.get('http://my-conf-service/loglevel')
      return resp.data ?? 'INFO'
    }, {
      pollInterval: 10000,
    }
  }),
}

const config = cf.compile(mySchema)

// since the api call to the conf service takes some time, this will log `undefined`
console.log(config.logLevel.getSync())

// using asynchronous retrieval, the promise will await the api call and return the initial value
config.logLevel.then(logLevelValue => console.log(logLevelValue))
```

### **Getting config values (Sync)**
Once a schema is compiled into a config object, you can retrieve any part of the config by calling `getSync()` on the required node. Please see the caveat when using this method [above](#querying-values-from-a-compiled-configuration).

Example:
```javascript
import cf from 'confmon'

const mySchema = {
  database: {
    host: cf.asString().default('localhost'),
    credentials: {
      username: cf.asString().required(),
      password: cf.asString().required()
    }
  },
  dateFormat: cf.asString().default('yyy-mm-dd')
}

const config = cf.compile(mySchema)

const entireConfig = config.getSync()
const dateFormat = config.dateFormat.getSync()
const entireDatabaseNode = config.database.getSync()
const databaseCredentials = config.database.credentials.getSync()
const databaseHost = config.database.host.getSync()
```

### **Getting config values (Async)**
Once a schema is compiled into a config object, you can retrieve any part of the config by awaiting the node you require as if it was a promise. You can either await it, or call `.then(<cb>)` as with any other promise.

Example:
```javascript
import cf from 'confmon'

const mySchema = {
  database: {
    host: cf.asString().default('localhost'),
    credentials: {
      username: cf.asString().required(),
      password: cf.asString().required()
    }
  },
  dateFormat: cf.asString().default('yyy-mm-dd')
}

const config = cf.compile(mySchema)

const someAsyncMethod = async () => {
  const entireConfig = await config
  const dateFormat = await config.dateFormat
  const entireDatabaseNode = await config.database
  const databaseCredentials = await config.database.credentials
  const databaseHost = await config.database.host
}

// or
config.then(entireConfig => {
  // do stuff with config here
})
```

### **Subscribing to/unsubscribing from change events**
Apart from retrieving config values, we want to be able to react to changes in the values, so we need to know when a config value has changed. We can do this by adding a listener to any node in the config with a callback function which handles the change. This is done by calling the `.confListen(<callback>)` function on any node in the compiled config.

```javascript
import cf from 'confmon'
import knex from 'knex'

const mySchema = {
  database: {
    client: cf.asString().default('sqlite'),
    connection: {
      host: cf.asString().default('localhost'),
      user: cf.asString().required(),
      password: cf.asString().required()
    }
  },
  dateFormat: cf.asString().default('yyy-mm-dd')
}

const config = cf.compile(mySchema)

const knexConfig = config.database.getSync()

let knexConnection = knex(knexConfig)

config.database.confListen(newConfig => {
  knexConnection = knex(newConfig)
})

// We also have access to the old value
config.dateFormat.confListen((newFormat, oldFormat) => {
  // do something here
})
```

It may also be useful to unsubscribe a listener from a node. This can be done in one of 2 ways. Either we keep an instance of the callback function and call `.confRemoveListener(c<callback>)` on the node that has the listener attached, or we call returned value from the `confListen()` function.

```javascript
let knexConnection = knex(knexConfig)

const callback = (newConfig) => {
  knexConnection = knex(newConfig)
})

const cancelListenerFunc = config.database.confListen(callback)

// we can remove the above listener by either calling the cancelListenerFunc
cancelListenerFunc()

// or by calling `confRemoveListener`
config.database.confRemoveListener(callback)
```
