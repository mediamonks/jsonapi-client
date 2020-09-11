import { formatterA, formatterB } from '../../test/formatters'
import { MockResourceRepository, MockResource } from './repository'
import { Predicate, shape, isString, record, isAny } from 'isntnt'

type MockA = MockResource<typeof formatterA>

type X = MockA['data']['toManyRelationship']

const isMockResourceLike: Predicate<MockResource<any>> = shape({
  id: isString,
  type: isString,
  data: record(isString, isAny),
  meta: record(isString, isAny),
})

const repositoryA: MockResourceRepository<typeof formatterA> = new MockResourceRepository(
  'path-a',
  formatterA,
  {
    amount: 10,
    createMockResource(index: number): MockA {
      return {
        type: 'a',
        id: String(index),
        data: {
          requiredAttribute: 'required-attribute',
          optionalAttribute: null,
          toOneRelationship: () => null,
          toManyRelationship: MockResourceRepository.toMany(
            () => repositoryB,
            (resources) => resources.slice(0, 1),
          ),
        },
        meta: {},
      }
    },
  },
)

type MockB = MockResource<typeof formatterB>

const repositoryB = new MockResourceRepository('path-b', formatterB, {
  createMockResource(id: number): MockB {
    return {
      type: 'b',
      id: String(id),
      data: {
        foo: 'bar',
      },
      meta: {},
    }
  },
})

type SuppressPrivateFieldError = any

describe('MockResourceRepository', () => {
  describe('#mocks', () => {
    it('is a MockResource[]', () => {
      const { mocks } = repositoryA as SuppressPrivateFieldError
      expect(mocks).toBeInstanceOf(Array)
      expect(mocks.length).toBe(10)
      expect(mocks.every(isMockResourceLike)).toBe(true)
    })
  })

  describe('getOne', () => {
    it('returns null for a resource not found', () => {
      const id = `NON_EXISTING_ID`
      const url = new URL(`http://example.com/api/path-a/${id}`)
      const x = repositoryA.getOne(url, id)

      expect(x).toBe(null)
    })

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
        attributes: { requiredAttribute: 'required-attribute', optionalAttribute: null },
        relationships: {
          toOneRelationship: {
            data: null,
            links: {
              self: 'http://example.com/api/path-a/0/toOneRelationship',
              related: 'http://example.com/api/path-a/0/relationships/toOneRelationship',
            },
          },
          toManyRelationship: {
            data: [{ type: 'b', id: '0' }],
            links: {
              self: 'http://example.com/api/path-a/0/toManyRelationship',
              related: 'http://example.com/api/path-a/0/relationships/toManyRelationship',
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
