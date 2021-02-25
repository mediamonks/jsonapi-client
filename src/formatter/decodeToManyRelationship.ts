import { isArray, isUndefined } from 'isntnt'

import { RelationshipFieldType, ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  Resource,
  ResourceType,
} from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceIdentifier } from '../resource/identifier'
import { decodeIncludedRelationship } from './decodeIncludedRelationship'
import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { failure, success, Validation } from '../util/validation'
import type { ResourceFormatter } from '../formatter'

export type ToManyRelationshipData =
  | ReadonlyArray<Resource>
  | ReadonlyArray<ResourceIdentifier<any>>

export const decodeToManyRelationship = (
  field: RelationshipField<any, RelationshipFieldType.ToMany, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<ReadonlyArray<ResourceIdentifier<any>>, ResourceValidationErrorObject> => {
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data: ReadonlyArray<ResourceIdentifier<any>> = (value || EMPTY_OBJECT).data

  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.GetOptional)
      ? success([])
      : failure([
          createValidationErrorObject(
            ValidationErrorMessage.MissingRequiredField,
            `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" is required.`,
            pointer,
          ),
        ])
  }

  if (!isArray(data)) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidToManyRelationshipData,
        `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" must be an Array.`,
        pointer,
      ),
    ])
  }

  const resourceFormatters: ReadonlyArray<ResourceFormatter> = field.getFormatter()
  const relatedResourceData: Array<any> = []
  const validationErrorObjects: Array<ResourceValidationErrorObject> = []

  const result: Validation<ToManyRelationshipData, ResourceValidationErrorObject> = [
    relatedResourceData,
    validationErrorObjects,
  ]

  if (includeFilter && fieldName in includeFilter) {
    return data.reduce((result, item) => {
      const [resources, errors] = result
      const [resourceIdentifier, validationErrors] = decodeResourceIdentifier(
        resourceFormatters,
        item,
        pointer, // .concat([String(index)]),
      )

      if (!validationErrors.length) {
        const [resource, validationErrors] = decodeIncludedRelationship(
          field,
          fieldName,
          resourceIdentifier,
          included,
          fieldsFilter,
          includeFilter,
          pointer, // .concat([String(index)]),
        )
        resources.push(resource)
        validationErrors.forEach((error) => errors.push(error))
      } else {
        resources.push(resourceIdentifier as any)
        validationErrors.forEach((error) => errors.push(error))
      }

      return result
    }, result as Validation<Array<Resource>, ResourceValidationErrorObject>)
  }

  return data.reduce((result, item, index) => {
    const [resourceIdentifiers, errors] = result
    const [resourceIdentifier, validationErrors] = decodeResourceIdentifier(
      resourceFormatters,
      item,
      pointer.concat([String(index)]),
    )
    resourceIdentifiers.push(resourceIdentifier)
    validationErrors.forEach((error) => errors.push(error))
    return result
  }, result as Validation<Array<ResourceIdentifier<ResourceType>>, ResourceValidationErrorObject>)
}
