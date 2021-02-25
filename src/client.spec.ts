import { ResourceFormatter } from './formatter'
import { Endpoint } from './client/endpoint'
import { DEFAULT_CLIENT_SETUP, Client } from './client'
import { JSONAPIRequestMethod, JSON_API_MIME_TYPE } from './data/constants'
import { ResourceDocumentError } from './error'

const MOCK_URL = new URL('http://example.com/api/')

describe('Client', () => {
  describe('constructor', () => {
    it('throws an Error if its first param (url) is not a URL', () => {
      expect(() => new Client(12 as any)).toThrowError()
    })

    it('throws an Error if its first param (url) is an invalid url string', () => {
      expect(() => new Client('')).toThrowError()
    })

    it('must set its first param (url) to Client#url as a URL if it’s a valid url string', () => {
      const client = new Client(MOCK_URL.href)
      expect(client.url).toBeInstanceOf(URL)
      expect(client.url.href).toBe(MOCK_URL.href)
    })

    it('must set its first param (url) to Client#url unmodified if it’s a URL', () => {
      const client = new Client(MOCK_URL)
      expect(client.url).toBe(MOCK_URL)
    })

    it('throws an Error if its second param (clientSetup) is not an object', () => {
      expect(() => new Client(MOCK_URL, 12 as any)).toThrowError()
    })

    it('throws an Error if its second param (clientSetup) is not a valid client setup object', () => {
      expect(() => new Client(MOCK_URL, { absolutePathRoot: null as any })).toThrowError()
      expect(() => new Client(MOCK_URL, { implicitIncludes: null as any })).toThrowError()
      expect(() => new Client(MOCK_URL, { beforeRequest: null as any })).toThrowError()
      expect(() => new Client(MOCK_URL, { afterRequest: null as any })).toThrowError()
      expect(() => new Client(MOCK_URL, { transformRelationshipPath: null as any })).toThrowError()
    })

    it('assigns defaultValues to Client#setup if no second param (clientSetup) is provided', () => {
      const client = new Client(MOCK_URL)
      expect(client.setup).toEqual(DEFAULT_CLIENT_SETUP)
    })
  })

  describe('endpoint', () => {
    it('returns an Endpoint where #client is this', () => {
      const client = new Client(MOCK_URL)
      const resource = new ResourceFormatter('Type', {})
      const endpoint = client.endpoint('path', resource)
      expect(endpoint).toBeInstanceOf(Endpoint)
      expect(endpoint.client).toBe(client)
    })
  })

  describe('request', () => {
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

      const client = new Client(MOCK_URL, {
        beforeRequest,
        fetchAdapter,
        afterRequest,
      })

      try {
        await client.request(MOCK_URL, JSONAPIRequestMethod.Post, {} as any)

        expect(beforeRequestURL).toBeCalledWith(MOCK_URL)
        expect(beforeRequestHeaders).toBeCalled()
        expect(beforeRequest).toBeCalled()
        expect(fetchAdapter).toBeCalledWith(request)
        expect(afterRequest).toBeCalledWith(response)
      } catch (_) {}
    })
  })

  describe('beforeRequest', () => {
    it('must call #setup.beforeRequestURL', async () => {
      const beforeRequestURL = jest.fn((url) => url)

      const client = new Client(MOCK_URL, {
        beforeRequestURL,
      })

      await (client as any).beforeRequest(MOCK_URL)
      expect(beforeRequestURL).toBeCalledWith(MOCK_URL)
    })

    it('must call #setup.beforeRequestHeaders with default json:api headers', async () => {
      const beforeRequestHeaders = jest.fn((headers) => headers)

      const client = new Client(MOCK_URL, {
        beforeRequestHeaders,
      })

      const body = {}

      await (client as any).beforeRequest(MOCK_URL, 'POST', body)
      expect(beforeRequestHeaders).toBeCalledWith(
        new Headers([
          ['Accept', JSON_API_MIME_TYPE],
          ['Content-Type', JSON_API_MIME_TYPE],
        ]),
      )

      await (client as any).beforeRequest(MOCK_URL, 'DELETE')
      expect(beforeRequestHeaders).toBeCalledWith(new Headers([['Accept', JSON_API_MIME_TYPE]]))
    })

    it.todo(
      'must call #setup.beforeRequest with a Request object',
      // async () => {
      //   const beforeRequest = jest.fn((request) => request)
      //   const client = new Client(MOCK_URL, {
      //     beforeRequest,
      //   })
      //   const body = { foo: 1 }
      //   await (client as any).beforeRequest(MOCK_URL, 'POST', body)
      //   expect(beforeRequest).toBeCalledWith({
      //     url: MOCK_URL.href,
      //     method: 'POST',
      //     headers: new Headers([
      //       ['Accept', JSON_API_MIME_TYPE],
      //       ['Content-Type', JSON_API_MIME_TYPE],
      //     ]),
      //     body: `{"foo":1}`,
      //   })
      // },
    )
  })

  describe('afterRequest', () => {
    it('must return response data for a valid request', async () => {
      const client = new Client(MOCK_URL)
      const result = await (client as any).afterRequest(
        {
          ok: true,
          status: 200,
          async json() {
            return {
              data: {
                id: 'foo',
                type: 'bar',
              },
            }
          },
        },
        {
          method: 'GET',
        },
      )

      expect(result).toEqual({
        data: {
          id: 'foo',
          type: 'bar',
        },
      })
    })

    it('must return null if a POST response is ok with a status of 204', async () => {
      const client = new Client(MOCK_URL)
      const result = await (client as any).afterRequest(
        {
          ok: true,
          status: 204,
          async json() {},
        },
        {
          method: 'POST',
        },
      )

      expect(result).toBe(null)
    })

    it('must return null if a DELETE response data is empty', async () => {
      const client = new Client(MOCK_URL)
      const result = await (client as any).afterRequest(
        {
          ok: true,
          status: 200,
          async json() {},
        },
        {
          method: 'DELETE',
        },
      )

      expect(result).toBe(null)
    })

    it('must return null if a PATCH response data is empty', async () => {
      const client = new Client(MOCK_URL)
      const result = await (client as any).afterRequest(
        {
          ok: true,
          status: 200,
          async json() {},
        },
        {
          method: 'PATCH',
        },
      )

      expect(result).toBe(null)
    })

    it('must return null if a POST response data is empty', async () => {
      const client = new Client(MOCK_URL)
      const result = await (client as any).afterRequest(
        {
          ok: true,
          status: 200,
          async json() {},
        },
        {
          method: 'POST',
        },
      )

      expect(result).toBe(null)
    })

    it('must throw InvalidResourceDocument error if the response data is invalid', async () => {
      const client = new Client(MOCK_URL)

      try {
        await (client as any).afterRequest(
          {
            ok: true,
            status: 200,
            async json() {
              return {} // invalid data
            },
          },
          {
            method: 'GET', // does not matter which method is used
          },
        )
      } catch (error) {
        expect(error).toBeInstanceOf(ResourceDocumentError)
        expect(error.message).toBe('Invalid JSON:API Document')
      }
    })

    it('must throw statusText error if the response is not okay', async () => {
      const client = new Client(MOCK_URL)

      try {
        await (client as any).afterRequest({
          ok: false,
          statusText: '<statusText>',
          async json() {
            return {
              errors: [],
            }
          },
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ResourceDocumentError)
        expect(error.message).toBe('<statusText>')
      }
    })

    it('must throw InvalidResourceDocument error if the response and its data are not okay', async () => {
      const client = new Client(MOCK_URL)

      try {
        await (client as any).afterRequest({
          ok: false,
          async json() {
            return {} // invalid data
          },
        })
      } catch (error) {
        expect(error).toBeInstanceOf(ResourceDocumentError)
        expect(error.message).toBe('Invalid JSON:API Document')
      }
    })
  })

  describe('toString', () => {
    it('returns the url href', () => {
      const url = new URL('htpp://example.com/api/')
      const client = new Client(url)

      expect(client.toString()).toBe(url.href)
    })
  })
})
