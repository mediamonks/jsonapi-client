import { isString } from 'isntnt'

import { ResourceFieldFlag } from '../data/enum'
import { ResourceFormatter } from '../formatter'
import {
  ResourcePath,
  ResourceId,
  ResourceFilter,
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
  ResourceIncludeQuery,
  ResourceFieldsQuery,
} from '../types'
import { createURL } from '../util/url'
import { Client } from '../client'
import { EMPTY_OBJECT, JSONAPIRequestMethod } from '../data/constants'
import { decodeDocument } from '../formatter/decodeDocument'
import { parseResourceFilter } from '../formatter/parseResourceFilter'
import { encodeResourceCreateData } from '../formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from '../formatter/encodeResourcePatchData'
import { RelationshipField } from '../resource/field/relationship'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter> {
  readonly client: T
  readonly path: ResourcePath
  readonly formatter: U

  constructor(client: T, path: ResourcePath, formatter: U) {
    this.client = client
    this.path = path
    this.formatter = formatter
  }

  createQuery<V extends ResourceFieldsQuery<U>, W extends ResourceIncludeQuery<U> | null = null>(
    fields: V,
    include: W = null as W,
  ): { fields: V; include: W } {
    return parseResourceFilter([this.formatter], { fields, include } as any)
  }

  /**
   * Create a resource
   * @param data The data for the resource you want to create, resource id is optional
   */
  async create(data: ResourceCreateData<U>): Promise<Resource<U, {}>> {
    const url = createURL(this.client.url, [this.path])
    const body = encodeResourceCreateData([this.formatter], data)
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

  async getOne<V extends ResourceFilter<U>>(
    id: ResourceId,
    resourceFilter: V = EMPTY_OBJECT,
  ): Promise<Resource<U, V>> {
    const url = createURL(this.client.url, [this.path, id], resourceFilter as any)
    const document = await this.client.request(url, JSONAPIRequestMethod.Get)

    return decodeDocument([this.formatter], document, resourceFilter as any) as Resource<U, V>
  }

  async getMany<V extends ResourceFilter<U>>(
    searchParams: JSONAPISearchParams | null = null,
    resourceFilter: V = EMPTY_OBJECT,
  ): Promise<Array<Resource<U, V>>> {
    const url = createURL(
      this.client.url,
      [this.path],
      resourceFilter as ResourceFilter<any>,
      searchParams || EMPTY_OBJECT,
    )

    const document = await this.client.request(url, JSONAPIRequestMethod.Get)

    return decodeDocument([this.formatter], document, resourceFilter as any) as Array<
      Resource<U, V>
    >
  }

  getToOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
  ): Promise<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    return this.toOne(fieldName, resourceFilter)(id)
  }

  getToMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
    searchParams: JSONAPISearchParams | null = null,
  ): Promise<ReadonlyArray<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> {
    return this.toMany(fieldName, resourceFilter)(id, searchParams)
  }

  one<V extends ResourceFilter<U>>(resourceFilter?: V) {
    return async (id: ResourceId): Promise<Resource<U, V>> => this.getOne(id, resourceFilter)
  }

  many<V extends ResourceFilter<U>>(resourceFilter?: V) {
    return async (
      searchParams: JSONAPISearchParams | null = null,
    ): Promise<Array<Resource<U, V>>> => this.getMany(searchParams, resourceFilter)
  }

  toOne<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    fieldName: V,
    resourceFilter?: W,
  ): (id: ResourceId) => Promise<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    const fieldFormatter = this.formatter.getRelationshipField(fieldName as any).getFormatter()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId) => {
      const url = createURL(this.client.url, [this.path, id, fieldPath], resourceFilter as any)
      const document = await this.client.request(url, JSONAPIRequestMethod.Get)

      return decodeDocument([fieldFormatter], document, resourceFilter as any) as any
    }
  }

  toMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    fieldName: V,
    resourceFilter?: W,
  ): (
    id: ResourceId,
    searchParams: JSONAPISearchParams | null,
  ) => Promise<ReadonlyArray<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> {
    const fieldFormatter = this.formatter.getRelationshipField(fieldName as any).getFormatter()
    const fieldPath = this.toRelationshipFieldPath(fieldName)

    return async (id: ResourceId, searchParams: JSONAPISearchParams | null = null) => {
      const url = createURL(
        this.client.url,
        [this.path, id, fieldPath],
        resourceFilter as any,
        searchParams as any,
      )

      const document = await this.client.request(url, JSONAPIRequestMethod.Get)

      return decodeDocument([fieldFormatter], document, resourceFilter as any) as any
    }
  }

  // getResourceMeta(resource: ResourceIdentifier<U['type']>): JSONAPIMetaObject {
  //   return RESOURCE_CONTEXT_STORE.getMeta(resource)
  // }

  // getResourceLinks(resource: ResourceIdentifier<U['type']>): JSONAPILinksObject {
  //   return RESOURCE_CONTEXT_STORE.getLinks(resource) as any
  // }

  // getDocumentMeta(
  //   document: ResourceIdentifier<U['type']> | ReadonlyArray<ResourceIdentifier<U['type']>>,
  // ): JSONAPIMetaObject {
  //   return DOCUMENT_CONTEXT_STORE.getMeta(document)
  // }

  // getOneDocumentLinks(
  //   document: ResourceIdentifier<U['type']> | ReadonlyArray<ResourceIdentifier<U['type']>>,
  // ): JSONAPILinksObject {
  //   return DOCUMENT_CONTEXT_STORE.getLinks(document) as any
  // }

  // getManyDocumentLinks(
  //   document: ReadonlyArray<ResourceIdentifier<U['type']>>,
  // ): JSONAPIPaginationLinks {
  //   return DOCUMENT_CONTEXT_STORE.getLinks(document) as any
  // }

  // hasNext(document: ReadonlyArray<ResourceIdentifier<U['type']>>) {
  //   return isString(this.getManyDocumentLinks(document).next)
  // }

  // getNext() {}

  // hasPrev(document: ReadonlyArray<ResourceIdentifier<U['type']>>) {
  //   return isString(this.getManyDocumentLinks(document).prev)
  // }

  // getPrev() {}

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
