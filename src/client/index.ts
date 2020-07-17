import { Serializable, SerializableObject } from 'isntnt'

import { ResourceFieldFlag } from '../resource/field'
import {
  FilteredResource,
  ResourceFormatter,
  ResourceId,
  ResourceFilter,
  ResourceCreateData,
  ResourcePatchData,
  RelationshipFieldNameWithFlag,
  RelationshipPatchData,
  ToManyRelationshipFieldNameWithFlag,
  ToManyRelationshipCreateData as ToManyRelationshipPatchData,
  ResourceIdentifier,
  ToOneRelationshipFieldNameWithFlag,
  RelationshipFieldResourceConstructor,
  Resource,
  JSONAPIMetaObject,
  JSONAPIResourceLinks,
  JSONAPIPaginationLinks,
  JSONAPIDocument,
} from '../types'
import { createURL } from './utils'

const JSON_API_MIME_TYPE = 'application/vnd.api+json'

type JSONAPIRequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// Whether a relative path that starts with '/' will start from the client url or the url domain
export type AbsolutePathRoot = 'client' | 'domain'

// Whether fields are opt-in or available by default
export type ImplicitResourceFields = 'none' | 'all'

// To what degree relationship data is included by default
export type ImplicitRelationshipData =
  | 'none'
  | 'all'
  | 'primary-relationships'
  | 'resource-identifiers'

// Whether a self-link is present on a relationship field and if so what key it has
type RelationshipSelfLinkKey = null | string

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: 'domain'
  initialResourceFields: 'all'
  initialRelationshipData: 'none'
}

const reflect = <T>(value: T) => value

const defaultClientSetup: DefaultClientSetup = {
  absolutePathRoot: 'domain',
  initialResourceFields: 'all',
  initialRelationshipData: 'none',
  transformRelationshipPath: reflect,
  beforeRequestURL: reflect,
  beforeRequestHeaders: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: window.fetch,
}

export type ClientSetup = {
  absolutePathRoot: AbsolutePathRoot
  initialResourceFields: ImplicitResourceFields
  initialRelationshipData: ImplicitRelationshipData
  transformRelationshipPath(path: string): string
  beforeRequest(request: Request): Request | Promise<Request>
  beforeRequestURL(url: URL): URL
  beforeRequestHeaders(headers: Headers): Headers
  afterRequest(response: Response): Response | Promise<Response>
  fetchAdapter: Window['fetch']
}

export const client = <T extends Partial<ClientSetup>>(url: URL, setup: T) => new Client(url, setup)

