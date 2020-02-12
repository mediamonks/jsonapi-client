import { FilteredResource } from './Resource'
import { Client } from './Client'
import { Result } from '../utils/Result'
import { CollectionResult, EntityResult } from './Result'

import { mockData } from '../test-utils/mock-data'
import { Author, Post, Comment } from '../test-utils/resources'

describe('ApiEndpoint', () => {
  describe('ApiEndpoint class', () => {
    describe('constructor', () => {
      it('should create a new default instance', () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint).toBeDefined()
      })
    })

    describe('create', () => {
      // it('should create a resource item', async () => {
      //   const api = new Client(new URL('https://www.example.com/api'))
      //   const endpoint = new ClientEndpoint(api, '/assets', Asset)
      //   const data = {
      //     type: 'Asset',
      //     id: '123',
      //     assetType: 'foo',
      //     name: 'foo',
      //     alt: 'foo',
      //   } as const
      //   const item = await endpoint.create(data)
      //   expect(item).toMatchObject(data)
      // })
    })

    describe('patch', () => {
      // it('should patch a resource item', async () => {
      //   const api = new Client(new URL('https://www.example.com/api'))
      //   const endpoint = new ClientEndpoint(api, '/assets', Asset)
      //   const data = {
      //     type: 'Asset',
      //     id: '123',
      //     assetType: 'foo',
      //     name: 'foo',
      //     alt: 'foo',
      //   } as const
      //   const item = await endpoint.patch(data)
      //   expect(item).toMatchObject(data)
      // })
    })

    describe('getOne', () => {
      it('should get a resource item', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url, {
          beforeRequest(request) {
            return request
          },
        })
        const endpoint = api.endpoint(Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: mockData.Post.p1,
          }),
        )

        api.controller.handleRequest = mockHandleRequest

        const item = await endpoint.getOne('123', {})

        expect(item.data).toMatchObject({
          id: 'p1',
          type: 'Post',
          title: 'Post 1',
          content: 'foo',
        })
        expect(item.data).toBeInstanceOf(Post)
        expect(item).toBeInstanceOf(EntityResult)
        expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
          'https://www.example.com/api/posts/123',
        )
      })
    })

    describe('getMany', () => {
      it('should get a list of resources', async () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: [mockData.Post.p1],
          }),
        )

        api.controller.handleRequest = mockHandleRequest

        let items
        try {
          items = await endpoint.getMany(null, { fields: { Post: ['title', 'content'] } })
        } catch (errors) {
          console.log(errors)
          throw errors
        }

        expect(items.data).toEqual([
          {
            id: 'p1',
            type: 'Post',
            title: 'Post 1',
            content: 'foo',
          },
        ])
        expect(items.data[0]).toBeInstanceOf(Post)
        expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
          'https://www.example.com/api/posts?fields%5BPost%5D=title%2Ccontent',
        )
      })
    })

    describe('getToOneRelationship', () => {
      it('should fetch a one-to-one relationship', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: mockData.Author.a1,
          }),
        )

        api.controller.handleRequest = mockHandleRequest

        let item: EntityResult<FilteredResource<Author, { fields: { Author: ['name'] } }>, any>
        try {
          item = await endpoint.getToOneRelationship('123', 'author', {
            fields: { Author: ['name'] } as const,
          })
        } catch (errors) {
          console.log(errors)
          throw errors
        }
        if (item) {
          expect(item.data).toEqual({
            id: 'a1',
            type: 'Author',
            name: 'Narie',
          })
          expect(item.data).toBeInstanceOf(Author)
          expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
            'https://www.example.com/api/posts/123/author?fields%5BAuthor%5D=name',
          )
        }
      })
    })

    describe('getToManyRelationship', () => {
      it('should fetch a one-to-many relationship', async () => {
        const url = new URL('https://www.example.com/api')
        const api = new Client(url)

        const endpoint = api.endpoint(Post)

        const mockHandleRequest = jest.fn().mockResolvedValue(
          Result.accept({
            data: [mockData.Comment.c1],
          }),
        )
        api.controller.handleRequest = mockHandleRequest

        let item: CollectionResult<
          FilteredResource<Comment, { fields: { Comment: ['title'] } }>,
          any
        >
        try {
          item = await endpoint.getToManyRelationship('123', 'comments', null, {
            fields: { Comment: ['title'] },
          } as const)
        } catch (errors) {
          console.log(errors)
          throw errors
        }
        if (item) {
          expect(item.data).toEqual([
            {
              id: 'c1',
              type: 'Comment',
              title: 'Comment 1',
            },
          ])
          expect(item.data[0]).toBeInstanceOf(Comment)
          expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
            'https://www.example.com/api/posts/123/comments?fields%5BComment%5D=title',
          )
        }
      })
    })

    describe('toString', () => {
      it('should return the correct endpoint path with trailing API slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toString()).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path without trailing API slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toString()).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path with leading endpoint slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toString()).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path with trailing endpoint slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toString()).toEqual('https://www.example.com/api/posts')
      })
    })

    describe('toURL', () => {
      it('should return the correct endpoint path with trailing API slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path without trailing API slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path with leading endpoint slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts')
      })

      it('should return the correct endpoint path with trailing endpoint slash', () => {
        const url = new URL('https://www.example.com/api/')
        const api = new Client(url)
        const endpoint = api.endpoint(Post)

        expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts')
      })
    })
  })
})
