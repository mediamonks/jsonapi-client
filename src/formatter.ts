import {
  ResourceFields,
  ResourceId,
  ResourceType,
  JSONAPIDocument,
  ResourceCreateData,
  JSONAPIResourceObject,
  ResourcePatchData,
  JSONAPIResourceCreateObject,
  ResourceFieldName,
  RelationshipFieldName,
  AttributeFieldName,
  ResourceFieldsFilterLimited,
  ResourceIncludeFilter,
  ResourceFilterLimited,
  Resource,
  JSONAPIMetaObject,
  JSONAPILinksObject,
} from './types'
import { EMPTY_OBJECT } from './data/constants'
import { resourceType } from './util/validators'
import { decodeDocument } from './formatter/decodeDocument'
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

  decode<V extends ResourceFilterLimited<this> = {}>(
    resourceDocument: JSONAPIDocument<this>,
    filter: V = EMPTY_OBJECT,
  ): Resource<this, V> | ReadonlyArray<Resource<this, V>> {
    return decodeDocument([this], resourceDocument, filter as any) as any
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

  hasMeta(resource: ResourceIdentifier<T> | ReadonlyArray<ResourceIdentifier<T>>): boolean {
    return this.meta.has(resource)
  }

  getMeta<W extends JSONAPIMetaObject = JSONAPIMetaObject>(
    resource: ResourceIdentifier<T> | ReadonlyArray<ResourceIdentifier<T>>,
  ): W | null {
    return (this.meta.get(resource) as any) || null
  }

  hasLinks(resource: ResourceIdentifier<T> | ReadonlyArray<ResourceIdentifier<T>>): boolean {
    return this.links.has(resource)
  }

  getLinks<W extends JSONAPILinksObject = JSONAPILinksObject>(
    resource: ResourceIdentifier<T> | ReadonlyArray<ResourceIdentifier<T>>,
  ): W | null {
    return (this.links.get(resource) as W) || null
  }

  toString(): T {
    return this.type
  }
}
