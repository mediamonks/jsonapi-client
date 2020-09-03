import { ValidationErrorMessage } from '../../enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../../error'
import { resourceIdentifier } from '../../util/validators'
import { ResourceIdentifier } from '../identifier'
import { failure, success, Validation } from '../../util/validation'
import type { ResourceFormatter } from '../formatter'

/**
 * Returns a Result with a ResourceIdentifier if `value` is a valid resource identifer for any of the `formatters`
 * @hidden
 * @param formatters A ResourceFormatter[]
 * @param identifier A ResourceIdentifier
 * @param pointer A string[] representing the path to the `value`
 * @returns Validation<ResourceIdentifier, ResourceValidationErrorObject>
 */
export const decodeResourceIdentifier = (
  formatters: ReadonlyArray<ResourceFormatter>,
  identifier: ResourceIdentifier,
  pointer: ReadonlyArray<string>,
): Validation<ResourceIdentifier, ResourceValidationErrorObject> => {
  const validationErrors = resourceIdentifier.validate(identifier)
  if (validationErrors.length) {
    return failure(
      validationErrors.map((detail) =>
        createValidationErrorObject(
          ValidationErrorMessage.InvalidResourceIdentifier,
          detail,
          pointer,
        ),
      ),
    )
  }
  if (!formatters.some((formatter) => formatter.type === (identifier as any).type)) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        `Resource type must match the type of its formatter (${formatters})`,
        pointer,
      ),
    ])
  }
  return success(new ResourceIdentifier(identifier.type, identifier.id))
}
