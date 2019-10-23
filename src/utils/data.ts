import {
  Serializable,
  isArray,
  isNone,
  isObject,
  isSome,
  isString,
} from 'isntnt'

export const keys = <T extends Record<string, any>>(value: T): Array<keyof T> =>
  Object.keys(value)

import { AnyResource, ResourceConstructor } from '../lib/Resource'
import { AttributeField, AttributeValue } from '../lib/ResourceAttribute'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'
import { RelationshipField } from '../lib/ResourceRelationship'

export const createEmptyObject = (): {} => Object.create(null)

export const createDataValue = <T extends Serializable>(data: T): T => {
  if (isArray(data)) {
    return data.map(createDataValue) as T
  } else if (isObject(data)) {
    const target = createEmptyObject()
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        ;(target as any)[key] = createDataValue(data[key])
      }
    }
    return target as T
  }
  return data
}

export const createBaseResource = <R extends AnyResource>(
  Resource: ResourceConstructor<R>,
  data: { type?: R['type']; id?: string },
): ResourceIdentifier<R['type']> => {
  if (data.type !== Resource.type) {
    throw new Error(`invalid type`)
  }
  if (!isString(data.id)) {
    throw new Error(`id must be a string`)
  }
  return createDataValue({
    type: data.type,
    id: data.id,
  })
}

export const getAttributeValue = (
  attributes: Record<string, AttributeValue>,
  field: AttributeField<any>,
): AttributeValue => {
  if (!isObject(attributes)) {
    console.warn(attributes)
    throw new Error(`Attributes is expected to be an object`)
  }
  const value = field.name in attributes ? attributes[field.name] : null
  if (
    !field.validate(value) ||
    (field.isRequiredAttribute() && isNone(value))
  ) {
    throw new Error(``)
  }
  return value
}

export const getRelationshipData = (
  relationships: Record<string, { data: any }>,
  field: RelationshipField<any>,
): any => {
  if (!isObject(relationships)) {
    throw new Error(`Relationships is expected to be an object`)
  }
  const value = relationships[field.name]
  if (!isObject(value)) {
    throw new Error(`Invalid relationship value, must be an object`)
  }
  if (field.isToOneRelationship()) {
    return isSome(value.data) ? value.data : null
  }
  return isArray(value.data) ? value.data : []
}
