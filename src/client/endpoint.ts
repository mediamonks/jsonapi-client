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
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
  ToManyRelationshipFieldNameWithFlag,
  ToManyRelationshipPatchData,
  RelationshipFieldResourceConstructor,
  ToOneRelationshipFieldNameWithFlag,
  JSONAPISearchParams,
  JSONAPIDocument,
  JSONAPIMetaObject,
  JSONAPILinksObject,
  JSONAPIPaginationLinks,
} from '../types'
import { createURL } from '../util/url'
import { Client } from '../client'
import { EMPTY_OBJECT } from '../data/constants'
import { DOCUMENT_CONTEXT_STORE } from '../formatter/decodeDocument'
import { RESOURCE_CONTEXT_STORE } from '../formatter/decodeResourceObject'
import { ResourceIdentifier } from '../resource/identifier'

export class Endpoint<T extends Client<any>, U extends ResourceFormatter> {
  readonly client: T
  readonly path: ResourcePath
  readonly formatter: U

  constructor(client: T, path: ResourcePath, formatter: U) {
    this.client = client
    this.path = path
    this.formatter = formatter
  }

  async create(data: ResourceCreateData<U>): Promise<Resource<U, {}>> {
    const url = createURL(this.client.url, [this.path])
    const body = this.formatter.createResourcePostDocument(data)
    const document = await this.client.request(url, 'POST', body as any)
    if (document) {
      return this.formatter.decode(document) as Resource<U, {}>
    }
    // TODO: Strip body of GetForbidden fields

    return this.formatter.decode(body as JSONAPIDocument) as Resource<U, {}>
  }

  async update(data: ResourcePatchData<U>): Promise<void> {
    const body = this.formatter.createResourcePatchDocument(data)
    const url = createURL(this.client.url, [this.path, body.data.id])
    await this.client.request(url, 'PATCH', body as any)
  }

  async delete(id: ResourceId): Promise<void> {
    const url = createURL(this.client.url, [this.path, id])
    await this.client.request(url, 'DELETE')
  }

  async addRelationships<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PostRequired | ResourceFieldFlag.PostOptional
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
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
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
      ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PatchRequired
    >
  >(id: ResourceId, fieldName: V, data: RelationshipPatchData<U['fields'][V]>): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async clearRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
    const field = this.formatter.getField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', EMPTY_OBJECT)
  }

  async getOne<V extends ResourceFilter<U>>(
    id: ResourceId,
    resourceFilter: V = EMPTY_OBJECT,
  ): Promise<Resource<U, V>> {
    const url = createURL(this.client.url, [this.path, id], resourceFilter as any)
    const data = await this.client.request(url)
    return this.formatter.decode(data as JSONAPIDocument, resourceFilter) as Resource<U, V>
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
    return this.client
      .request(url)
      .then(
        (data) =>
          this.formatter.decode(data as JSONAPIDocument, resourceFilter as any) as Array<
            Resource<U, V>
          >,
      )
  }

  async getOneRelationship<
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
  ): Promise<Resource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>> {
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
      ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
    searchParams: JSONAPISearchParams | null = null,
  ): Promise<Array<Resource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>> {
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
      ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceFilter?: W) {
    return (id: ResourceId) => this.getOneRelationship(id, fieldName, resourceFilter)
  }

  toMany<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.GetOptional | ResourceFieldFlag.GetRequired
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceFilter?: W) {
    return (id: ResourceId, searchQuery: JSONAPISearchParams | null = null) =>
      this.getManyRelationship(id, fieldName, resourceFilter, searchQuery)
  }

  getResourceMeta(resource: ResourceIdentifier<U['type']>): JSONAPIMetaObject {
    return RESOURCE_CONTEXT_STORE.getMeta(resource)
  }

  getResourceLinks(resource: ResourceIdentifier<U['type']>): JSONAPILinksObject {
    return RESOURCE_CONTEXT_STORE.getLinks(resource) as any
  }

  getDocumentMeta(
    document: ResourceIdentifier<U['type']> | ReadonlyArray<ResourceIdentifier<U['type']>>,
  ): JSONAPIMetaObject {
    return DOCUMENT_CONTEXT_STORE.getMeta(document)
  }

  getOneDocumentLinks(
    document: ResourceIdentifier<U['type']> | ReadonlyArray<ResourceIdentifier<U['type']>>,
  ): JSONAPILinksObject {
    return DOCUMENT_CONTEXT_STORE.getLinks(document) as any
  }

  getManyDocumentLinks(
    document: ReadonlyArray<ResourceIdentifier<U['type']>>,
  ): JSONAPIPaginationLinks {
    return DOCUMENT_CONTEXT_STORE.getLinks(document) as any
  }

  hasNext(document: ReadonlyArray<ResourceIdentifier<U['type']>>) {
    return isString(this.getManyDocumentLinks(document).next)
  }

  // getNext() {}

  hasPrev(document: ReadonlyArray<ResourceIdentifier<U['type']>>) {
    return isString(this.getManyDocumentLinks(document).prev)
  }

  // getPrev() {}
}
