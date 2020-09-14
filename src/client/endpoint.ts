import { isString } from 'isntnt'

import { ResourceFieldFlag, RelationshipFieldType } from '../data/enum'
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
  JSONAPIDocument,
  JSONAPIMetaObject,
  JSONAPILinksObject,
  JSONAPIPaginationLinks,
  ToManyRelationshipPatchData,
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
} from '../types'
import { createURL } from '../util/url'
import { Client } from '../client'
import { EMPTY_OBJECT } from '../data/constants'
import { DOCUMENT_CONTEXT_STORE, decodeDocument } from '../formatter/decodeDocument'
import { RESOURCE_CONTEXT_STORE } from '../formatter/decodeResourceObject'
import { ResourceIdentifier } from '../resource/identifier'
import { parseResourceFilter } from '../formatter/parseResourceFilter'
import { encodeResourceCreateData } from '../formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from '../formatter/encodeResourcePatchData'

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
    const body = encodeResourceCreateData([this.formatter], data)
    const document = await this.client.request(url, 'POST', body as any)
    return decodeDocument([this.formatter], document || (body as any)) as Resource<U, {}>
  }

  async update(data: ResourcePatchData<U>): Promise<void> {
    const body = encodeResourcePatchData([this.formatter], data)
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
    const field = this.formatter.getRelationshipField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async removeRelationships<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
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
    const field = this.formatter.getRelationshipField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', data as any)
  }

  async clearRelationship<
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PatchOptional
    >
  >(id: ResourceId, fieldName: V): Promise<void> {
    const field = this.formatter.getRelationshipField(fieldName)
    const url = createURL(this.client.url, [this.path, id, field.root, fieldName])
    await this.client.request(url, 'PATCH', EMPTY_OBJECT)
  }

  filter<V extends ResourceFilter<U>>(resourceFilter: V): V {
    return parseResourceFilter([this.formatter], resourceFilter as any)
  }

  async getOne<V extends ResourceFilter<U>>(
    id: ResourceId,
    resourceFilter: V = EMPTY_OBJECT,
  ): Promise<Resource<U, V>> {
    const url = createURL(this.client.url, [this.path, id], resourceFilter as any)
    const data = await this.client.request(url)
    return decodeDocument(
      [this.formatter],
      data as JSONAPIDocument,
      resourceFilter as any,
    ) as Resource<U, V>
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
    const data = await this.client.request(url)
    return decodeDocument(
      [this.formatter],
      data as JSONAPIDocument,
      resourceFilter as any,
    ) as Array<Resource<U, V>>
  }

  async getOneRelationship<
    V extends EndpointToOneFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
  ): Promise<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> {
    return this.toOne(fieldName, resourceFilter)(id)
  }

  async getManyRelationship<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceFilter?: W,
    searchParams: JSONAPISearchParams | null = null,
  ): Promise<Array<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> {
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
  >(fieldName: V, resourceFilter?: W) {
    const fieldFormatter = this.formatter.getRelationshipField(fieldName as any).getFormatter()
    return async (
      id: ResourceId,
    ): Promise<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>> => {
      const url = createURL(
        this.client.url,
        [this.path, id, this.client.setup.transformRelationshipPath(fieldName)],
        resourceFilter as any,
      )

      const data = await this.client.request(url)
      return decodeDocument([fieldFormatter], data as JSONAPIDocument, resourceFilter as any) as any
    }
  }

  toMany<
    V extends EndpointToManyFieldName<this>,
    W extends ResourceFilter<RelationshipFieldResourceFormatter<U['fields'][V]>>
  >(fieldName: V, resourceFilter?: W) {
    const fieldFormatter = this.formatter.getRelationshipField(fieldName as any).getFormatter()

    return async (
      id: ResourceId,
      searchParams: JSONAPISearchParams | null = null,
    ): Promise<Array<Resource<RelationshipFieldResourceFormatter<U['fields'][V]>, W>>> => {
      const url = createURL(
        this.client.url,
        [this.path, id, this.client.setup.transformRelationshipPath(fieldName)],
        resourceFilter as any,
        searchParams as any,
      )
      const data = await this.client.request(url)
      return decodeDocument([fieldFormatter], data as JSONAPIDocument, resourceFilter as any) as any
    }
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
