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
  ToOneRelationship,
  JSONAPIMeta,
  ApiQueryParameters,
} from './temp'
import { ValuesOf } from './src/types/util'

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
    return endpoint!
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
  errors: Array<Error> = []
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
        console.error(error)
        throw new Error(`Failed to load resource`)
      })
  }

  async loadFrom<T extends AnyResource, N extends keyof ResourceToOneRelationshipFields<T>>(
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
        console.error(error)
        throw new Error(`Failed to load resource`)
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
    this.store
      .getEndpointByType(this.Resource.type)
      .getCollection(queryParameters, this.ResourceFilter as any)
      .then((result) => {
        this.data = result.data as any
        this.meta = result.meta
      })
      .catch((error) => {
        console.error(error)
        throw new Error(`Failed to load resource`)
      })
  }

  async loadFrom<T extends AnyResource, N extends keyof ResourceToOneRelationshipFields<T>>(
    Resource: ResourceConstructor<ResourceWithToOneRelationshipTo<T, R>>,
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
        console.error(error)
        throw new Error(`Failed to load resource`)
      })
  }

  async loadMoreBefore() {}

  async loadMoreAfter() {}
}

type ResourceWithToOneRelationshipTo<T extends AnyResource, R extends AnyResource> = ValuesOf<
  {
    [K in keyof T]: T[K] extends ToOneRelationship<R> ? T : never
  }
>
