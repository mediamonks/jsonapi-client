import { ResourceFormatter } from './formatter'
import { Endpoint } from './client/endpoint'
import { DEFAULT_CLIENT_SETUP, Client } from './client'
import { JSONAPIRequestMethod } from './types'

const exampleHref = 'https://example.com/api/v1'

describe('Client', () => {
  describe('constructor', () => {
    it('throws an Error if its first param (url) is not a URL', () => {
      expect(() => new Client(12 as any)).toThrowError()
    })

    it('throws an Error if its first param (url) is an invalid url string', () => {
      expect(() => new Client('')).toThrowError()
    })

    it('must set its first param (url) to Client#url as a URL if it’s a valid url string', () => {
      const client = new Client(exampleHref)
      expect(client.url).toBeInstanceOf(URL)
      expect(client.url.href).toBe(exampleHref)
    })

    it('must set its first param (url) to Client#url unmodified if it’s a URL', () => {
      const url = new URL(exampleHref)
      const client = new Client(url)
      expect(client.url).toBe(url)
    })

    it('throws an Error if its second param (clientSetup) is not an object', () => {
      expect(() => new Client(exampleHref, 12 as any)).toThrowError()
    })

    it('throws an Error if its second param (clientSetup) is not a valid client setup object', () => {
      expect(() => new Client(exampleHref, { absolutePathRoot: null as any })).toThrowError()
      expect(() => new Client(exampleHref, { implicitIncludes: null as any })).toThrowError()
      expect(() => new Client(exampleHref, { implicitIncludes: null as any })).toThrowError()
    })

    it('assigns defaultValues to Client#setup if no second param (clientSetup) is provided', () => {
      const client = new Client(exampleHref)
      expect(client.setup).toEqual(DEFAULT_CLIENT_SETUP)
    })
  })

  describe('endpoint', () => {
    it('returns an Endpoint where #client is this', () => {
      const client = new Client(exampleHref)
      const resource = new ResourceFormatter('Type', {})
      const endpoint = client.endpoint('path', resource)
      expect(endpoint).toBeInstanceOf(Endpoint)
      expect(endpoint.client).toBe(client)
    })
  })

  describe('request', () => {
    it.todo('must set the default headers’ Content-Type to the JSON:API MIME type ')

    it('must call request hooks when a request is made', async () => {
      const requestURL = new URL('http://request.url')
      const requestHeaders = {} as any
      const request = {} as any
      const response = {} as any

      const beforeRequestURL = jest.fn(() => requestURL)
      const beforeRequestHeaders = jest.fn(() => requestHeaders)
      const beforeRequest = jest.fn(() => request)
      const fetchAdapter = jest.fn(() => response)
      const afterRequest = jest.fn()

      const url = new URL('http://example.com/api')

      const client = new Client(url, {
        beforeRequest,
        fetchAdapter,
        afterRequest,
      })

      try {
        await client.request(url, JSONAPIRequestMethod.Post, {} as any)

        expect(beforeRequestURL).toBeCalledWith(url)
        expect(beforeRequestHeaders).toBeCalled()
        expect(beforeRequest).toBeCalled()
        expect(fetchAdapter).toBeCalledWith(request)
        expect(afterRequest).toBeCalledWith(response)
      } catch (_) {}
    })
  })
})
