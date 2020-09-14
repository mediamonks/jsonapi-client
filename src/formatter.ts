import {
  ResourceFields,
  ResourceId,
  ResourceType,
  ResourceFilter,
  JSONAPIDocument,
  Resource,
  ResourceCreateData,
  JSONAPIResourceObject,
  ResourcePatchData,
  JSONAPIResourceCreateObject,
  ResourceFieldName,
  RelationshipFieldName,
} from './types'
import { EMPTY_OBJECT } from './data/constants'
import { resourceType } from './util/validators'
import { decodeDocument } from './formatter/decodeDocument'
import { parseResourceFields } from './formatter/parseResourceFields'
import { ResourceIdentifier } from './resource/identifier'
import { encodeResourceCreateData } from './formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from './formatter/encodeResourcePatchData'
import { onResourceOfTypeMessage } from './util/formatting'

const formatter = <T extends ResourceType, U extends ResourceFields>(type: T, fields: U) =>
  new ResourceFormatter(type, fields)

export default formatter

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

  decode<V extends ResourceFilter<this> = {}>(
    resourceDocument: JSONAPIDocument<this>,
    resourceFilter: V = EMPTY_OBJECT,
  ): Resource<this, V> | Array<Resource<this, V>> {
    return decodeDocument([this], resourceDocument, resourceFilter as any) as any
  }

  createResourcePostDocument(
    data: ResourceCreateData<this>,
  ): { data: JSONAPIResourceCreateObject<ResourceFormatter<T, U>> } {
    return encodeResourceCreateData([this], data)
  }

  createResourcePatchDocument(
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceObject<ResourceFormatter<T, U>> } {
    return encodeResourcePatchData([this], data)
  }

  hasField(fieldName: string): boolean {
    return fieldName in this.fields
  }

  getField<V extends ResourceFieldName<this>>(fieldName: V): this['fields'][V] {
    if (!this.hasField(fieldName)) {
      throw new TypeError(onResourceOfTypeMessage([this], `Field "${fieldName}" does not exist`))
    }
    return this.fields[fieldName]
  }

  getRelationshipField<V extends RelationshipFieldName<this['fields']>>(
    fieldName: V,
  ): this['fields'][V] {
    const field = this.getField(fieldName as any)
    if (!field.isRelationshipField()) {
      throw new TypeError(
        onResourceOfTypeMessage([this], `Field "${fieldName}" is not a relationship field`),
      )
    }
    return field
  }

  toString(): T {
    return this.type
  }
}
