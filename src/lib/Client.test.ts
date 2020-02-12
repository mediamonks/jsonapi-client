import { Client } from './Client'
import { Result } from '../utils/Result'

import { Post } from '../../test/resources'
import { url, data } from '../../test/mocks'

describe('Client', () => {
  describe('constructor', () => {
    it('should create a new instance', () => {
      const client = new Client(url)
      expect(client.url.href).toEqual(url.href)
      expect(client.setup.createPageQuery).toBeDefined()
      expect(client.setup.parseErrorObject).toBeDefined()
    })

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
  })
})
