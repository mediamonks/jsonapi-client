import { ApiClient } from './ApiClient'
import { jsonApiVersions } from '../constants/jsonApi'
import { defaultIncludeFieldOptions } from '../constants/setup'
import { Result } from '../utils/Result'

import { Post } from '../test-utils/resources'
import { mockData } from '../test-utils/mock-data'

describe('Client', () => {
  describe('Client class', () => {
    describe('constructor', () => {
      it('should create a new default instance', () => {
        const url = new URL('https://www.example.com/api')
        const api = new ApiClient(url)

        expect(api.url.href).toEqual(url.href)
        expect(api.setup.createPageQuery).toBeDefined()
        expect(api.setup.version).toBeDefined()
        expect(api.setup.defaultIncludeFields).toBeDefined()
        expect(api.setup.parseRequestError).toBeDefined()
      })

      it('should merge the default setup properly', () => {
        const url = 'https://www.example.com/api'
        const setup = {
          createPageQuery: (page: number) => ({
            foo: 'bar',
          }),
          version: jsonApiVersions['1_1'],
          defaultIncludeFields: defaultIncludeFieldOptions.PRIMARY,
          parseRequestError: (all: any) => all,
        }
        const api = new ApiClient(new URL(url), setup)

        expect(api.setup.createPageQuery).toEqual(setup.createPageQuery)
        expect(api.setup.version).toEqual(setup.version)
        expect(api.setup.defaultIncludeFields).toEqual(setup.defaultIncludeFields)
        expect(api.setup.parseRequestError).toEqual(setup.parseRequestError)
      })

      it('should transform the relationship url when configured via setup - toOne', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new ApiClient(url, {
          transformRelationshipForURL() {
            return 'foo-bar'
          },
        })

        const endpoint = api.endpoint('posts', Post)
        try {
          const mockHandleRequest = jest.fn().mockResolvedValue(
            Result.accept({
              data: mockData.Author.a1,
            }),
          )
          api.controller.handleRequest = mockHandleRequest

          await endpoint.getToOneRelationship('123', 'author', {
            fields: { Author: ['name'] },
          })

          expect(mockHandleRequest.mock.calls[0][0].url).toEqual(
            'https://www.example.com/api/posts/123/foo-bar?fields[Author]=name',
          )
        } catch (errors) {
          console.log(errors)
          throw errors
        }
      })

      it('should transform the relationship url when configured via setup - toMany', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new ApiClient(url, {
          transformRelationshipForURL: () => 'foo-bar',
        })

        const endpoint = api.endpoint('posts', Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: [mockData.Comment.c1],
          }),
        )
        api.controller.handleRequest = mockHandleRequest

        try {
          await endpoint.getToManyRelationship('123', 'comments', {}, {
            fields: { Comment: ['title'] },
          } as any)
        } catch (errors) {
          console.log(errors)
          throw errors
        }

        expect(mockHandleRequest.mock.calls[0][0].url).toEqual(
          'https://www.example.com/api/posts/123/foo-bar?fields[Comment]=title',
        )
      })
    })

    describe('endpoint', () => {
      it('should retrieve the endpoint', () => {
        const url = new URL('https://www.example.com/api')
        const api = new ApiClient(url)

        const endpoint = api.endpoint('foo', Post)

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
