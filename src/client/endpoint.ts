import { ResourceFieldFlag } from '../data/enum'
import { ResourceFormatter, ResourceFormatterEvent } from '../formatter'
import {
  ResourcePath,
  ResourceCreateData,
  ResourcePatchData,
  ToManyRelationshipFieldNameWithFlag,
  RelationshipFieldResourceFormatter,
  ToOneRelationshipFieldNameWithFlag,
  ToManyRelationshipPatchData,
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
  ResourceFilterLimited,
  ManyResourceDocument,
  OneResourceDocument,
  ResourceFilter,
  ResourceFields,
} from '../types'
import { ResourceId, SearchParams } from '../types/jsonapi'
import { createURL } from '../util/url'
import { Client } from '../client'
import { EMPTY_ARRAY, EMPTY_OBJECT, JSONAPIRequestMethod } from '../data/constants'
import { decodeDocument } from '../formatter/decodeDocument'
import { encodeResourceCreateData } from '../formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from '../formatter/encodeResourcePatchData'
import { RelationshipField } from '../resource/field/relationship'
import { EventEmitter } from '../event/EventEmitter'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter> extends EventEmitter<
  ResourceFormatterEvent<ResourceFormatter<ResponseType, ResourceFields>>
> {
  readonly client: T
  readonly path: ResourcePath
  readonly formatter: U

  constructor(client: T, path: ResourcePath, formatter: U) {
    super()
    this.client = client
    this.path = path
    this.formatter = formatter

    getIncludedResourceFormatters(formatter).forEach((formatter) =>
      formatter.listen((event) => this.emit(event)),
    )
  }

  /**
   * Create a resource
   * @param data The data for the resource you want to create, resource id is optional
   */
  async create(values: ResourceCreateData<U>): Promise<OneResourceDocument<U, {}>> {
    const url = this.createURL()
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
    const url = this.createURL([body.data.id])
    await this.client.request(url, JSONAPIRequestMethod.Patch, body as any)
  }

  /**
   * Delete a resource by its id
   * @param id The id of the resource you want to be deleted
   */
  async delete(id: ResourceId): Promise<void> {
    const url = this.createURL([id])
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
      U,
      ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
    >
  >(id: ResourceId, fieldName: V, data: RelationshipPatchData<U['fields'][V]>): Promise<void> {
    const field = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = this.createURL([id, field.root, fieldPath])
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
      U,
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
    const field: RelationshipField<any, any, any> = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = this.createURL([id, field.root, fieldPath])
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
      U,
      ResourceFieldFlag.PostRequired | ResourceFieldFlag.PostOptional
    >
  >(
    id: ResourceId,
    fieldName: V,
    resourceIdentifiers: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    const field = this.formatter.getRelationshipField(fieldName)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = this.createURL([id, field.root, fieldPath])
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
      U,
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(
    id: ResourceId,
    fieldName: V,
    resourceIdentifiers: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    const field = this.formatter.getField(fieldName as any)
    const fieldPath = this.toRelationshipFieldPath(fieldName as any)
    const url = this.createURL([id, field.root, fieldPath])
    await this.client.request(url, JSONAPIRequestMethod.Delete, {
      data: resourceIdentifiers,
    })
  }

  async getOne<V extends ResourceFilterLimited<U>>(
    id: ResourceId,
    resourceFilter: V = EMPTY_OBJECT as V,
    searchParams?: SearchParams,
  ): Promise<OneResourceDocument<U, V>> {
    const url = this.createURL([id], resourceFilter as any, searchParams)
    const document = await this.client.request(url, JSONAPIRequestMethod.Get)
    return decodeDocument([this.formatter], document, resourceFilter) as any
  }

  async getMany<V extends ResourceFilterLimited<U>>(
    resourceFilter: V = EMPTY_OBJECT,
    searchParams?: SearchParams,
  ): Promise<ManyResourceDocument<U, V>> {
    const url = this.createURL([], resourceFilter as any, searchParams)
    const document = await this.client.request(url, JSONAPIRequestMethod.Get)
    return decodeDocument([this.formatter], document, resourceFilter) as any
  }

  getToOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
    searchParams?: SearchParams,
  ): Promise<OneResourceDocument<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    return this.toOne(fieldName, filter)(id, searchParams)
  }

  getToMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    id: ResourceId,
    fieldName: V,
    filter: W = EMPTY_OBJECT as W,
    searchParams?: SearchParams,
  ): Promise<ManyResourceDocument<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    return this.toMany(fieldName, filter)(id, searchParams)
  }

  one<V extends ResourceFilterLimited<U> = {}>(resourceFilter: V = EMPTY_OBJECT as V) {
    return async (
      id: ResourceId,
      searchParams?: SearchParams,
    ): Promise<OneResourceDocument<U, V>> => this.getOne(id, resourceFilter, searchParams)
  }

  many<V extends ResourceFilterLimited<U> = {}>(filter: V = EMPTY_OBJECT as V) {
    return async (searchParams?: SearchParams): Promise<ManyResourceDocument<U, V>> =>
      this.getMany(filter, searchParams)
  }

  toOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    fieldName: V,
    resourceFilter: W = EMPTY_OBJECT as W,
  ): (
    id: ResourceId,
    searchParams?: SearchParams,
  ) => Promise<OneResourceDocument<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    const fieldFormatters = this.formatter.getRelationshipField(fieldName as any).getFormatters()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId) => {
      const url = this.createURL([id, fieldPath], resourceFilter as any)
      const document = await this.client.request(url, JSONAPIRequestMethod.Get)
      return decodeDocument(fieldFormatters, document, resourceFilter) as any
    }
  }

  toMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilterLimited<RelationshipFieldResourceFormatter<U['fields'][V]>> = {}
  >(
    fieldName: V,
    resourceFilter: W = EMPTY_OBJECT as W,
  ): (
    id: ResourceId,
    searchParams?: SearchParams,
  ) => Promise<ManyResourceDocument<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    const fieldFormatters = this.formatter.getRelationshipField(fieldName as any).getFormatters()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId, searchParams?: SearchParams) => {
      const url = this.createURL([id, fieldPath], resourceFilter as any, searchParams as any)

      const document = await this.client.request(url, JSONAPIRequestMethod.Get)
      return decodeDocument(fieldFormatters, document, resourceFilter) as any
    }
  }

  protected toRelationshipFieldPath(fieldName: EndpointRelationshipFieldName<this>): string {
    return this.client.setup.transformRelationshipPath(fieldName, this.formatter)
  }

  createURL<V extends SearchParams = SearchParams>(
    path: ReadonlyArray<string> = EMPTY_ARRAY,
    resourceFilter: ResourceFilter<U> = EMPTY_OBJECT,
    searchParams?: V,
  ): URL {
    return createURL(this, path, resourceFilter as any, searchParams)
  }

  toString(): string {
    return this.createURL().href
  }
}

