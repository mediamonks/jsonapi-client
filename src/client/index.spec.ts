import { ResourceFormatter } from '../resource/formatter'
import { Endpoint } from './endpoint'
import { defaultClientSetup, Client } from '.'

const exampleHref = 'https://example.com/api/v1'

describe('Client', () => {
  describe('#constructor', () => {
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
      expect(
        () => new Client(exampleHref, { implicitRelationshipData: null as any }),
      ).toThrowError()
      expect(
        () => new Client(exampleHref, { implicitRelationshipData: null as any }),
      ).toThrowError()
    })

    it('assigns defaultValues to Client#setup if no second param (clientSetup) is provided', () => {
      const client = new Client(exampleHref)
      expect(client.setup).toEqual(defaultClientSetup)
    })
  })

  describe('#endpoint', () => {
    it('returns an Endpoint where #client is this', () => {
      const client = new Client(exampleHref)
      const resource = new ResourceFormatter('Type', {})
      const endpoint = client.endpoint('path', resource)
      expect(endpoint).toBeInstanceOf(Endpoint)
      expect(endpoint.client).toBe(client)
    })
  })

  describe('#request', () => {
    it.todo('must perform a request')

    it.todo(
      'must user Client#setup.fetchAdapter to perform the request',
      // async () => {
      //   let hasUsedFetchAdapter = 0
      //   const client = new Client(exampleHref, {
      //     fetchAdapter: async () => {
      //       hasUsedFetchAdapter++
      //       throw new Error()
      //     },
      //   })

      //   const url = new URL(exampleHref)
      //   await client.request(url, 'GET').catch((error) => {
      //     expect(hasUsedFetchAdapter).toBe(error)
      //   })
      // }
    )

    it.todo('must call Client#setup.beforeRequestURL')

    it.todo('must call Client#setup.beforeRequestHeaders')

    it.todo('must call Client#setup.beforeRequest')

    it.todo('must call Client#setup.afterRequest')

    it.todo('must call Client#setup hooks in the proper order')

    it.todo('must set the default headers’ Content-Type to the JSON:API MIME type ')
  })
})