export class Client<T extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetup

  constructor(url: URL, setup: T) {
    this.url = url
    this.setup = { ...defaultClientSetup, ...setup } as any
  }

  async create<U extends ResourceFormatter<any, any>>(
    Resource: U,
    data: ResourceCreateData<U>,
  ): Promise<OneResource<FilteredResource<U, {}>>> {
    console.log('Create', data)
    const url = createURL(this.url, [Resource.path])
    return this.request(url, 'POST', data).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async update<U extends ResourceFormatter<any, any>, V extends ResourceIdentifier<U['type']>>(
    Resource: U,
    id: ResourceId,
    data: ResourcePatchData<U>,
  ): Promise<void> {
    console.log('Patch', data)
    const url = createURL(this.url, [Resource.path, id])
    await this.request(url, 'PATCH', data).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async delete<U extends ResourceFormatter<any, any>>(Resource: U, id: ResourceId): Promise<void> {
    console.log('Delete', id)
    const url = createURL(this.url, [Resource.path, id])
    await this.request(url, 'DELETE')
  }

  async updateRelationship<
    U extends ResourceFormatter<any, any>,
    V extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    >
  >(
    Resource: U,
    id: ResourceId,
    fieldName: V,
    data: RelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    console.log(`Update ${fieldName}`, data)
    const field = Resource.fields[fieldName]
    const url = createURL(this.url, [Resource.type, id, field.root, fieldName])
    await this.request(url, 'PATCH', data as any).then((data) => {
      return new OneResource(data as any, {}, {})
    })
  }

  async addRelationships<
    U extends ResourceFormatter<any, any>,
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePost
    >
  >(
    Resource: U,
    id: ResourceId,
    fieldName: string,
    data: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    console.log(`Add some ${fieldName}`, data)
    const field = Resource.fields[fieldName]
    const url = createURL(this.url, [Resource.type, id, field.root, fieldName])
    await this.request(url, 'PATCH', data as any)
  }

  async deleteRelationships<
    U extends ResourceFormatter<any, any>,
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.MaybePatch
    >
  >(
    Resource: U,
    id: ResourceId,
    fieldName: string,
    data: ToManyRelationshipPatchData<U['fields'][V]>,
  ): Promise<void> {
    console.log(`Delete some ${fieldName}`, data)
    const field = Resource.fields[fieldName]
    const url = createURL(this.url, [Resource.type, id, field.root, fieldName])
    await this.request(url, 'DELETE')
  }

  async getOne<U extends ResourceFormatter<any, any>, V extends ResourceFilter<U>>(
    Resource: U,
    id: ResourceId,
    resourceQuery?: V,
  ): Promise<OneResource<FilteredResource<U, V>>> {
    const url = createURL(this.url, [Resource.type, id], resourceQuery as any)
    return this.request(url, 'GET').then((data) => {
      const resource = Resource.decode(data as any)
      return new OneResource(resource as any, data.meta ?? {}, {})
    })
  }

  async getMany<U extends ResourceFormatter<any, any>, V extends ResourceFilter<U>>(
    Resource: U,
    searchQuery: {} | null,
    resourceQuery?: V,
  ): Promise<ManyResource<FilteredResource<U, V>>> {
    const url = createURL(this.url, [Resource.path], resourceQuery as any, searchQuery || {})

    return this.request(url, 'GET').then((data) => {
      const resource = Resource.decode(data as any)
      return new ManyResource(resource as any, data.meta ?? {}, {
        pagination: {},
      })
    })
  }

  async getOneRelationship<
    U extends ResourceFormatter<any, any>,
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    Resource: U,
    id: ResourceId,
    fieldName: V,
    resourceQuery?: W,
  ): Promise<
    OneResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    const url = createURL(this.url, [Resource.type, id, fieldName], resourceQuery as any)

    return this.request(url, 'GET').then((data) => {
      const resource = Resource.decode(data as any)
      return new OneResource(resource as any, data.meta ?? {}, {})
    })
  }

  async getManyRelationship<
    U extends ResourceFormatter<any, any>,
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    Resource: U,
    id: ResourceId,
    fieldName: V,
    resourceQuery?: W,
    searchQuery?: {},
  ): Promise<
    ManyResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    const url = createURL(
      this.url,
      [Resource.type, id, fieldName],
      resourceQuery as any,
      searchQuery as any,
    )

    return this.request(url, 'GET').then((data) => {
      const resource = Resource.decode(data as any)
      return new ManyResource(resource as any, data.meta ?? {}, {
        pagination: {},
      })
    })
  }

  one<U extends ResourceFormatter<any, any>, V extends ResourceFilter<U>>(
    Resource: U,
    resourceQuery?: V,
  ) {
    return (id: ResourceId) => this.getOne(Resource, id, resourceQuery)
  }

  many<U extends ResourceFormatter<any, any>, V extends ResourceFilter<U>>(
    Resource: U,
    resourceQuery: V,
  ) {
    return (searchQuery: {} | null = null) => this.getMany(Resource, searchQuery, resourceQuery)
  }

  toOne<
    U extends ResourceFormatter<any, any>,
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(Resource: U, fieldName: V, resourceQuery?: W) {
    return (id: ResourceId) => this.getOneRelationship(Resource, id, fieldName, resourceQuery)
  }

  toMany<
    U extends ResourceFormatter<any, any>,
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceFilter<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(Resource: U, fieldName: V, resourceQuery?: W) {
    return (id: ResourceId, searchQuery?: {}) =>
      this.getManyRelationship(Resource, id, fieldName, searchQuery, resourceQuery)
  }

  private async request<U extends JSONAPIRequestMethod>(
    url: URL,
    method: U,
    body?: Partial<SerializableObject>,
  ): Promise<JSONAPIDocument<any>> {
    return this.beforeRequest(url, method, body)
      .then(this.setup.fetchAdapter)
      .then(this.afterRequest)
  }

  private async beforeRequest(
    initialUrl: URL,
    method: string,
    body?: Partial<SerializableObject>,
  ): Promise<Request> {
    const initialHeaders = new Headers({
      'Content-Type': JSON_API_MIME_TYPE,
    })
    return Promise.all([
      Promise.resolve(this.setup.beforeRequestURL(initialUrl)),
      Promise.resolve(this.setup.beforeRequestHeaders(initialHeaders)),
    ])
      .then(([url, headers]) =>
        this.setup.beforeRequest(
          new Request(
            url.href,
            body != null
              ? {
                  method,
                  headers,
                  body: JSON.stringify(body),
                }
              : {
                  method,
                  headers,
                },
          ),
        ),
      )
      .catch((error: Error) => {
        throw new Error(error.message)
      })
  }

  private async afterRequest(response: Response): Promise<JSONAPIDocument<any>> {
    return Promise.resolve(this.setup.afterRequest(response))
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then((data: Serializable) => {
        // TODO: Assert if data is JSONAPIDocument<any>
        return data as any
      })
  }
}

class ResourceResult<
  T extends Resource<any> | Array<Resource<any>>,
  U extends JSONAPIResourceLinks | Required<JSONAPIPaginationLinks>
> {
  readonly data: T
  readonly meta: JSONAPIMetaObject
  readonly links: U

  constructor(data: T, meta: JSONAPIMetaObject, links: U) {
    this.data = data
    this.meta = meta
    this.links = links
  }
}

class OneResource<T extends Resource<any>> extends ResourceResult<T, JSONAPIResourceLinks> {
  constructor(data: T, meta: JSONAPIMetaObject, links: JSONAPIResourceLinks) {
    super(data, meta, links)
  }
}

class ManyResource<T extends Resource<any>> extends ResourceResult<
  Array<T>,
  JSONAPIResourceLinks & Required<JSONAPIPaginationLinks>
> {
  constructor(
    data: Array<T>,
    meta: JSONAPIMetaObject,
    links: JSONAPIResourceLinks & Required<JSONAPIPaginationLinks>,
  ) {
    super(data, meta, links)
  }

  hasNextPage(): this is { links: { pagination: { next: string } } } {
    return this.links.pagination.next != null
  }

  hasPrevPage(): this is { links: { pagination: { prev: string } } } {
    return this.links.pagination.prev != null
  }
}
