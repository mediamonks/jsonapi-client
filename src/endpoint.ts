import { isArray } from 'isntnt'

import Client, { ClientSetup, DefaultClientSetup } from './client'
import {
  FilteredResource,
  ResourcePath,
  ResourceConstructor,
  ResourceId,
  ResourceQuery,
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
  JSONAPILinksObject,
  JSONAPIResourceLinks,
  JSONAPIPaginationLinks,
} from './types'
import ResourceField, {
  ResourceFieldFlag,
  ResourceFieldRoot,
  RelationshipField,
  RelationshipFieldType,
} from './resource/field'

const formatURL = (breadCrumbs: Array<string>): string =>
  breadCrumbs.map((breadCrumb) => breadCrumb.replace(/\/*$/, '')).join('/')

export default class Endpoint<
  T extends ClientSetup | DefaultClientSetup,
  U extends ResourceConstructor<any, any>
> {
  client: Client<T>
  path: ResourcePath
  Resource: U

  constructor(client: Client<T>, path: ResourcePath, Resource: U) {
    this.client = client
    this.path = path
    this.Resource = Resource
  }

  async create(data: ResourceCreateData<U>): Promise<OneResource<FilteredResource<U, {}>>> {
    const url = formatURL([this.client.url.href, this.path])
    const { fetchAdapter } = this.client.setup
    fetchAdapter(url, {}).then((request) => {
      return request.json()
    })
    console.log('Create', data)
    return new OneResource(data as any, {}, {})
  }

  async update<V extends ResourceIdentifier<U['type']>>(
    resource: V,
    data: ResourcePatchData<U>,
  ): Promise<OneResource<V>> {
    console.log('Patch', resource, data)
    return new OneResource({ ...resource, ...data }, {}, {})
  }

  async delete(resource: ResourceIdentifier<U['type']>): Promise<void> {
    console.log('Delete', resource)
  }

  async updateRelationship<
    V extends ResourceIdentifier<U['type']>,
    W extends RelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybePatch | ResourceFieldFlag.AlwaysPatch
    >
  >(
    resource: V,
    fieldName: W,
    data: RelationshipPatchData<U['fields'][W]>,
  ): Promise<OneResource<V & { [P in W]: RelationshipPatchData<U['fields'][W]> }>> {
    // TODO: Test ReturnType
    const field: ResourceField<any, any> | undefined = this.Resource.fields[fieldName]
    if (field === undefined) {
      throw new TypeError(
        `Field "${fieldName}" does not exist on Resource of type ${this.Resource.type}`,
      )
    }
    if (field.root !== ResourceFieldRoot.Relationships) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} is not a relationship field`,
      )
    }
    if (field.matches(ResourceFieldFlag.NeverPatch)) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} does not allow PATCH operations`,
      )
    }

    // We made it!
    console.log(`Patch ${fieldName}`, data)

    return new OneResource({} as any, {}, {})
  }

  async addRelationships<
    V extends ResourceIdentifier<U['type']>,
    W extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePost
    >
  >(
    resource: ResourceIdentifier<U['type']>,
    fieldName: string,
    data: ToManyRelationshipPatchData<U['fields'][W]>,
  ): Promise<OneResource<V & { [P in W]: ToManyRelationshipPatchData<U['fields'][W]> }>> {
    // TODO: Test ReturnType
    const field: ResourceField<any, any> | undefined = this.Resource.fields[fieldName]
    if (field === undefined) {
      throw new TypeError(
        `Field "${fieldName}" does not exist on Resource of type ${this.Resource.type}`,
      )
    }
    if (field.root !== ResourceFieldRoot.Relationships) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} is not a relationship field`,
      )
    }
    if (
      (field as RelationshipField<any, any, any>).relationshipType !== RelationshipFieldType.ToMany
    ) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} is not a to-many relationship`,
      )
    }
    if (field.matches(ResourceFieldFlag.NeverPost)) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} does not allow POST operations`,
      )
    }
    if (isArray(data) && data.length === 0) {
      throw new TypeError(
        `Field "${fieldName}" on Resource of type ${this.Resource.type} POST data must be a non-empty Array`,
      )
    }

    // We made it!
    console.log(`Post to ${fieldName}`, data)
    return new OneResource({} as any, {}, {})
  }

  async deleteRelationships<
    V extends ResourceIdentifier<U['type']>,
    W extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.MaybePatch
    >
  >(
    resource: ResourceIdentifier<U['type']>,
    fieldName: string,
    data: ToManyRelationshipPatchData<U['fields'][W]>,
  ): Promise<OneResource<V & { [P in W]: ToManyRelationshipPatchData<U['fields'][W]> }>> {
    return new OneResource({} as any, {}, {})
  }

  async getOne<V extends ResourceQuery<U>>(
    id: ResourceId,
    resourceQuery: V,
  ): Promise<OneResource<FilteredResource<U, V>>> {
    const url = new URL(id, this.client.url)
    return new OneResource({ id } as any, {}, {})
  }

  async getMany<V extends ResourceQuery<U>>(
    query: {},
    resourceQuery: V,
  ): Promise<ManyResource<FilteredResource<U, V>>> {
    return new ManyResource([], {}, {})
  }

  async getOneRelationship<
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceQuery<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceQuery: W,
  ): Promise<
    OneResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    return new OneResource({ id } as any, {}, {})
  }

  async getManyRelationship<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceQuery<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(
    id: ResourceId,
    fieldName: V,
    resourceQuery: W,
  ): Promise<
    ManyResource<FilteredResource<RelationshipFieldResourceConstructor<U['fields'][V]>, W>>
  > {
    return new ManyResource([], {}, {})
  }

  one<V extends ResourceQuery<U>>(resourceQuery: V) {
    return (id: ResourceId) => this.getOne(id, resourceQuery)
  }

  many<V extends ResourceQuery<U>>(resourceQuery: V) {
    return (query: {}) => this.getMany(query, resourceQuery)
  }

  async toOne<
    V extends ToOneRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceQuery<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceQuery: W) {
    return (id: ResourceId) => this.getOneRelationship(id, fieldName, resourceQuery)
  }

  async toMany<
    V extends ToManyRelationshipFieldNameWithFlag<
      U['fields'],
      ResourceFieldFlag.MaybeGet | ResourceFieldFlag.AlwaysGet
    >,
    W extends ResourceQuery<RelationshipFieldResourceConstructor<U['fields'][V]>>
  >(fieldName: V, resourceQuery: W) {
    return (id: ResourceId) => this.getManyRelationship(id, fieldName, resourceQuery)
  }
}

class ResourceResult<
  T extends Resource<any> | Array<Resource<any>>,
  U extends JSONAPIResourceLinks | JSONAPIPaginationLinks
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
  JSONAPIResourceLinks & JSONAPIPaginationLinks
> {
  constructor(
    data: Array<T>,
    meta: JSONAPIMetaObject,
    links: JSONAPIResourceLinks & JSONAPIPaginationLinks,
  ) {
    super(data, meta, links)
  }

  hasPrevPage(): boolean {
    return this.links.pagination?.prev != null
  }

  hasNextPage(): boolean {
    return this.links.pagination?.next != null
  }

  async firstPage(): Promise<ManyResource<T>> {
    return new ManyResource([], {} as any, {} as any)
  }

  async prevPage(): Promise<ManyResource<T>> {
    return new ManyResource([], {} as any, {} as any)
  }

  async nextPage(): Promise<ManyResource<T>> {
    return new ManyResource([], {} as any, {} as any)
  }

  async lastPage(): Promise<ManyResource<T>> {
    return new ManyResource([], {} as any, {} as any)
  }
}
