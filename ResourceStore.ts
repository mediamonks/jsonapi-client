import {
  ApiResourceParameters,
  ApiResourceParametersConstructor,
  ApiEndpoint,
  ResourceId,
  AnyResource,
  ResourceConstructor,
  FilteredResource,
  ResourceType,
  ResourceFieldName,
  ToOneRelationship,
  JSONAPIMeta,
  ApiQueryParameters,
  ResourceToManyRelationshipFieldsOfType,
  ResourceToOneRelationshipFieldsOfType,
  ToManyRelationship,
  ResourceIdentifier,
} from './temp'
import { ValuesOf } from './src/types/util'
import { isUndefined, isSome, isNone } from 'isntnt'
import { createEmptyObject } from './src/utils/data'

export class ResourceStoreCache<S extends ResourceStore<any>> {
  entities: Record<ResourceId, ResourceEntityData<any>> = createEmptyObject()
  collections: Record<string, any> = createEmptyObject()
  store: S
  type: ResourceType

  constructor(store: S, type: ResourceType) {
    this.store = store
    this.type = type
  }

  hasEntity(id: ResourceId): boolean {
    return isSome(this.entities[id])
  }

  addEntity(id: ResourceId, result: any): void {
    this.entities[id] = result
  }

  getEntity(id: ResourceId): any {
    return this.entities[id]
  }

  deleteEntity(id: ResourceId): void {
    delete this.entities[id]
  }
}

export class ResourceStore<T extends Array<ApiEndpoint<any, any>>> {
  endpoints: T
  resources: Record<ResourceType, ResourceStoreCache<this>>

  constructor(...endpoints: T) {
    this.endpoints = endpoints
    this.resources = endpoints.reduce(
      (resources, endpoint) => {
        resources[endpoint.Resource.type] = new ResourceStoreCache(this, endpoint.Resource.type)
        return resources
      },
      {} as Record<ResourceType, ResourceStoreCache<this>>,
    )
  }

  entity<R extends T[number]['Resource'], P extends ApiResourceParameters<InstanceType<R>>>(
    Resource: R,
    ResourceParameters: ApiResourceParametersConstructor<InstanceType<R>, P>,
  ): ResourceEntity<this, InstanceType<R>, P> {
    return new (ResourceEntity as any)(this, Resource, ResourceParameters)
  }

  collection<R extends T[number]['Resource'], P extends ApiResourceParameters<InstanceType<R>>>(
    Resource: R,
    ResourceParameters: ApiResourceParametersConstructor<InstanceType<R>, P>,
  ): ResourceCollection<this, InstanceType<R>, P> {
    return new (ResourceCollection as any)(this, Resource, ResourceParameters)
  }

  getResourceCacheByType(type: ResourceType) {
    const cache = this.resources[type]
    if (isNone(cache)) {
      throw new Error(`Cache for type ${type} does not exist on ResourceStore`)
    }
    return this.resources[type]
  }

  findResourceEntity(id: ResourceId, ResourceFilter: any) {
    return this.getResourceCacheByType(ResourceFilter.type).getEntity(id)
  }

  storeResourceEntity(result: any, id: ResourceId, ResourceFilter: any) {
    return this.getResourceCacheByType(ResourceFilter.type).addEntity(id, result)
  }

  findResourceCollection(queryParameters: any, ResourceFilter: any) {}

  storeResourceCollection(result: any, queryParameters: any, ResourceFilter: any) {}

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
  ResourceFilter: ApiResourceParametersConstructor<R, P>
  error: Error | null = null
  meta: JSONAPIMeta | null = null

  constructor(
    store: S,
    Resource: ResourceConstructor<R>,
    ResourceFilter: ApiResourceParametersConstructor<R, P>,
  ) {
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
  async create() {}

  // update a loaded Resource
  async update() {}

  // delete a loaded Resource
  async delete() {}
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

  async loadNext() {}

  async loadPrev() {}
}

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

class ResourceEntityData<R extends AnyResource> {
  time: number
  data: R
  includedResources: Record<string, Set<string>> = createEmptyObject()
  dependentResources: Record<string, Set<string>> = createEmptyObject()

  constructor(data: R) {
    this.time = Date.now()
    this.data = data
  }

  update(data: R) {
    this.time = Date.now()
    this.data = data
    this.updateDependentResources(data)
    this.updateIncludedResources(data)
  }

  updateIncludedResources(data: R) {
    Object.keys(this.includedResources).forEach((type) => {
      this.getIncludedRelationshipIdentifiersOfType(type).forEach((id) => {
        console.log('update included relationship', { type, id })
      })
    })
  }

  updateDependentResources(data: R) {
    Object.keys(this.dependentResources).forEach((type) => {
      this.getDependentRelationshipIdentifierOfType(type).forEach((id) => {
        console.log('update dependent relationship', { type, id })
      })
    })
  }

  getIncludedRelationshipIdentifiersOfType(type: ResourceType): Set<string> {
    return this.includedResources[type] || (this.includedResources[type] = new Set())
  }

  addIncludedRelationshipIdentifier(identifier: ResourceIdentifier<any>): void {
    this.getIncludedRelationshipIdentifiersOfType(identifier.type).add(identifier.id)
  }

  deleteIncludedRelationshipIdentifier(identifier: ResourceIdentifier<any>): void {
    this.getIncludedRelationshipIdentifiersOfType(identifier.type).delete(identifier.id)
  }

  getDependentRelationshipIdentifierOfType(type: ResourceType): Set<string> {
    return this.dependentResources[type] || (this.dependentResources[type] = new Set())
  }

  addDependentRelationshipIdentifier(identifier: ResourceIdentifier<any>) {
    this.getDependentRelationshipIdentifierOfType(identifier.type).add(identifier.id)
  }

  deleteDependentRelationshipIdentifier(identifier: ResourceIdentifier<any>) {
    this.getDependentRelationshipIdentifierOfType(identifier.type).delete(identifier.id)
  }

  get age(): number {
    return Date.now() - this.time
  }
}
