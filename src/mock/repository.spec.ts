import { MockResource } from './repository'
import { Predicate, shape, isString, record, isAny } from 'isntnt'
import { repositoryA } from '../../test/repositories'

const isMockResourceLike: Predicate<MockResource<any>> = shape({
  id: isString,
  type: isString,
  data: record(isString, isAny),
  meta: record(isString, isAny),
})

type SuppressPrivateFieldError = any

describe('MockResourceRepository', () => {
  describe('#mocks', () => {
    it('is a MockResource array', () => {
      const { mocks } = repositoryA as SuppressPrivateFieldError
      expect(mocks).toBeInstanceOf(Array)
      expect(mocks.length).toBe(10)
      expect(mocks.every(isMockResourceLike)).toBe(true)
    })
  })

  describe('getOne', () => {
    it('returns a resource for a resource found by id', () => {
      const id = `0`
      const url = new URL(`http://example.com/api/path-a/${id}`)
      const resourceDocument = repositoryA.getOne(url, id)

      expect(resourceDocument?.links).toEqual({
        self: url.href,
      })

      expect(resourceDocument?.data).toEqual({
        type: 'a',
        id: '0',
        attributes: { requiredString: 'required-attribute', optionalString: null },
        relationships: {
          toOneB: {
            data: null,
            links: {
              self: 'http://example.com/api/path-a/0/toOneB',
              related: 'http://example.com/api/path-a/0/relationships/toOneB',
            },
          },
          toManyA: {
            data: [{ type: 'a', id: '0' }],
            links: {
              self: 'http://example.com/api/path-a/0/toManyA',
              related: 'http://example.com/api/path-a/0/relationships/toManyA',
            },
          },
        },
        links: {},
        meta: {},
      })
    })
  })

  describe('getMany', () => {})
})
