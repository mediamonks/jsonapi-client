import { isAny, isNull, or, Predicate } from 'isntnt'

import { resourceFieldPropertyDescriptor } from '../constants/resourceFieldPropertyDescriptor'
import {
  ResourceField,
  ResourceFieldName,
  ResourceFieldRoot,
} from './ResourceField'

type SerializablePrimitive = string | number | boolean | null
type SerializableArray = Array<SerializableValue>
type SerializableObject = {
  [key: string]: SerializableValue
}

type SerializableValue =
  | SerializablePrimitive
  | SerializableArray
  | SerializableObject

export type AttributeValue =
  | SerializablePrimitive
  | SerializableArray
  | (SerializableObject & {
      test?: never
    })

export type RequiredAttribute<T extends RequiredAttributeValue> = T
export type OptionalAttribute<T extends RequiredAttributeValue> = T | null

export type RequiredAttributeValue = Exclude<AttributeValue, null>

export class AttributeField<
  T extends RequiredAttributeValue
> extends ResourceField<T> {
  root: ResourceFieldRoot = 'attributes'
}

export class RequiredAttributeField<
  T extends RequiredAttributeValue
> extends AttributeField<T> {
  isRequiredAttribute: () => this is AttributeField<T> = isAny as any
}

export class OptionalAttributeField<
  T extends RequiredAttributeValue
> extends AttributeField<T> {
  constructor(name: ResourceFieldName, predicate: Predicate<T>) {
    super(name, or(predicate, isNull) as any)
  }
  isOptionalAttribute: () => this is AttributeField<T> = isAny as any
}

export const requiredAttribute = <T extends RequiredAttributeValue>(
  predicate: Predicate<T>,
) => (target: any, name: ResourceFieldName): any => {
  target.constructor.fields[name] = new RequiredAttributeField(name, predicate)
  return resourceFieldPropertyDescriptor
}

export const optionalAttribute = <T extends RequiredAttributeValue>(
  predicate: Predicate<T>,
) => (target: any, name: ResourceFieldName): any => {
  target.constructor.fields[name] = new OptionalAttributeField(name, predicate)
  return resourceFieldPropertyDescriptor
}