export type EndpointRelationshipFieldName<T extends Endpoint<any, any>> =
  | EndpointToManyFieldName<T>
  | EndpointToOneFieldName<T>

export type EndpointToManyFieldName<T extends Endpoint<any, any>> = T extends Endpoint<any, infer R>
  ? {
      [P in R['type']]: ToManyRelationshipFieldNameWithFlag<
        Extract<R, { type: P }>,
        ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
      >
    }[R['type']]
  : never

export type EndpointToOneFieldName<T extends Endpoint<any, any>> = T extends Endpoint<any, infer R>
  ? {
      [P in R['type']]: ToOneRelationshipFieldNameWithFlag<
        Extract<R, { type: P }>,
        ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
      >
    }[R['type']]
  : never

const getIncludedResourceFormatters = (
  formatter: ResourceFormatter,
  target: Array<ResourceFormatter> = [],
): ReadonlyArray<ResourceFormatter> => {
  if (!target.includes(formatter)) {
    target.push(formatter)

    getValues(formatter.fields)
      .filter((field): field is RelationshipField<any, any, any> => field.isRelationshipField())
      .flatMap((relationshipField) => relationshipField.getFormatters())
      .forEach((formatter) => {
        getIncludedResourceFormatters(formatter, target)
      })
  }

  return target
}

const getValues = Object.values as <T>(value: T) => Array<T[keyof T]>
