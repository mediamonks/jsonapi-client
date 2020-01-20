import { isArray, isSome, isString, isNone, either, literal, shape, Predicate, None } from 'isntnt'

import { resourceFieldPropertyDescriptor } from '../constants/resourceFieldPropertyDescriptor'
import { Fabricate } from '../types/util'
import { AnyResource, ResourceType, ResourceConstructor } from './Resource'
import { ResourceIdentifierKey } from './ResourceIdentifier'

const isResourceIdentifierKey = either('type', 'id')

const validateFieldName = (value: string) => {
  if (isResourceIdentifierKey(value)) {
    throw new Error(`${value} is a reserved field name`)
  }
  return value
}

export type ResourceFieldName = string

export type ResourceFields<R extends AnyResource> = Omit<R, ResourceIdentifierKey>

export enum ResourceFieldRoot {
  ATTRIBUTES = 'attributes',
  RELATIONSHIPS = 'relationships',
}

export type ResourceFieldFlagMap = {
  [ResourceFieldRoot.ATTRIBUTES]: AttributeFlag
  [ResourceFieldRoot.RELATIONSHIPS]: RelationshipFlag
}

export abstract class ResourceField<
  R extends ResourceFieldRoot,
  F extends ResourceFieldFlagMap[R]
> {
  name: ResourceFieldName
  root: R
  flag: F

  constructor(name: ResourceFieldName, root: R, flag: F) {
    this.name = validateFieldName(name)
    this.root = root
    this.flag = flag
  }

  isAttributeField(): this is Attribute<AttributeFlag, AttributeValue> {
    return this.root === ResourceFieldRoot.ATTRIBUTES
  }

  isOptionalAttribute(): this is Attribute<AttributeFlag.OPTIONAL, AttributeValue> {
    return this.isAttributeField() && !Boolean(this.flag & AttributeFlag.REQUIRED)
  }

  isRequiredAttribute(): this is Attribute<AttributeFlag.REQUIRED, AttributeValue> {
    // Because OPTIONAL equals 0, check for the absence of the REQUIRED mask
    return this.isAttributeField() && Boolean(this.flag & AttributeFlag.REQUIRED)
  }

  isRelationshipField(): this is Relationship<RelationshipFlag, AnyResource> {
    return this.root === ResourceFieldRoot.RELATIONSHIPS
  }

  isToOneRelationship(): this is Relationship<RelationshipFlag.TO_ONE, AnyResource> {
    // Because TO_ONE equals 0, check for the absence of the TO_MANY mask
    return this.isRelationshipField() && !Boolean(this.flag & RelationshipFlag.TO_MANY)
  }

  isToManyRelationship(): this is Relationship<RelationshipFlag.TO_MANY, AnyResource> {
    return this.isRelationshipField() && Boolean(this.flag & RelationshipFlag.TO_MANY)
  }
}

// ATTRIBUTE
type SerializablePrimitive = string | number | boolean | null
type SerializableArray = Array<Serializable>
type SerializableObject = {
  [key: string]: Serializable
}

type Serializable = SerializablePrimitive | SerializableArray | SerializableObject

export enum AttributeFlag {
  OPTIONAL,
  REQUIRED,
}

// see https://jsonapi.org/format/#document-resource-object-attributes
export type AttributeValue =
  | NonNullable<SerializablePrimitive>
  | SerializableArray
  | (SerializableObject & {
      relationships?: never
      links?: never
    })

export class Attribute<
  F extends AttributeFlag,
  T extends AttributeValue | null
> extends ResourceField<ResourceFieldRoot.ATTRIBUTES, F> {
  predicate: Predicate<T>
  constructor(name: ResourceFieldName, flag: F, predicate: Predicate<T>) {
    super(name, ResourceFieldRoot.ATTRIBUTES, flag)
    this.predicate = predicate
  }

  isValid(value: unknown): value is T | None {
    return this.predicate(value) || (isSome(value) && this.isOptionalAttribute())
  }

  static optional<T extends AttributeValue>(predicate: Predicate<T>) {
    return (target: any, name: ResourceFieldName): any => {
      target.constructor.fields[name] = new Attribute(name, AttributeFlag.OPTIONAL, predicate)
      return resourceFieldPropertyDescriptor
    }
  }

  static required<T extends AttributeValue>(predicate: Predicate<T>) {
    return (target: any, name: ResourceFieldName): any => {
      target.constructor.fields[name] = new Attribute(name, AttributeFlag.OPTIONAL, predicate)
      return resourceFieldPropertyDescriptor
    }
  }
}

export const optionalAttribute = Attribute.optional
export const requiredAttribute = Attribute.required

// RELATIONSHIP
export type RelationshipValue = Array<AnyResource> | AnyResource | null

export enum RelationshipFlag {
  TO_ONE,
  TO_MANY,
}

const isResourceIdentifierOfType = <T extends ResourceType>(type: T) =>
  shape({
    id: isString,
    type: literal(type),
  })

export class Relationship<F extends RelationshipFlag, T extends AnyResource> extends ResourceField<
  ResourceFieldRoot.RELATIONSHIPS,
  F
> {
  getResource: Fabricate<ResourceConstructor<T>>
  constructor(name: ResourceFieldName, flag: F, getResource: Fabricate<ResourceConstructor<T>>) {
    super(name, ResourceFieldRoot.RELATIONSHIPS, flag)
    this.getResource = () => {
      // TODO: Throw if return value is not a Resource constructor
      return getResource()
    }
  }

  get type(): T['type'] {
    return this.getResource().type
  }

  isValid(value: unknown): boolean {
    const isResourceIdentifier = isResourceIdentifierOfType(this.type)
    return this.isToManyRelationship()
      ? isArray(value) && value.every(isResourceIdentifier)
      : isNone(value) || isResourceIdentifier(value)
  }

  static toOne<T extends AnyResource>(getResource: Fabricate<ResourceConstructor<T>>) {
    return (target: any, name: ResourceFieldName): any => {
      ;(target.constructor as any).fields[name] = new Relationship(
        name,
        RelationshipFlag.TO_ONE,
        getResource,
      )
      return resourceFieldPropertyDescriptor
    }
  }

  static toMany<T extends AnyResource>(getResource: Fabricate<ResourceConstructor<T>>) {
    return (target: any, name: ResourceFieldName): any => {
      ;(target.constructor as any).fields[name] = new Relationship(
        name,
        RelationshipFlag.TO_MANY,
        getResource,
      )
      return resourceFieldPropertyDescriptor
    }
  }
}

export const toOneRelationship = Relationship.toOne
export const toManyRelationship = Relationship.toMany
