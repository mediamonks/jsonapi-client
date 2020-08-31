import { isSome } from 'isntnt'

import { ResourceFieldFlag } from '../../enum'
import { createValidationErrorObject, ResourceValidationErrorObject } from '../../error'
import type { JSONAPIResourceObject, ResourceFieldName } from '../../types'
import type { AttributeField } from '../field/attribute'
import { success, validationFailure, result, Result } from './result'

const EMPTY_OBJECT = Object.freeze({}) as Record<any, any> // Frozen to catch accidental mutations.

/**
 * Get an attribute field Result from a JSONAPIResourceObject.
 * @hidden
 * @param field An AttributeField to validate the attribute value.
 * @param fieldName The name of the `field`.
 * @param resourceObject A JSONAPIResourceObject to get the attribute from.
 * @param pointer A string Array representing a path up to the current attribute field.
 * @returns A Result with the attribute value or attribute validation errors.
 */
export const getAttributeResult = (
  field: AttributeField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceObject: JSONAPIResourceObject<any>,
  pointer: ReadonlyArray<string>,
): Result<any, ResourceValidationErrorObject> => {
  const value = (resourceObject.attributes || EMPTY_OBJECT)[fieldName]
  if (isSome(value)) {
    const validationErrors = field.validate(value)
    if (validationErrors.length) {
      return result(
        value,
        validationErrors.map((detail) =>
          createValidationErrorObject('Invalid Attribute Value', detail, pointer),
        ),
      )
    }
    return success(field.deserialize(value))
  }
  return field.matches(ResourceFieldFlag.MaybeGet)
    ? success(null)
    : validationFailure(
        value,
        `Required Attribute Not Found`,
        `Attribute "${fieldName}" on resource of type ${resourceObject.type} is required.`,
        pointer,
      )
}
