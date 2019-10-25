import { Predicate, isNever } from 'isntnt'

import { AnyResource, ResourceType } from './Resource'
import { AttributeField, AttributeValue, RequiredAttributeValue } from './ResourceAttribute'
import { ResourceIdentifierKey } from './ResourceIdentifier'
import {
  RelationshipValue,
  RelationshipField,
  ToOneRelationshipField,
  ToManyRelationshipField,
} from './ResourceRelationship'

export type ResourceFieldName = string

export type ResourceFields<R extends AnyResource> = Omit<R, ResourceIdentifierKey>

export type ResourceFieldRoot = 'attributes' | 'relationships'

export class ResourceField<T extends AttributeValue | RelationshipValue<AnyResource>> {
  root: ResourceFieldRoot | null = null
  name: ResourceFieldName
  validate: Predicate<T>

  constructor(name: ResourceFieldName, predicate: Predicate<T>) {
    this.name = name
    this.validate = predicate
  }

  isAttributeField(): this is AttributeField<RequiredAttributeValue> {
    return this.root === 'attributes'
  }

  isRequiredAttribute: () => this is AttributeField<RequiredAttributeValue> = isNever as any

  isOptionalAttribute: () => this is AttributeField<RequiredAttributeValue> = isNever as any

  isRelationshipField(): this is RelationshipField<ResourceType> {
    return this.root === 'relationships'
  }

  isToOneRelationship: () => this is RelationshipField<ResourceType> &
    ToOneRelationshipField<ResourceType> = isNever as any

  isToManyRelationship: () => this is RelationshipField<ResourceType> &
    ToManyRelationshipField<ResourceType> = isNever as any
}
