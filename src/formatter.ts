import {
  ResourceFields,
  ResourceId,
  ResourceType,
  ResourceCreateData,
  JSONAPIResourceObject,
  ResourcePatchData,
  JSONAPIResourceCreateObject,
  ResourceFieldName,
  RelationshipFieldName,
  AttributeFieldName,
  ResourceFieldsFilterLimited,
  ResourceIncludeFilter,
  JSONAPIMetaObject,
  JSONAPILinksObject,
  WithMeta,
  META_ACCESSOR,
  LINKS_ACCESSOR,
} from './types'
import { resourceType } from './util/validators'
import { parseResourceFields } from './formatter/parseResourceFields'
import { ResourceIdentifier } from './resource/identifier'
import { encodeResourceCreateData } from './formatter/encodeResourceCreateData'
import { encodeResourcePatchData } from './formatter/encodeResourcePatchData'
import { onResourceOfTypeMessage } from './util/formatting'
import { parseResourceFilter } from './formatter/parseResourceFilter'
import {
  DecodeBaseResourceEvent,
  DecodeResourceEvent,
  DecodeResourceIdentifierEvent,
  EventEmitter,
} from './event/EventEmitter'

type ResourceFormatterEvent<T extends ResourceFormatter> =
  | DecodeResourceIdentifierEvent<T>
  | DecodeBaseResourceEvent<T>
  | DecodeResourceEvent<T>

export class ResourceFormatter<
  T extends ResourceType = any,
  U extends ResourceFields = any
> extends EventEmitter<ResourceFormatterEvent<ResourceFormatter<T, U>>> {
  readonly type: T
  readonly fields: U
  private readonly meta: WeakMap<object, JSONAPIMetaObject> = new WeakMap()
  private readonly links: WeakMap<object, JSONAPILinksObject> = new WeakMap()

  constructor(type: T, fields: U) {
    super()
    this.type = resourceType.parse(type) as T
    this.fields = parseResourceFields(fields)
  }

  identifier(id: ResourceId): ResourceIdentifier<T> {
    return new ResourceIdentifier(this.type, id)
  }

  createFilter<
    V extends ResourceFieldsFilterLimited<this>,
    W extends ResourceIncludeFilter<ResourceFormatter<T, U>, V> = null
  >(fields: V, include: W = null as W) {
    return parseResourceFilter([this], fields, include as any) as {
      fields: V
      include: W
    }
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
    return fieldName in this.fields
  }

  getField<V extends ResourceFieldName<this>>(fieldName: V): this['fields'][V] {
    if (!this.hasField(fieldName)) {
      throw new TypeError(onResourceOfTypeMessage([this], `Field "${fieldName}" does not exist`))
    }
    return this.fields[fieldName]
  }

  getAttributeField<V extends AttributeFieldName<this['fields']>>(fieldName: V): this['fields'][V] {
    const field = this.getField(fieldName as any)
    if (!field.isAttributeField()) {
      throw new TypeError(
        onResourceOfTypeMessage([this], `Field "${fieldName}" is not an attribute field`),
      )
    }
    return field
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

export const getDocumentMeta = <T extends JSONAPIMetaObject = JSONAPIMetaObject>(
  data: WithMeta<any>,
): T | null => {
  return Object.hasOwnProperty.call(data, META_ACCESSOR) ? data[META_ACCESSOR] : null
}

export const getDocumentLinks = <T extends JSONAPILinksObject = JSONAPILinksObject>(
  data: WithMeta<any>,
): T | null => {
  return Object.hasOwnProperty.call(data, LINKS_ACCESSOR) ? data[LINKS_ACCESSOR] : null
}
