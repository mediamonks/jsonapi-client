import { or, isAny, isNull, array, Predicate } from 'isntnt'

import { resourceFieldPropertyDescriptor } from '../constants/resourceFieldPropertyDescriptor'
import { createIsResourceOfType } from '../utils/predicates'
import { ResourceField, ResourceFieldName, ResourceFieldRoot } from './ResourceField'
import { ResourceIdentifier } from './ResourceIdentifier'
import { ResourceType, AnyResource } from './Resource'

export type ToOneRelationship<R extends AnyResource> = R | null
export type ToManyRelationship<R extends AnyResource> = Array<R>

export type RelationshipValue<R extends AnyResource> = ToOneRelationship<R> | ToManyRelationship<R>

export class RelationshipField<T extends ResourceType> extends ResourceField<
  RelationshipValue<ResourceIdentifier<T>>
> {
  public type: T
  constructor(
    name: ResourceFieldName,
    type: T,
    predicate: Predicate<RelationshipValue<ResourceIdentifier<T>>>,
  ) {
    super(name, predicate)
    this.type = type
  }
  root: ResourceFieldRoot = 'relationships'
}

export class ToOneRelationshipField<T extends ResourceType> extends RelationshipField<T> {
  constructor(name: ResourceFieldName, type: T) {
    super(name, type, or(isNull, createIsResourceOfType(type)))
  }

  isToOneRelationship: () => this is RelationshipField<T> & ToOneRelationshipField<T> = isAny as any
}

export class ToManyRelationshipField<T extends ResourceType> extends RelationshipField<T> {
  constructor(name: ResourceFieldName, type: T) {
    super(name, type, array(createIsResourceOfType(type)))
  }

  isToManyRelationship: () => this is RelationshipField<T> &
    ToManyRelationshipField<T> = isAny as any
}

export const toOneRelationship = <T extends ResourceType>(type: T) => (
  target: any,
  name: ResourceFieldName,
): any => {
  ;(target.constructor as any).fields[name] = new ToOneRelationshipField(name, type)
  return resourceFieldPropertyDescriptor
}

export const toManyRelationship = <T extends ResourceType>(type: T) => (
  target: any,
  name: ResourceFieldName,
): any => {
  ;(target.constructor as any).fields[name] = new ToManyRelationshipField(name, type)
  return resourceFieldPropertyDescriptor
}
