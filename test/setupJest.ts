const nodeFetch = require('node-fetch')

Object.assign(globalThis, {
  Request: nodeFetch.Request,
  Response: nodeFetch.Response,
})
