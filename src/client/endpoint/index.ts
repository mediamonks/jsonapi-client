import { ResourceFieldFlag } from '../../enum'
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
import { createURL } from '../../util/url'
import { OneResource, ManyResource } from '../result'
import { Client } from '..'
import { EMPTY_OBJECT } from '../../util/constants'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter<any, any>> {
  readonly client: T
  readonly path: ResourcePath
  readonly formatter: U

  constructor(client: T, path: ResourcePath, formatter: U) {
    this.client = client
    this.path = path
    this.formatter = formatter
  }

  async create(data: ResourceCreateData<U>): Promise<OneResource<FilteredResource<U, {}>>> {
    const url = createURL(this.client.url, [this.path])
    const body = this.formatter.createResourcePostObject(data)
    return this.client
      .request(url, 'POST', body as any)
      .then((data) => this.formatter.decode(data!, EMPTY_OBJECT) as any)
  }

  async update(id: ResourceId, data: ResourcePatchData<U>): Promise<void> {
    const url = createURL(this.client.url, [this.path, id])
    const body = this.formatter.createResourcePatchObject(id, data)
    await this.client.request(url, 'PATCH', body as any)
  }

  async delete(id: ResourceId): Promise<void> {
    const url = createURL(this.client.url, [this.path, id])
    await this.client.request(url, 'DELETE')
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
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async removeRelationships<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.MaybePatch
    >
  >(
    id: ResourceId,
    fieldName: V,
    data: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'DELETE')
  }

  async updateRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    >
  >(id: ResourceId, fieldName: V, data: RelationshipPatchData<U['fields'][V]>): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async clearRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.MaybePatch
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', {})
  }

  async getOne<V extends ResourceFilter<U>>(
    id: ResourceId,
    resourceFilter?: V,
  ): Promise<OneResource<FilteredResource<U, V>>> {
    const url = createURL(this.client.url, [this.path, id], resourceFilter as any)
    return this.client
      .request(url)
      .then((data) => this.formatter.decode(data as any, resourceFilter as any) as any)
  }

  async getMany<V extends ResourceFilter<U>>(
    searchParams?: JSONAPISearchParams | null,
    resourceFilter?: V,
  ): Promise<ManyResource<FilteredResource<U, V>>> {
    const url = createURL(this.client.url, [this.path], resourceFilter as any, searchParams || {})
    return this.client
      .request(url)
      .then((data) => this.formatter.decode(data as any, resourceFilter as any) as any)
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
      [this.path, id, fieldName as string],
      resourceFilter as any,
    )

    return this.client
      .request(url)
      .then((data) => this.formatter.decode(data as any, resourceFilter as any) as any)
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
      [this.formatter.type, id, fieldName],
      resourceFilter as any,
      searchParams as any,
    )

    return this.client
      .request(url)
      .then((data) => this.formatter.decode(data as any, resourceFilter as any) as any)
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
