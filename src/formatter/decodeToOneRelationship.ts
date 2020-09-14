import { isSome } from 'isntnt'

import { RelationshipFieldType, ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  Resource,
} from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceIdentifier } from '../resource/identifier'
import { decodeIncludedRelationship } from './decodeIncludedRelationship'
import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { failure, success, Validation } from '../util/validation'
import type { ResourceFormatter } from '../formatter'

export type ToOneRelationshipData = Resource | ResourceIdentifier | null

export const decodeToOneRelationship = (
  field: RelationshipField<any, RelationshipFieldType.ToOne, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<ToOneRelationshipData, ResourceValidationErrorObject> => {
  const resourceFormatters: ReadonlyArray<ResourceFormatter> = field.getFormatter()
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data: ResourceIdentifier | null = (value || EMPTY_OBJECT).data

  if (isSome(data)) {
    const resourceIdentifierResult = decodeResourceIdentifier(resourceFormatters, data, pointer)

    const [resourceIdentifier, validationErrors] = resourceIdentifierResult
    if (includeFilter && fieldName in includeFilter && !validationErrors.length) {
      return decodeIncludedRelationship(
        field,
        fieldName,
        resourceIdentifier,
        included,
        fieldsFilter,
        includeFilter,
        pointer,
      )
    }
    return resourceIdentifierResult
  }

  return field.matches(ResourceFieldFlag.GetOptional)
    ? success(null)
    : failure([
        createValidationErrorObject(
          ValidationErrorMessage.MissingRequiredField,
          `To-One relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer.concat([fieldName]),
        ),
      ])
}
