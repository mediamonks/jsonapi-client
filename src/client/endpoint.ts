import { ResourceFieldFlag } from '../data/enum'
import { ResourceFormatter } from '../formatter'
import {
  ResourcePath,
  ResourceId,
  Resource,
  ResourceCreateData,
  ResourcePatchData,
  ToManyRelationshipFieldNameWithFlag,
  RelationshipFieldResourceFormatter,
  ToOneRelationshipFieldNameWithFlag,
  JSONAPISearchParams,
  ToManyRelationshipPatchData,
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
  ResourceFilterLimited,
  JSONAPIMetaObject,
  WithMeta,
} from '../types'
import { createURL } from '../util/url'
import { Client } from '../client'
import { EMPTY_OBJECT, JSONAPIRequestMethod } from '../data/constants'
import { decodeDocument } from '../formatter/decodeDocument'
import { encodeResourceCreateData } from '../formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from '../formatter/encodeResourcePatchData'
import { RelationshipField } from '../resource/field/relationship'
import { DecodeEvent, EventEmitter } from '../event/EventEmitter'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter> extends EventEmitter<
  DecodeEvent<U>
> {
  private readonly meta = new WeakMap<object, JSONAPIMetaObject | null>()
  private readonly links = new WeakMap<object, JSONAPIMetaObject | null>()

  readonly client: T
  readonly path: ResourcePath
  readonly formatter: U

  constructor(client: T, path: ResourcePath, formatter: U) {
    super()
    this.client = client
    this.path = path
    this.formatter = formatter
  }

  /**
   * Create a resource
   * @param data The data for the resource you want to create, resource id is optional
   */
  async create(values: ResourceCreateData<U>): Promise<WithMeta<Resource<U, {}>>> {
    const url = createURL(this.client.url, [this.path])
    const body = encodeResourceCreateData([this.formatter], values)
    const document = await this.client.request(url, JSONAPIRequestMethod.Post, body)

    if (!document) {
      // Retrieved response with 204 status, see https://jsonapi.org/format/#crud-creating-responses-204
      // TODO: Should filter out all non-readable fields to prevent parse errors
      // TODO: Should throw custom error message if a 204 returns non-200 data (an id, or missing non-writable fields)
      console.info('Retrieved 204 response, data formatting might break')
    }

    return decodeDocument([this.formatter], document || (body as any)) as any
  }

  /**
   * Update a resource
   * @param data The data for the resource you want to update, resource id is required
   */
  async update(data: ResourcePatchData<U>): Promise<void> {
    const body = encodeResourcePatchData([this.formatter], data)
    const url = createURL(this.client.url, [this.path, body.data.id])
    await this.client.request(url, JSONAPIRequestMethod.Patch, body as any)
  }

  /**
   * Delete a resource by its id
   * @param id The id of the resource you want to be deleted
   */
  async delete(id: ResourceId): Promise<void> {
    const url = createURL(this.client.url, [this.path, id])
    await this.client.request(url, JSONAPIRequestMethod.Delete)
  }

  /**
   * Update a resource relationship
   * @param id The id of the resource you want to modify the relationship field of
   * @param fieldName the name of the relationship field you want to update
   * @param data the resource identifier(s) you want to set to the relationship field
   */
  async updateRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
    >
  >(id: ResourceId, fieldName: V, data: RelationshipPatchData<U['fields'][V]>): Promise<void> {
    const field = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldPath])
    // TODO: Validate data before request
    await this.client.request(url, JSONAPIRequestMethod.Patch, { data })
  }

  /**
   * Clear a resource relationship, alias for `updateRelationship` with empty data
   * @param id The id of the resource you want to modify the relationship field of
   * @param fieldName the name of the relationship field you want to clear
   */
  async clearRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
    const field: RelationshipField<any, any, any> = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldPath])
    await this.client.request(url, JSONAPIRequestMethod.Patch, {
      data: field.isToManyRelationshipField() ? [] : null,
    })
  }

  /**
   * Add members to a to-many relationship: https://jsonapi.org/format/#crud-updating-to-many-relationships (see POST request)
   * @param id The id of the resource you want to modify
   * @param fieldName the name of to-many relationship field you want to add members to
   * @param resourceIdentifiers the resource identifiers of the members you want to add
   */
  async addToManyRelationshipMembers<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PostRequired | ResourceFieldFlag.PostOptional
    >
  >(
    id: ResourceId,
    fieldName: V,
    resourceIdentifiers: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    const field = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldPath])
    await this.client.request(url, JSONAPIRequestMethod.Post, { data: resourceIdentifiers })
  }

  /**
   * Remove members from a to-many relationship: : https://jsonapi.org/format/#crud-updating-to-many-relationships (see DELETE request)
   * @param id The id of the resource you want to modify
   * @param fieldName the name of to-many relationship field you want to remove members from
   * @param resourceIdentifiers the resource identifiers of the members you want to remove
   */
  async removeToManyRelationshipMembers<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(
    id: ResourceId,
    fieldName: V,
    resourceIdentifiers: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldPath])
    await this.client.request(url, JSONAPIRequestMethod.Delete, {
      data: resourceIdentifiers,
    })
  }

  async getOne<V extends ResourceFilterLimited<U>>(
    id: ResourceId,
    filter: V = EMPTY_OBJECT as V,
  ): Promise<WithMeta<Resource<U, V>>> {
    const url = createURL(this.client.url, [this.path, id], filter as any)
    const document = await this.client.request(url, JSONAPIRequestMethod.Get)
    return decodeDocument([this.formatter], document, filter) as any
  }

  async getMany<V extends ResourceFilterLimited<U>>(
    searchParams: JSONAPISearchParams | null = null,
    filter: V = EMPTY_OBJECT,
  ): Promise<WithMeta<ReadonlyArray<Resource<U, V>>>> {
    const url = createURL(this.client.url, [this.path], filter as any, searchParams || EMPTY_OBJECT)
    const document = await this.client.request(url, JSONAPIRequestMethod.Get)
    return decodeDocument([this.formatter], document, filter) as any
  }

  getToOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
  ): Promise<WithMeta<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> {
    return this.toOne(fieldName, filter)(id)
  }

  getToMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    id: ResourceId,
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
    searchParams: JSONAPISearchParams | null = null,
  ): Promise<
    WithMeta<ReadonlyArray<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>>
  > {
    return this.toMany(fieldName, filter)(id, searchParams)
  }

  one<V extends ResourceFilterLimited<U> = {}>(filter: V = EMPTY_OBJECT as V) {
    return async (id: ResourceId): Promise<Resource<U, V>> => this.getOne(id, filter)
  }

  many<V extends ResourceFilterLimited<U> = {}>(filter: V = EMPTY_OBJECT as V) {
    return async (
      searchParams: JSONAPISearchParams | null = null,
    ): Promise<ReadonlyArray<Resource<U, V>>> => this.getMany(searchParams, filter)
  }

  toOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
  ): (
    id: ResourceId,
  ) => Promise<WithMeta<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> {
    const fieldFormatters = this.formatter.getRelationshipField(fieldName as any).getFormatters()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId) => {
      const url = createURL(this.client.url, [this.path, id, fieldPath], filter as any)
      const document = await this.client.request(url, JSONAPIRequestMethod.Get)
      return decodeDocument(fieldFormatters, document, filter) as any
    }
  }

  toMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
  ): (
    id: ResourceId,
    searchParams: JSONAPISearchParams | null,
  ) => Promise<
    WithMeta<ReadonlyArray<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>>
  > {
    const fieldFormatters = this.formatter.getRelationshipField(fieldName as any).getFormatters()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId, searchParams: JSONAPISearchParams | null = null) => {
      const url = createURL(
        this.client.url,
        [this.path, id, fieldPath],
        filter as any,
        searchParams as any,
      )

      const document = await this.client.request(url, JSONAPIRequestMethod.Get)
      return decodeDocument(fieldFormatters, document, filter) as any
    }
  }

  private toRelationshipFieldPath(fieldName: EndpointRelationshipFieldName<this>): string {
    return this.client.setup.transformRelationshipPath(fieldName, this.formatter)
  }

  toString(): string {
    return createURL(this.client.url, [this.path]).href
  }
}

type EndpointRelationshipFieldName<T extends Endpoint<any, any>> =
  | EndpointToManyFieldName<T>
  | EndpointToOneFieldName<T>

type EndpointToManyFieldName<T extends Endpoint<any, any>> = T extends Endpoint<any, infer R>
  ? {
      [P in R['type']]: ToManyRelationshipFieldNameWithFlag<
        Extract<R, { type: P }>['fields'],
        ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
      >
    }[R['type']]
  : never

type EndpointToOneFieldName<T extends Endpoint<any, any>> = T extends Endpoint<any, infer R>
  ? {
      [P in R['type']]: ToOneRelationshipFieldNameWithFlag<
        Extract<R, { type: P }>['fields'],
        ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
      >
    }[R['type']]
  : never
