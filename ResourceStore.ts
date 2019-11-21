import {
  ApiResourceParameters,
  ApiEndpoint,
  ResourceId,
  AnyResource,
  ResourceConstructor,
  FilteredResource,
  ResourceType,
  ResourceToOneRelationshipFields,
  ResourceFieldName,
} from './temp'
import { ValuesOf, WithoutNever } from './src/types/util'
import { Person } from './examples/next/resources/jsonapi-server/Person'
import { Article } from './examples/next/resources/jsonapi-server/Article'

export class ResourceStore<T extends Array<ApiEndpoint<any, any>>> {
  endpoints: T
  constructor(...endpoints: T) {
    this.endpoints = endpoints
  }

  entity<R extends AnyResource, P extends ApiResourceParameters<R>>(
    Resource: ResourceConstructor<R>,
    filter: new () => P,
  ): ResourceEntity<this, R, P> {
    return new (ResourceEntity as any)(this, Resource, filter)
  }

  getEndpointByType(type: ResourceType): this['endpoints'][number] {
    const endpoint = this.endpoints.find((endpoint) => endpoint.Resource.type === type)
    return endpoint!
  }
}

class ResourceEntity<
  S extends ResourceStore<ApiEndpoint<any, any>[]>,
  R extends AnyResource,
  P extends ApiResourceParameters<R>
> {
  store: S
  Resource: ResourceConstructor<R>
  filter: P
  value: FilteredResource<R, P> | null = null

  constructor(store: S, Resource: ResourceConstructor<R>, filter: P) {
    this.store = store
    this.Resource = Resource
    this.filter = filter
  }

  async load(id: ResourceId): Promise<void> {
    this.store
      .getEndpointByType(this.Resource.type)
      .get(id, this.filter as any)
      .then((result) => {
        this.value = result.data as any
      })
      .catch((error) => {
        console.error(error)
        throw new Error(`Failed to load resource`)
      })
  }

  async loadFrom<X extends AnyResource, N extends keyof ResourceToOneRelationshipFields<X>>(
    Resource: ResourceConstructor<BaseResourceWithToOneRelationshipTo<X, R>>,
    id: ResourceId,
    fieldName: N & ResourceFieldName,
  ): Promise<void> {
    return this.store
      .getEndpointByType(Resource.type)
      .getToOneRelationship(id, fieldName, this.filter as any)
      .then((result) => {
        this.value = result.data as any
      })
      .catch((error) => {
        console.error(error)
        throw new Error(`Failed to load resource`)
      })
  }
}

type BaseResourceWithToOneRelationshipTo<T, R> = ValuesOf<
  {
    [K in keyof T]: T[K] extends R | null ? T : never
  }
>

type Oi = BaseResourceWithToOneRelationshipTo<Article, Person>
