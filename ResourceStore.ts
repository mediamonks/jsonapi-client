import {
  ApiResourceParameters,
  ApiEndpoint,
  ResourceId,
  AnyResource,
  ResourceConstructor,
  FilteredResource,
  ResourceType,
  ResourceToOneRelationshipFields,
  ResourceToOneRelationshipFieldsOfType,
  ResourceFieldName,
  ToOneRelationship,
  JSONAPIMeta,
  ApiQueryParameters,
  ResourceToManyRelationshipFields,
  ResourceToManyRelationshipFieldsOfType,
  ToManyRelationship,
} from './temp'
import { ValuesOf } from './src/types/util'
import { isUndefined } from 'util'
import { Photo } from './examples/next/resources/jsonapi-server/Photo'
import { Article } from './examples/next/resources/jsonapi-server/Article'
import { Person } from './examples/next/resources/jsonapi-server/Person'

export class ResourceStore<T extends Array<ApiEndpoint<any, any>>> {
  endpoints: T
  constructor(...endpoints: T) {
    this.endpoints = endpoints
  }

  entity<R extends T[number]['Resource'], P extends ApiResourceParameters<InstanceType<R>>>(
    Resource: R,
    ResourceFilter: new () => P,
  ): ResourceEntity<this, InstanceType<R>, P> {
    return new (ResourceEntity as any)(this, Resource, ResourceFilter)
  }

  collection<R extends T[number]['Resource'], P extends ApiResourceParameters<InstanceType<R>>>(
    Resource: R,
    ResourceFilter: new () => P,
  ): ResourceCollection<this, InstanceType<R>, P> {
    return new (ResourceCollection as any)(this, Resource, ResourceFilter)
  }

  getEndpointByType(type: ResourceType): this['endpoints'][number] {
    const endpoint = this.endpoints.find((endpoint) => endpoint.Resource.type === type)
    if (isUndefined(endpoint)) {
      throw new Error(`Endpoint for Resource of type "${type}" does not exist on ResourceStore.`)
    }
    return endpoint
  }
}

class ResourceState<
  S extends ResourceStore<ApiEndpoint<any, any>[]>,
  R extends AnyResource,
  P extends ApiResourceParameters<R>
> {
  store: S
  Resource: ResourceConstructor<R>
  ResourceFilter: new () => P
  error: Error | null = null
  meta: JSONAPIMeta | null = null

  constructor(store: S, Resource: ResourceConstructor<R>, ResourceFilter: new () => P) {
    this.store = store
    this.Resource = Resource
    this.ResourceFilter = ResourceFilter
  }
}

class ResourceEntity<
  S extends ResourceStore<ApiEndpoint<any, any>[]>,
  R extends AnyResource,
  P extends ApiResourceParameters<R>
> extends ResourceState<S, R, P> {
  data: FilteredResource<R, P> | null = null

  async load(id: ResourceId): Promise<void> {
    this.store
      .getEndpointByType(this.Resource.type)
      .get(id, this.ResourceFilter as any)
      .then((result) => {
        this.data = result.data as any
        this.meta = result.meta
      })
      .catch((error) => {
        this.error = error
        throw error
      })
  }

  async loadFrom<
    T extends AnyResource,
    N extends keyof ResourceToOneRelationshipFieldsOfType<T, R['type']>
  >(
    Resource: ResourceConstructor<ResourceWithToOneRelationshipTo<T, R>>,
    id: ResourceId,
    fieldName: N & ResourceFieldName,
  ): Promise<void> {
    return this.store
      .getEndpointByType(Resource.type)
      .getToOneRelationship(id, fieldName, this.ResourceFilter as any)
      .then((result) => {
        this.data = result.data as any
        this.meta = result.meta
      })
      .catch((error) => {
        this.error = error
        throw error
      })
  }

  // create a Resource
  async save() {}

  // update a Resource
  async edit() {}
}

class ResourceCollection<
  S extends ResourceStore<ApiEndpoint<any, any>[]>,
  R extends AnyResource,
  P extends ApiResourceParameters<R>
> extends ResourceState<S, R, P> {
  data: Array<FilteredResource<R, P>> = []

  async load(
    queryParameters: ApiQueryParameters<S['endpoints'][number]['client']> | null = null,
  ): Promise<void> {
    return this.store
      .getEndpointByType(this.Resource.type)
      .getCollection(queryParameters, this.ResourceFilter as any)
      .then((result) => {
        this.data = result.data as any
        this.meta = result.meta
      })
      .catch((error) => {
        this.error = error
        throw error
      })
  }

  async loadFrom<
    T extends AnyResource,
    N extends keyof ResourceToManyRelationshipFieldsOfType<T, R['type']>
  >(
    Resource: ResourceConstructor<ResourceWithToManyRelationshipTo<T, R>>,
    id: ResourceId,
    fieldName: N & ResourceFieldName,
    queryParameters: ApiQueryParameters<S['endpoints'][number]['client']> | null = null,
  ): Promise<void> {
    return this.store
      .getEndpointByType(Resource.type)
      .getToManyRelationship(id, fieldName, queryParameters, this.ResourceFilter as any)
      .then((result) => {
        this.data = result.data as any
        this.meta = result.meta
      })
      .catch((error) => {
        this.error = error
        throw error
      })
  }

  async loadMoreBefore() {}

  async loadMoreAfter() {}
}

type ResourceWithX = ResourceToOneRelationshipFieldsOfType<Photo, 'people'>

type ResourceWithToOneRelationshipTo<T extends AnyResource, R extends AnyResource> = ValuesOf<
  {
    [K in keyof T]: T[K] extends ToOneRelationship<R> ? T : never
  }
>

type ResourceWithToManyRelationshipTo<T extends AnyResource, R extends AnyResource> = ValuesOf<
  {
    [K in keyof T]: T[K] extends ToManyRelationship<R> ? T : never
  }
>
