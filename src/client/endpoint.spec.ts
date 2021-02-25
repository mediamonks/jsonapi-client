import { formatterA } from '../../test/formatters'
import { repositoryA, repositoryB } from '../../test/repositories'
import { Client } from '../client'
import { createMockFetch } from '../mock/fetch'
import { Endpoint } from './endpoint'

const fetchAdapter = createMockFetch({
  repositories: [repositoryA, repositoryB],
  latency: 0,
})

const MOCK_URL = new URL('https://example.com/api/')

describe('Endpoint', () => {
  describe('constructor', () => {
    it.todo('is an Endpoint constructor')
  })

  describe('getOne', () => {
    it.todo('throws an error if an invalid resource is retrieved')
  })

  describe('createQuery', () => {
    const client = new Client(MOCK_URL)
    const endpoint = new Endpoint(client, 'path-a', formatterA)

    it('returns a parsed resource filter', () => {
      const filter = {
        fields: {
          a: ['requiredString', 'toOneB', 'toManyA'],
          b: ['requiredString'],
        },
        include: {
          toOneB: null,
          toManyA: null,
        },
      } as const

      expect(endpoint.createQuery(filter.fields, filter.include)).toEqual(filter)
    })

    it('throws when an invalid filter is provided', () => {
      expect(() =>
        endpoint.createQuery({
          fields: {
            a: [],
          },
        } as any),
      ).toThrow()

      expect(() =>
        endpoint.createQuery({
          fields: {
            a: ['does not exist'],
          },
        } as any),
      ).toThrow()

      expect(() =>
        endpoint.createQuery({
          include: {
            doesNotExist: null,
          },
        } as any),
      ).toThrow()

      expect(() =>
        endpoint.createQuery({
          include: true,
        } as any),
      ).toThrow()
    })
  })

  describe('create', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.create({
        type: 'a',
        requiredString: 'foo',
      })

      expect(clientRequest).toBeCalledWith(new URL('path-a', MOCK_URL), 'POST', {
        data: {
          type: 'a',
          attributes: {
            requiredString: 'foo',
          },
        },
      })
    })

    it('must attempt to format the POST body if the response is 204', async () => {
      const client = new Client(MOCK_URL, {
        async fetchAdapter() {
          return {
            ok: true,
            status: 204,
            async json() {},
          } as any
        },
      })

      const endpoint = client.endpoint('path-a', formatterA)

      const resource = await endpoint.create({
        id: 'foo',
        type: 'a',
        requiredString: 'foo',
      })

      expect(resource).toEqual({
        id: 'foo',
        type: 'a',
        requiredString: 'foo',
        optionalString: null,
        toOneB: null,
        toManyA: [],
      })
    })
  })

  describe('update', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.update({
        type: 'a',
        id: '0',
        requiredString: 'bar',
      })

      expect(clientRequest).toBeCalledWith(new URL('path-a/0', MOCK_URL), 'PATCH', {
        data: {
          type: 'a',
          id: '0',
          attributes: {
            requiredString: 'bar',
          },
        },
      })
    })
  })

  describe('delete', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.delete('0')

      expect(clientRequest).toBeCalledWith(new URL('path-a/0', MOCK_URL), 'DELETE')
    })
  })

  describe('updateRelationship', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.updateRelationship('0', 'toOneB', { type: 'b', id: '12' })

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/toOneB', MOCK_URL),
        'PATCH',
        {
          data: { type: 'b', id: '12' },
        },
      )

      endpoint.updateRelationship('0', 'toOneB', null)

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/toOneB', MOCK_URL),
        'PATCH',
        {
          data: null,
        },
      )

      endpoint.updateRelationship('0', 'toManyA', [{ type: 'a', id: '12' }])

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/toManyA', MOCK_URL),
        'PATCH',
        {
          data: [{ type: 'a', id: '12' }],
        },
      )
    })
  })

  describe('clearRelationship', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.clearRelationship('0', 'toOneB')

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/toOneB', MOCK_URL),
        'PATCH',
        {
          data: null,
        },
      )

      endpoint.clearRelationship('0', 'toManyA')

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/toManyA', MOCK_URL),
        'PATCH',
        {
          data: [],
        },
      )
    })
  })

  describe('getOne', () => {
    it('calls client#request with proper arguments', () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.getOne('1')

      expect(clientRequest).toBeCalledWith(new URL(`path-a/0`, MOCK_URL), 'GET')
    })

    it('must decode the response data', async () => {
      const client = new Client(MOCK_URL, {
        async fetchAdapter() {
          return {
            ok: true,
            async json() {
              return {
                data: {
                  id: 'foo',
                  type: 'a',
                  attributes: {
                    requiredString: 'test',
                  },
                },
              }
            },
          } as any
        },
      })

      const endpoint = client.endpoint('path-a', formatterA)

      const resource = await endpoint.getOne('foo')

      expect(resource).toEqual({
        id: 'foo',
        type: 'a',
        requiredString: 'test',
        optionalString: null,
        toOneB: null,
        toManyA: [],
      })
    })
  })

  describe('getMany', () => {
    it('calls client#request with proper arguments', () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.getMany()

      expect(clientRequest).toBeCalledWith(new URL(`path-a`, MOCK_URL), 'GET')
    })

    it('must decode the response data', async () => {
      const client = new Client(MOCK_URL, {
        async fetchAdapter() {
          return {
            ok: true,
            async json() {
              return {
                data: [
                  {
                    id: 'foo',
                    type: 'a',
                    attributes: {
                      requiredString: 'test',
                    },
                  },
                ],
              }
            },
          } as any
        },
      })

      const endpoint = client.endpoint('path-a', formatterA)

      const resource = await endpoint.getMany()

      expect(resource).toEqual([
        {
          id: 'foo',
          type: 'a',
          requiredString: 'test',
          optionalString: null,
          toOneB: null,
          toManyA: [],
        },
      ])
    })
  })

  describe('toOne', () => {
    it('must return a function', () => {
      const client = new Client(MOCK_URL)

      const endpoint = client.endpoint('path-a', formatterA)

      expect(typeof endpoint.toOne('toOneB')).toBe('function')
    })

    it('must throw if an invalid field name is used', () => {
      const client = new Client(MOCK_URL)
      const endpoint = client.endpoint('path-a', formatterA)

      expect(() => endpoint.toOne('invalidFieldName' as any)).toThrow()
    })
  })

  describe('getToOne', () => {
    it('calls client#request with proper arguments', () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.getToOne('1', 'toOneB')

      expect(clientRequest).toBeCalledWith(
        new URL(`path-a/1/relationships/toOneB`, MOCK_URL),
        'GET',
      )
    })

    it('must throw if an invalid field name is used', () => {
      const client = new Client(MOCK_URL)
      const endpoint = client.endpoint('path-a', formatterA)

      expect(() => endpoint.getToOne('1', 'invalidFieldName' as any)).toThrow()
    })
  })

  describe('toMany', () => {
    it('must return a function', () => {
      const client = new Client(MOCK_URL)

      const endpoint = client.endpoint('path-a', formatterA)

      expect(typeof endpoint.toMany('toManyA')).toBe('function')
    })

    it('must throw if an invalid field name is used', () => {
      const client = new Client(MOCK_URL)
      const endpoint = client.endpoint('path-a', formatterA)

      expect(() => endpoint.toMany('invalidFieldName' as any)).toThrow()
    })
  })

  describe('getToMany', () => {
    it('calls client#request with proper arguments', () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.getToMany('1', 'toManyA')

      expect(clientRequest).toBeCalledWith(
        new URL(`path-a/1/relationships/toManyA`, MOCK_URL),
        'GET',
      )
    })

    it('must throw if an invalid field name is used', () => {
      const client = new Client(MOCK_URL)
      const endpoint = client.endpoint('path-a', formatterA)

      expect(() => endpoint.getToMany('1', 'invalidFieldName' as any)).toThrow()
    })
  })

  describe('addToManyRelationshipMembers', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.addToManyRelationshipMembers('0', 'toManyA', [{ type: 'a', id: '2' }])

      expect(clientRequest).toBeCalledWith(
        new URL(`path-a/0/relationships/toManyA`, MOCK_URL),
        'POST',
        {
          data: [{ type: 'a', id: '2' }],
        },
      )
    })

    it('must use toRelationshipFieldPath to build the url', () => {
      const transformRelationshipPath = jest.fn(() => 'PATH')
      const client = new Client(MOCK_URL, {
        fetchAdapter,
        transformRelationshipPath,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.addToManyRelationshipMembers('0', 'toManyA', [{ type: 'a', id: '2' }])

      expect(transformRelationshipPath).toBeCalledWith(`toManyA`, formatterA)

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/PATH', MOCK_URL),
        'POST',
        {
          data: [{ type: 'a', id: '2' }],
        },
      )
    })
  })

  describe('removeToManyRelationshipMembers', () => {
    it('calls client#request with proper arguments', async () => {
      const client = new Client(MOCK_URL, {
        fetchAdapter,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.removeToManyRelationshipMembers('0', 'toManyA', [{ type: 'a', id: '2' }])

      expect(clientRequest).toBeCalledWith(
        new URL(`path-a/0/relationships/toManyA`, MOCK_URL),
        'DELETE',
        {
          data: [{ type: 'a', id: '2' }],
        },
      )
    })

    it('must use toRelationshipFieldPath to build the url', () => {
      const transformRelationshipPath = jest.fn(() => 'PATH')
      const client = new Client(MOCK_URL, {
        fetchAdapter,
        transformRelationshipPath,
      })

      const clientRequest = jest.spyOn(client, 'request')

      const endpoint = client.endpoint('path-a', formatterA)

      endpoint.removeToManyRelationshipMembers('0', 'toManyA', [{ type: 'a', id: '2' }])

      expect(transformRelationshipPath).toBeCalledWith(`toManyA`, formatterA)

      expect(clientRequest).toBeCalledWith(
        new URL('path-a/0/relationships/PATH', MOCK_URL),
        'DELETE',
        {
          data: [{ type: 'a', id: '2' }],
        },
      )
    })
  })
})
