import { ApiEndpoint } from './ApiEndpoint'
import { Api } from './Api'
import { resource } from './Resource'
import { requiredAttribute } from './ResourceAttribute'
import { isString } from 'isntnt'
import { ApiQuery } from './ApiQuery'
import { Result } from '../utils/Result'

export class Asset extends resource('Asset')<Asset> {
  @requiredAttribute(isString) public assetType!: string
  @requiredAttribute(isString) public name!: string
  @requiredAttribute(isString) public alt!: string
}

describe('ApiEndpoint', () => {
  describe('ApiEndpoint class', () => {
    describe('constructor', () => {
      it('should create a new default instance', () => {
        const api = new Api(new URL('https://www.example.com/api'))
        const endpoint = api.endpoint('/assets', Asset)

        expect(endpoint).toBeDefined()
      })
    })

    describe('create', () => {
      // it('should create a resource item', async () => {
      //   const api = new Api(new URL('https://www.example.com/api'))
      //   const endpoint = new ApiEndpoint(api, '/assets', Asset)
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
      //   const api = new Api(new URL('https://www.example.com/api'))
      //   const endpoint = new ApiEndpoint(api, '/assets', Asset)
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

    describe('get', () => {
      it('should get a resource item', async () => {
        const api = new Api(new URL('https://www.example.com/api'))
        api.register(Asset)
        const endpoint = api.endpoint('/assets', Asset)

        const data = {
          type: 'Asset',
          id: '123',
          assetType: 'foo',
          name: 'foo',
          alt: 'foo',
        } as const

        const mockHandleRequest = jest.fn(
          (): Promise<Result<any, never>> => {
            return new Promise((resolve) => {
              resolve(
                Result.accept({
                  data: {
                    type: data.type,
                    id: data.id,
                    attributes: {
                      assetType: data.assetType,
                      name: data.name,
                      alt: data.alt,
                    },
                  },
                }),
              )
            })
          },
        )

        api.controller.handleRequest = mockHandleRequest

        const item = await endpoint.get('123')

        expect(item).toMatchObject(data)
        expect(item).toBeInstanceOf(Asset)
      })
    })

    describe('fetch', () => {
      it('should get a list of resources', async () => {
        const api = new Api(new URL('https://www.example.com/api'))
        const endpoint = api.endpoint('/assets', Asset)

        const data = {
          type: 'Asset',
          id: '123',
          assetType: 'foo',
          name: 'foo',
          alt: 'foo',
        } as const

        const mockHandleRequest = jest.fn(
          (): Promise<Result<any, never>> => {
            return new Promise((resolve) => {
              resolve(
                Result.accept({
                  data: [
                    {
                      type: data.type,
                      id: data.id,
                      attributes: {
                        assetType: data.assetType,
                        name: data.name,
                        alt: data.alt,
                      },
                    },
                  ],
                }),
              )
            })
          },
        )

        api.controller.handleRequest = mockHandleRequest

        const items = await endpoint.fetch()

        expect(items).toEqual(expect.arrayContaining([expect.objectContaining(data)]))
      })
    })

    describe('toString', () => {
      it('should return the endpoint path', () => {
        const api = new Api(new URL('https://www.example.com/api/'))
        const endpoint = api.endpoint('assets', Asset)

        expect(endpoint.toString()).toEqual('https://www.example.com/api/assets')
      })
    })

    describe('toURL', () => {
      it('should return the endpoint path as a URL', () => {
        const api = new Api(new URL('https://www.example.com/api/'))
        const endpoint = api.endpoint('assets', Asset)

        expect(endpoint.toURL().href).toEqual('https://www.example.com/api/assets')
      })
    })

    describe('createQuery', () => {
      it('should create a query', () => {
        const api = new Api(new URL('https://www.example.com/api/'))
        const endpoint = api.endpoint('assets', Asset)

        const query = endpoint.createQuery({})

        expect(query).toBeInstanceOf(ApiQuery)
      })
    })
  })
})
