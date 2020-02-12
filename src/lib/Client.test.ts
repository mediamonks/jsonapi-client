import { Client } from './Client'
import { Result } from '../utils/Result'

import { Post } from '../test-utils/resources'
import { mockData } from '../test-utils/mock-data'

describe('Client', () => {
  describe('Client class', () => {
    describe('constructor', () => {
      it('should create a new default instance', () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url)

        expect(api.url.href).toEqual(url.href)
        expect(api.setup.createPageQuery).toBeDefined()
        expect(api.setup.parseRequestError).toBeDefined()
      })

      it('should merge the default setup properly', () => {
        const url = 'https://www.example.com/api'
        const setup = {
          createPageQuery: (page: number) => ({
            foo: 'bar',
          }),
          parseRequestError: (all: any) => all,
        } as const
        const api = new Client(new URL(url), setup)

        expect(api.setup.createPageQuery).toEqual(setup.createPageQuery)
        expect(api.setup.parseRequestError).toEqual(setup.parseRequestError)
      })

      it('should transform the relationship url when configured via setup - toOne', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url, {
          transformRelationshipForURL() {
            return 'foo-bar'
          },
        })
        const endpoint = api.endpoint(Post)

        try {
          const mockHandleRequest = jest.fn().mockResolvedValue(
            Result.accept({
              data: mockData.Author.a1,
            }),
          )
          api.controller.handleRequest = mockHandleRequest

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
        const url = new URL('https://www.example.com/api')
        const api = new Client(url, {
          transformRelationshipForURL: () => 'foo-bar',
        })

        const endpoint = api.endpoint(Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: [mockData.Comment.c1],
          }),
        )
        api.controller.handleRequest = mockHandleRequest

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
        const url = new URL('https://www.example.com/api')
        const api = new Client(url)

        const endpoint = api.endpoint(Post)

        expect(endpoint.client).toEqual(api)
      })

      // it('should register the Resource', () => {
      //   const url = 'https://www.example.com/api'
      //   const api = new Api(new URL(url))

      //   const endpoint = api.endpoint('/foo', Post)

      //   // endpoint.getRelationship('123', 'author', { fields: { Author: ['name'] } })
      //   // endpoint.fetchRelationship('123', 'comments', {}, { fields: { Comment: ['title'] } })

      //   expect(endpoint.api.controller.getResource('Post')).toEqual(Post)
      // })
    })

    // describe('register', () => {
    //   it('should register a Resource', () => {
    //     const url = 'https://www.example.com/api'
    //     const api = new Api(new URL(url))

    //     api.register(Post)

    //     expect(api.controller.getResource('Post')).toEqual(Post)
    //   })
    // })
  })
})
