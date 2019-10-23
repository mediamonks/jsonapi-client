import { isString, isNone, isObject, isSome, isArray } from 'isntnt'

import {
  ResourceConstructor,
  AnyResource,
  ResourceAttributes,
  ResourceRelationships,
} from '../lib/Resource'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'
import { createDataValue } from './data'
import { AttributeValue, AttributeField } from '../lib/ResourceAttribute'
import {
  RelationshipField,
  RelationshipValue,
  ToOneRelationship,
} from '../lib/ResourceRelationship'
import { ApiEndpoint } from '../lib/ApiEndpoint'

type Fields = {
  [key: string]: Array<string>
}

type Included = {
  [key: string]: Included | null
}

const createBaseResource = <R extends AnyResource>(
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

type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
  included: Array<AnyResource>
}

const getAttributeValue = (
  attributes: Record<string, AttributeValue>,
  field: AttributeField<any>,
): AttributeValue => {
  if (!isObject(attributes)) {
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

const getRelationshipData = (
  relationships: Record<string, { data: RelationshipValue<AnyResource> }>,
  field: RelationshipField<any>,
): RelationshipValue<AnyResource> => {
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

export const decodeToOneRelationship = <R extends AnyResource>(
  endpoint: ApiEndpoint<R, any>,
  data: ToOneRelationship<R>,
  fields: Fields = {},
  included: Included = {},
) => {}

export const decodeResource = <R extends AnyResource>(
  // api: Api<any>,
  endpoint: ApiEndpoint<R, any>,
  data: ResourceData<R>,
  fields: Fields = {},
  included: Included = {},
) => {
  const Resource = endpoint.Resource
  const resourceFields = fields[Resource.type] || Object.keys(Resource.fields)
  const result = resourceFields.reduce(
    (result, name) => {
      const field = Resource.fields[name]
      if (field.isAttributeField()) {
        result[name] = getAttributeValue(data.attributes, field)
      } else if (field.isRelationshipField()) {
        const relationshipData = getRelationshipData(data.relationships, field)
        if (field.isToOneRelationship()) {
          if (field.validate(relationshipData)) {
            if (field.name in included && isSome(relationshipData)) {
              const relationshipEndpoint =
                endpoint.api.endpoints[(relationshipData as AnyResource).type]
              result[name] = decodeToOneRelationship(relationshipEndpoint)
            } else {
              result[name] = relationshipData
            }
          }
        }
      }
      return result
    },
    createBaseResource(Resource, data) as Record<string, any>,
  )
  return new Resource(result as any)
}
