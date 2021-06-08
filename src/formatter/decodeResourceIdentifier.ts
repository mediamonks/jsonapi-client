import { ValidationErrorMessage } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import { resourceIdentifier } from '../util/validators'
import { ResourceIdentifier } from '../resource/identifier'
import { failure, success, Validation } from '../util/validation'
import type { ResourceFormatter } from '../formatter'
import { DecodeResourceIdentifierEvent } from '../event/EventEmitter'

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
  value: ResourceIdentifier<any>,
  pointer: ReadonlyArray<string>,
): Validation<ResourceIdentifier<any>, ResourceValidationErrorObject> => {
  const validationErrors = resourceIdentifier.validate(value)

  if (validationErrors.length) {
    return failure(
      validationErrors.map((detail) =>
        createValidationErrorObject(
          ValidationErrorMessage.InvalidResourceIdentifier,
          detail,
          pointer,
          value,
        ),
      ),
    )
  }

  const formatter = formatters.find((formatter) => formatter.type === value.type)
  if (!formatter) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        `Resource type must match the type of its formatter (${formatters})`,
        pointer.concat('type'),
        value,
      ),
    ])
  }

  const identifier = formatter.identifier(value.id)
  formatter.emit(new DecodeResourceIdentifierEvent(identifier))

  return success(identifier)
}
