import { Client } from './Client'
import { Result } from '../utils/Result'

import { Post } from '../../test/resources'
import {url, data, rawPostResource} from '../../test/mocks'

describe('Client', () => {
  describe('constructor', () => {
    it('should create a new instance', () => {
      const client = new Client(url)
      expect(client.url.href).toEqual(url.href)
      expect(client.setup.createPageQuery).toBeDefined()
      expect(client.setup.parseErrorObject).toBeDefined()
    })
  })

  describe('createPageQuery', () => {
    it('should merge default client setup properly', () => {
      const setup = {
        createPageQuery: (page: number) => ({
          foo: 'bar',
        }),
        parseErrorObject: (all: any) => all,
      } as const
      const client = new Client(url, setup)

      expect(client.setup.createPageQuery).toEqual(setup.createPageQuery)
      expect(client.setup.parseErrorObject).toEqual(setup.parseErrorObject)
    })
  })

  describe('beforeRequest', () => {
    it('should be called', async () => {
      const spy = jest.fn();
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json() {
          return Promise.resolve(rawPostResource)
        },
      } as any)

      const client = new Client(url, {
        beforeRequest(request) {
          spy(request);
          return request;
        },
        fetchAdapter(request) {
          return fetchSpy(request);
        }
      })

      const endpoint = client.endpoint(Post)
      await endpoint.getOne('1');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0].url).toEqual('https://www.example.com/api/posts/1');
    })

    it('should change the url async', async () => {
      const spy = jest.fn();
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json() {
          return Promise.resolve(rawPostResource)
        },
      } as any)

      const client = new Client(url, {
        beforeRequest(request) {
          return new Promise(resolve => {
            setTimeout(() => {
              spy(request);
              // TODO: using MockRequest in unit tests, need to improve this here
              // @ts-ignore
              request.url = 'changed'
              resolve(request);
            }, 10);
          })
        },
        fetchAdapter(request) {
          return fetchSpy(request);
        }
      })

      const endpoint = client.endpoint(Post)
      await endpoint.getOne('1');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0].url).toEqual('changed');
    })
  })

  describe('transformRelationshipForURL', () => {
    it('should transform the relationship url when configured via setup - toOne', async () => {
      const client = new Client(url, {
        transformRelationshipForURL() {
          return 'foo-bar'
        },
      })
      const endpoint = client.endpoint(Post)

      try {
        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: data.Author.a1,
          }),
        )
        client.controller.handleRequest = mockHandleRequest

        await endpoint.getToOneRelationship('123', 'author', {
          fields: {
            Author: ['name'],
          },
        } as const)

        expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
          'https://www.example.com/api/posts/123/foo-bar?fields%5BAuthor%5D=name',
        )
      } catch (errors) {
        console.log(errors)
        throw errors
      }
    })

    it('should transform the relationship url when configured via setup - toMany', async () => {
      const client = new Client(url, {
        transformRelationshipForURL: () => 'foo-bar',
      })

      const endpoint = client.endpoint(Post)

      const mockHandleRequest = jest.fn().mockResolvedValue(
        Result.accept({
          data: [data.Comment.c1],
        }),
      )
      client.controller.handleRequest = mockHandleRequest

      try {
        await endpoint.getToManyRelationship('123', 'comments', {}, {
          fields: { Comment: ['title'] },
        } as const)
      } catch (errors) {
        console.log(errors)
        throw errors
      }

      expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
        'https://www.example.com/api/posts/123/foo-bar?fields%5BComment%5D=title',
      )
    })
  })

  describe('endpoint', () => {
    it('should retrieve the endpoint', () => {
      const client = new Client(url)

      const endpoint = client.endpoint(Post)

      expect(endpoint.client).toEqual(client)
    })

    it('should be used with an alternate path', () => {
      const client = new Client(url)

      const endpoint = client.endpoint(Post, 'foo')

      expect(endpoint.Resource.path).toEqual('foo')
    })
  })
})
