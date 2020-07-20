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
} from '../../types'
import { ResourceIdentifier } from '../identifier'

export const parseResourceType = <T extends ResourceType>(type: T): T => {
  // TODO: Throw if type is invalid
  return type
}

export const parseResourceFields = <T extends ResourceFields>(fields: T): T => {
  // TODO: Throw if field is invalid
  const pureFields = Object.create(null)
  for (const key in fields) {
    pureFields[key] = fields[key]
  }
  return Object.freeze(fields)
}

export class ResourceFormatter<T extends ResourceType, U extends ResourceFields> {
  readonly type: T
  readonly fields: U

  constructor(type: T, fields: U) {
    this.type = parseResourceType(type)
    this.fields = parseResourceFields(fields)
  }

  identifier(id: ResourceId): ResourceIdentifier<T> {
    return new ResourceIdentifier(this.type, id)
  }

  filter<V extends ResourceFieldsQuery<this>, W extends ResourceIncludeQuery<this, V>>(
    fields: V,
    include: W,
  ): { fields: V; include: W } {
    return { fields, include }
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ): FilteredResource<ResourceFormatter<T, U>, V> {
    return {} as any
  }

  createResourcePostObject(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
  }

  createResourcePatchObject(
    id: ResourceId,
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
  }

  hasField(fieldName: string): boolean {
    return this.fields.hasOwnProperty(fieldName)
  }

  getField<V extends keyof U>(fieldName: V): U[V] {
    const field = this.fields[fieldName]
    return field
  }
}
