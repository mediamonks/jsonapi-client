import { isSome } from 'isntnt'

import { ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import { createValidationErrorObject, ResourceValidationErrorObject } from '../error'
import type { AttributeValue, ResourceFieldName } from '../types'
import type { ResourceObject } from '../types/jsonapi'
import { EMPTY_OBJECT } from '../data/constants'
import type { AttributeField } from '../resource/field/attribute'
import { failure, success, Validation } from '../util/validation'

/**
 * Get an attribute field Validation from a JSON:API Resource Object.
 * @hidden
 * @param field An AttributeField to validate the attribute value.
 * @param fieldName The name of the `field`.
 * @param resource A JSONAPIResourceObject to get the attribute from.
 * @param pointer A string Array representing a path up to the current attribute field.
 * @returns A Result with the attribute value or attribute validation errors.
 */
export const decodeAttribute = (
  field: AttributeField<any, any, any>,
  fieldName: ResourceFieldName,
  resource: ResourceObject<any>,
  pointer: ReadonlyArray<string>,
): Validation<AttributeValue, ResourceValidationErrorObject> => {
  const value = (resource.attributes || EMPTY_OBJECT)[fieldName]
  if (isSome(value)) {
    const validationErrors = field.validate(value)
    if (validationErrors.length) {
      return failure(
        validationErrors.map((detail) =>
          createValidationErrorObject(
            ValidationErrorMessage.InvalidAttributeValue,
            detail,
            pointer,
            resource,
          ),
        ),
      )
    }
    return success(field.deserialize(value))
  }
  return field.matches(ResourceFieldFlag.GetOptional)
    ? success(null)
    : failure([
        createValidationErrorObject(
          ValidationErrorMessage.MissingRequiredField,
          `Attribute "${fieldName}" on resource of type "${resource.type}" is required.`,
          pointer,
          resource,
        ),
      ])
}
