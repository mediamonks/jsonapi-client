import { ResourceValidationErrorObject, createValidationErrorObject } from '../../error'
import { resourceIdentifier } from '../../util/types'
import { ResourceIdentifier } from '../identifier'
import { validationFailure, Result, success, failure } from './result'
import type { ResourceFormatter } from '.'

export const parseResourceIdentifier = (
  formatters: ReadonlyArray<ResourceFormatter>,
  value: ResourceIdentifier,
  pointer: ReadonlyArray<string>,
): Result<ResourceIdentifier, ResourceValidationErrorObject> => {
  const validationErrors = resourceIdentifier.validate(value)
  if (validationErrors.length) {
    return failure(
      validationErrors.map((detail) =>
        createValidationErrorObject('Invalid Resource Identifier', detail, pointer),
      ),
    )
  }
  if (!formatters.some((formatter) => formatter.type === (value as any).type)) {
    return validationFailure(
      value,
      'Invalid Resource Identifier Type',
      `Resource type must match the type of its formatter (${formatters})`,
      pointer,
    )
  }
  return success(new ResourceIdentifier(value.type, value.id))
}
