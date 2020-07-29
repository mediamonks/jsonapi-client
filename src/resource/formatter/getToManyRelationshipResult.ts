import { isArray, isUndefined } from 'isntnt'

import { ResourceValidationErrorObject } from '../../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  FilteredResource,
} from '../../types'
import { ResourceFieldFlag } from '../field'
import { RelationshipField, RelationshipFieldType } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'
import { parseResourceIdentifier } from './parseResourceIdentifier'
import { success, validationFailure, Result } from './result'
import type { ResourceFormatter } from '.'
import { decodeIncludedRelationshipData } from './decodeIncludedRelationshipData'

const EMPTY_OBJECT = Object.freeze({}) as Record<any, any>

export type ToManyRelationshipData = Array<FilteredResource> | Array<ResourceIdentifier>

export const getToManyRelationshipResult = (
  field: RelationshipField<any, RelationshipFieldType.ToMany, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: Array<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Result<Array<ResourceIdentifier>, ResourceValidationErrorObject> => {
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data: Array<ResourceIdentifier> = (value || EMPTY_OBJECT).data

  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.MaybeGet)
      ? success([])
      : validationFailure(
          data,
          `Required To-Many Relationship Not Found`,
          `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer,
        )
  }

  if (!isArray(data)) {
    return validationFailure(
      data,
      `Invalid To-Many Relationship Data`,
      `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} must be an Array.`,
      pointer,
    )
  }

  const resourceFormatters: ReadonlyArray<ResourceFormatter> = field.getResources()
  const relatedResourceData: Array<any> = []
  const validationErrorObjects: Array<ResourceValidationErrorObject> = []

  const result: Result<ToManyRelationshipData, ResourceValidationErrorObject> = [
    relatedResourceData,
    validationErrorObjects,
  ]

  if (fieldName in includeFilter) {
    return data.reduce((result, item, index) => {
      const [resources, errors] = result
      const [resourceIdentifier, validationErrors] = parseResourceIdentifier(
        resourceFormatters,
        item,
        pointer.concat([String(index)]),
      )

      if (!validationErrors.length) {
        const [resource, validationErrors] = decodeIncludedRelationshipData(
          field,
          fieldName,
          resourceIdentifier,
          included,
          fieldsFilter,
          includeFilter,
          pointer.concat(String(index)),
        )
        resources.push(resource)
        validationErrors.forEach((error) => errors.push(error))
      } else {
        resources.push(resourceIdentifier as any)
        validationErrors.forEach((error) => errors.push(error))
      }

      return result
    }, result as Result<Array<FilteredResource>, ResourceValidationErrorObject>)
  }

  return data.reduce((result, item, index) => {
    const [resourceIdentifiers, errors] = result
    const [resourceIdentifier, validationErrors] = parseResourceIdentifier(
      resourceFormatters,
      item,
      pointer.concat([String(index)]),
    )
    resourceIdentifiers.push(resourceIdentifier)
    validationErrors.forEach((error) => errors.push(error))
    return result
  }, result as Result<Array<ResourceIdentifier>, ResourceValidationErrorObject>)
}
