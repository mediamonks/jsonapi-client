import { isArray, isUndefined } from 'isntnt'

import { RelationshipFieldType, ResourceFieldFlag, ValidationErrorMessage } from '../../enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  FilteredResource,
} from '../../types'
import { EMPTY_OBJECT } from '../../util/constants'
import { RelationshipField } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'
import { decodeIncludedRelationship } from './decodeIncludedRelationship'
import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { failure, success, Validation } from '../../util/validation'
import type { ResourceFormatter } from '../formatter'

export type ToManyRelationshipData = Array<FilteredResource> | Array<ResourceIdentifier>

export const decodeToManyRelationship = (
  field: RelationshipField<any, RelationshipFieldType.ToMany, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<Array<ResourceIdentifier>, ResourceValidationErrorObject> => {
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data: ReadonlyArray<ResourceIdentifier> = (value || EMPTY_OBJECT).data

  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.MaybeGet)
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

  const resourceFormatters: ReadonlyArray<ResourceFormatter> = field.getResources()
  const relatedResourceData: Array<any> = []
  const validationErrorObjects: Array<ResourceValidationErrorObject> = []

  const result: Validation<ToManyRelationshipData, ResourceValidationErrorObject> = [
    relatedResourceData,
    validationErrorObjects,
  ]

  if (fieldName in includeFilter) {
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
    }, result as Validation<Array<FilteredResource>, ResourceValidationErrorObject>)
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
  }, result as Validation<Array<ResourceIdentifier>, ResourceValidationErrorObject>)
}
