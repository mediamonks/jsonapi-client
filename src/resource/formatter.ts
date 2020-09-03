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
} from '../types'
import { EMPTY_OBJECT } from '../util/constants'
import { resourceType } from '../util/validators'
import { decodeDocument } from './formatter/decodeDocument'
import { parseResourceFields } from './formatter/parseResourceFields'
import { parseResourceFilter } from './formatter/parseResourceFilter'
import { ResourceIdentifier } from './identifier'
import { encodeResourceCreateData } from './formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from './formatter/encodeResourcePatchData'

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
    include: W = EMPTY_OBJECT,
  ): { fields: V; include: W } {
    return parseResourceFilter([this], { fields: fields as any, include }) as any
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ):
    | FilteredResource<ResourceFormatter<T, U>, V>
    | Array<FilteredResource<ResourceFormatter<T, U>, V>> {
    return decodeDocument([this], resourceDocument, resourceFilter || (EMPTY_OBJECT as any)) as any
  }

  createResourcePostDocument(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceCreateObject<ResourceFormatter<T, U>> } {
    return encodeResourceCreateData([this], data)
  }

  createResourcePatchDocument(
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceObject<ResourceFormatter<T, U>> } {
    return encodeResourcePatchData([this], data)
  }

  hasField(fieldName: string): boolean {
    return Object.hasOwnProperty.call(this.fields, fieldName)
  }

  getField<V extends keyof U>(fieldName: V): U[V] {
    if (!this.hasField(fieldName as any)) {
      throw new TypeError(`Field "${fieldName}" does not exist on resource of type "${this.type}"`)
    }
    return this.fields[fieldName]
  }

  toString(): T {
    return this.type
  }
}
