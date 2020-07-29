import { OneResource, ManyResource } from '../../client/result'
import {
  ResourceFields,
  ResourceFieldsQuery,
  ResourceId,
  ResourceIncludeQuery,
  ResourceType,
  ResourceFilter,
  JSONAPIDocument,
  FilteredResource,
  ResourceCreateData,
  JSONAPIResourceObject,
  ResourcePatchData,
  JSONAPIResourceCreateObject,
} from '../../types'
import { resourceType, parseResourceFields } from '../../util/types'
import { ResourceIdentifier } from '../identifier'
import { decodeDocument } from './decodeDocument'
import { parseResourceFilter } from './parseResourceFilter'

export const formatter = <T extends ResourceType, U extends ResourceFields>(type: T, fields: U) =>
  new ResourceFormatter(type, fields)

export class ResourceFormatter<T extends ResourceType = any, U extends ResourceFields = any> {
  readonly type: T
  readonly fields: U

  constructor(type: T, fields: U) {
    this.type = resourceType.parse(type) as T
    this.fields = parseResourceFields(fields)
  }

  identifier(id: ResourceId): ResourceIdentifier<T> {
    return new ResourceIdentifier(this.type, id)
  }

  filter<V extends ResourceFieldsQuery<this>, W extends ResourceIncludeQuery<this>>(
    fields: V,
    include: W,
  ): { fields: V; include: W } {
    return parseResourceFilter([this], { fields: fields as any, include }) as any
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ):
    | OneResource<FilteredResource<ResourceFormatter<T, U>, V>>
    | ManyResource<FilteredResource<ResourceFormatter<T, U>, V>> {
    return decodeDocument([this], resourceDocument, resourceFilter || ({} as any))
  }

  createResourcePostObject(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceCreateObject<ResourceFormatter<T, U>> } {
    return {} as any
  }

  createResourcePatchObject(
    id: ResourceId,
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
  }

  hasField(fieldName: string): boolean {
    return Object.hasOwnProperty.call(this.fields, fieldName)
  }

  getField<V extends keyof U>(fieldName: V): U[V] {
    if (!this.hasField(fieldName as any)) {
      throw new Error(`Field ${fieldName} does not exist on resource of type ${this.type}`)
    }
    return this.fields[fieldName]
  }

  toString(): T {
    return this.type
  }
}
