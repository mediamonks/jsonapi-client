import { ResourceFormatter } from '../formatter'
import { ResourceIdentifier } from '../resource/identifier'
import { RelationshipFieldType, ResourceFieldFlag } from '../data/enum'
import { RelationshipField } from '../resource/field/relationship'
import { AttributeField } from '../resource/field/attribute'
import { MetaObject, ResourceObject } from '../types/jsonapi'
import { reflect } from '../util/helpers'
import { ManyResourceDocument, OneResourceDocument, ResourceFields } from '../types'
import { doc } from 'prettier'

export type MockResource<
  T extends ResourceFormatter,
  U extends MetaObject = {}
> = ResourceIdentifier<T['type']> & {
  data: {
    [P in keyof T['fields']]: T['fields'][P] extends RelationshipField<infer R, infer S, any>
      ? S extends RelationshipFieldType.ToOne
        ? ResourceMockToOneRelationship<R>
        : S extends RelationshipFieldType.ToMany
        ? ResourceMockToManyRelationship<R>
        : never
      : T['fields'][P] extends AttributeField<infer R, any, infer S>
      ? S extends ResourceFieldFlag.GetOptional
        ? R | null
        : R
      : never
  }
  meta: U
}

export type ResourceMockToOneRelationship<T extends ResourceFormatter> = (
  url: URL,
  included: Array<ResourceObject>,
) => ResourceObject<T> | null

export type ResourceMockToManyRelationship<T extends ResourceFormatter> = (
  url: URL,
  included: Array<ResourceObject>,
) => Array<ResourceObject<T>>

export type FilterToManyRelationship<T extends ResourceFormatter> = (
  resources: Array<ResourceObject<T>>,
) => Array<ResourceObject<T>>

export type FindToOneRelationship<T extends ResourceFormatter> = (
  resources: ReadonlyArray<ResourceObject<T>>,
) => ResourceObject<T> | null

export type MockResourceRepositorySetup<T extends ResourceFormatter> = {
  createMockResource: (index: number) => MockResource<T>
  filterManyRequest?: (url: URL, repository: MockResourceRepository<T>) => Array<MockResource<T>>
  amount?: number
}

export class MockResourceRepository<T extends ResourceFormatter> {
  private mocks: Array<MockResource<T>>

  path: string
  formatter: T
  setup: MockResourceRepositorySetup<T>

  constructor(path: string, formatter: T, setup: MockResourceRepositorySetup<T>) {
    this.path = path
    this.formatter = formatter
    this.setup = setup
    this.mocks = arrayOfLength(setup.amount || 100, (index) => setup.createMockResource(index))
  }

  getMany(url: URL): ManyResourceDocument<T, {}> {
    const { filterManyRequest } = this.setup
    const mockData = filterManyRequest ? filterManyRequest(url, this) : this.mocks
    return this.resolveOfManyMockDocument(url, mockData)
  }

  getOne(url: URL, id: string): OneResourceDocument<T, any> {
    const mockResource = this.mocks.find((item) => item.id === id)
    if (!mockResource) {
      throw new ReferenceError(`Mock Resource Not Found`)
    }
    return this.resolveOfOneMockDocument(url, mockResource)
  }

  static toMany<T extends ResourceFormatter>(
    getRepository: () => MockResourceRepository<T>,
    filterResources?: FilterToManyRelationship<T>,
  ) {
    return (url: URL, included: Array<ResourceObject>): Array<ResourceObject> => {
      const repository = getRepository()
      const resources = repository.mocks.map((item) =>
        repository.resolveMockResource(url, item, included),
      )
      return filterResources ? filterResources(resources) : resources
    }
  }

  static toOne<T extends ResourceFormatter>(
    getRepository: () => MockResourceRepository<T>,
    findResource: FindToOneRelationship<T> = (resources) => resources[0] || null,
  ) {
    return (url: URL, included: Array<ResourceObject>): ResourceObject | null => {
      const repository = getRepository()
      return findResource(
        repository.mocks.map((item) => repository.resolveMockResource(url, item, included)),
      )
    }
  }

  private resolveOfManyMockDocument<T extends ResourceFormatter>(
    url: URL,
    mockData: Array<MockResource<T>>,
  ): ManyResourceDocument<T, {}> {
    const included: Array<ResourceObject> = []
    const data = mockData.map((item: MockResource<T>) =>
      this.resolveMockResource(url, item, included),
    )
    return {
      data: mockData.map((item: MockResource<T>) => this.resolveMockResource(url, item, included)),
      included: included.filter((resource) => !data.includes(resource)),
      links: {
        self: url.href,
      },
    } as any
  }

  private resolveOfOneMockDocument<T extends ResourceFormatter>(
    url: URL,
    mockData: MockResource<T> | ReadonlyArray<MockResource<T>>,
  ): OneResourceDocument<T, any> {
    const included: Array<ResourceObject> = []
    const data = this.resolveMockResource(url, mockData as any, included)
    return {
      data,
      included: included.filter((resource) => data !== resource),
      links: {
        self: url.href,
      },
    } as any
  }

  private resolveMockResource<T extends ResourceFormatter>(
    url: URL,
    mock: MockResource<T>,
    included: Array<ResourceObject>,
  ): ResourceObject<T> {
    const includedResource = included.find((item) => item.type === mock.type && item.id === mock.id)
    if (includedResource) {
      return includedResource
    }

    const resource: ResourceObject<T> = {
      type: mock.type,
      id: mock.id,
      attributes: {},
      relationships: {},
      links: {},
    }

    if (mock.meta) resource.meta = mock.meta
    included.push(resource)

    return Object.keys(this.formatter.fields).reduce((resource, fieldName) => {
      const field: ResourceFields[any] = this.formatter.getField(fieldName as any)
      const value = mock.data[fieldName]
      if (field.isAttributeField()) {
        ;(resource.attributes as any)[fieldName] = value
      } else if (field.isRelationshipField()) {
        if (typeof value === 'function') {
          const resolvedValue = value(url, included)
          ;(resource.relationships as any)[fieldName] = {
            data: Array.isArray(resolvedValue)
              ? resolvedValue.map((item) => new ResourceIdentifier(item.type, item.id))
              : resolvedValue !== null
              ? new ResourceIdentifier(resolvedValue.type, resolvedValue.id)
              : resolvedValue,
            links: {
              self: `${url.origin}${url.pathname}/${fieldName}`,
              related: `${url.origin}${url.pathname}/relationships/${fieldName}`,
            },
          }
        }
      }
      return resource
    }, resource)
  }
}

// Util
const arrayOfLength = <T = number>(
  length: number,
  transform: (index: number) => T = reflect as any,
): Array<T> => Array.from({ length }, (_, index) => transform(index))
