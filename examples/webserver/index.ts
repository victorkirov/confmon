/**
  * This example shows how we could build a webserver which reacts to changes in its configuration for host and port,
  * and returns the latest values from the config when its endpoints are called.
*/

import express, { RequestHandler, Request, Response, NextFunction } from 'express'
import http from 'http'

import cf from '../../src'

// === ConfMon ===
const configSchema = {
  webServer: {
    host: cf.asString().required(),
    port: cf.asPort().default(3000),
  },
  responses: {
    message1: cf.asString(),
    message2: cf.asString(),
  }
}

const myConfig = cf.compile(configSchema)

// === Express ===
const asyncHandler = (handler: RequestHandler) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handler(req, res, next)
  } catch (err) {
    next(err)
  }
}

const app = express()
app.get(
  '/message1',
  asyncHandler(async (_req, res) => {
    // ? We don't need to listen to changes in message1 because we always get the current value from the config
    const message1 = await myConfig.responses.message1
    res.send(message1)
  })
)
app.get(
  '/message2',
  asyncHandler(async (_req, res) => {
    // ? We don't need to listen to changes in message2 because we always get the current value from the config
    const message2 = await myConfig.responses.message2
    res.send(message2)
  })
)

// === Reactive Server ===
let server: http.Server

/*
  ? Here we start the webserver as a response to changes in the webserver config. This allows us to react to
  ? changes in the host and port values without restarting the application
*/
myConfig.webServer.confListen(
  ({ host, port }) => {
    console.log('bob', { host, port })
    if (server) server.close()

    server = app.listen(port, host, () => {
      console.log(`Server listening on port ${port} and host ${host}`)
      console.log(`Visit http://${host}:${port}/message1`)
      console.log(`Or http://${host}:${port}/message2`)
    })
  },
  {
    callOnInit: true
  }
)
