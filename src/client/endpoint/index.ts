import { ResourceFormatter } from '../../resource/formatter'
import {
  ResourcePath,
  ResourceId,
  ResourceFilter,
  FilteredResource,
  ResourceCreateData,
  ResourcePatchData,
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
  ToManyRelationshipFieldNameWithFlag,
  ToManyRelationshipPatchData,
  RelationshipFieldResourceConstructor,
  ToOneRelationshipFieldNameWithFlag,
  JSONAPISearchParams,
} from '../../types'
import { Client } from '..'
import { OneResource, ManyResource } from '../result'
import { createURL } from '../utils'
import { ResourceFieldFlag } from '../../resource/field'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter<any, any>> {
  readonly client: T
  readonly path: ResourcePath
  readonly resource: U

  constructor(client: T, path: ResourcePath, resource: U) {
    this.client = client
    this.path = path
    this.resource = resource
  }

  async create(data: ResourceCreateData<U>): Promise<OneResource<FilteredResource<U, {}>>> {
    console.log('Create', data)
    const url = createURL(this.client.url, [this.path])
    return this.client.request(url, 'POST', data).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async update(id: ResourceId, data: ResourcePatchData<U>): Promise<void> {
    console.log('Patch', data)
    const url = createURL(this.client.url, [this.path, id])
    await this.client.request(url, 'PATCH', data).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async delete(id: ResourceId): Promise<void> {
    console.log('Delete', id)
    const url = createURL(this.client.url, [this.path, id])
    await this.client.request(url, 'DELETE')
  }

  async updateRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    >
  >(id: ResourceId, fieldName: V, data: RelationshipPatchData<U['fields'][V]>): Promise<void> {
    console.log(`Update ${fieldName}`, data)
    const field = this.resource.fields[fieldName]
    const url = createURL(this.client.url, [this.resource.type, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async addRelationships<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePost
    >
  >(
    id: ResourceId,
    fieldName: V,
    data: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    console.log(`Add some ${fieldName}`, data)
    const field = this.resource.fields[fieldName]
    const url = createURL(this.client.url, [this.resource.type, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async deleteRelationships<
    U extends ResourceFormatter<any, any>,
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.MaybePatch
    >
  >(
    id: ResourceId,
    fieldName: string,
    data: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    console.log(`Delete some ${fieldName}`, data)
    const field = this.resource.fields[fieldName]
    const url = createURL(this.client.url, [this.resource.type, id, field.root, fieldName])
    await this.client.request(url, 'DELETE')
  }

  async getOne<V extends ResourceFilter<U>>(
    id: ResourceId,
    resourceFilter?: V,
  ): Promise<OneResource<FilteredResource<U, V>>> {
    const url = createURL(this.client.url, [this.resource.type, id], resourceFilter as any)
    return this.client.request(url, 'GET').then((data) => {
      if (data === null) {
        throw new TypeError(`Data must be a JSON:API Resource Document`)
      }
      const resource = this.resource.decode(data as any)
      return new OneResource(resource as any, data.meta ?? {}, {})
    })
  }

  async getMany<V extends ResourceFilter<U>>(
    searchParams: JSONAPISearchParams | null,
    resourceFilter?: V,
  ): Promise<ManyResource<FilteredResource<U, V>>> {
    const url = createURL(this.client.url, [this.path], resourceFilter as any, searchParams || {})

    return this.client.request(url, 'GET').then((data) => {
      if (data === null) {
        throw new TypeError(`Data must be a JSON:API Resource Document`)
      }
      const resource = this.resource.decode(data as any, resourceFilter as any)
      return new ManyResource(resource as any, data.meta ?? {}, {
        pagination: {},
      })
    })
  }

  async getOneRelationship<
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
  ): Promise<
    OneResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    const url = createURL(
      this.client.url,
      [this.resource.type, id, fieldName],
      resourceFilter as any,
    )

    return this.client.request(url, 'GET').then((data) => {
      if (data === null) {
        throw new TypeError(`Data must be a JSON:API Resource Document`)
      }
      const resource = this.resource.decode(data as any, resourceFilter as any)
      return new OneResource(resource as any, data.meta ?? {}, {})
    })
  }

  async getManyRelationship<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
    searchParams: JSONAPISearchParams | null = null,
  ): Promise<
    ManyResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    const url = createURL(
      this.client.url,
      [this.resource.type, id, fieldName],
      resourceFilter as any,
      searchParams as any,
    )

    return this.client.request(url, 'GET').then((data) => {
      if (data === null) {
        throw new TypeError(`Data must be a JSON:API Resource Document`)
      }
      const resource = this.resource.decode(data as any, resourceFilter as any)
      return new ManyResource(resource as any, data.meta ?? {}, {
        pagination: {
          first: null,
          prev: null,
          next: null,
          last: null,
        },
      })
    })
  }

  one<V extends ResourceFilter<U>>(resourceFilter?: V) {
    return (id: ResourceId) => this.getOne(id, resourceFilter)
  }

  many<V extends ResourceFilter<U>>(resourceFilter?: V) {
    return (searchParams: JSONAPISearchParams | null = null) =>
      this.getMany(searchParams, resourceFilter)
  }

  toOne<
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceFilter?: W) {
    return (id: ResourceId) => this.getOneRelationship(id, fieldName, resourceFilter)
  }

  toMany<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceFilter?: W) {
    return (id: ResourceId, searchQuery: JSONAPISearchParams | null = null) =>
      this.getManyRelationship(id, fieldName, resourceFilter, searchQuery)
  }
}
