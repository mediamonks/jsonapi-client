import { ErrorMessage, ValidationErrorMessage, ResourceFieldFlag } from '../../enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../../error'
import {
  FilteredResource,
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  ResourceFields,
} from '../../types'
import { failure, success, Validation } from '../../util/validation'
import { resourceObject } from '../../util/validators'
import { decodeAttribute } from './decodeAttribute'
import { decodeRelationship } from './decodeRelationship'
import type { ResourceFormatter } from '.'

/**
 *
 * @hidden
 * @param formatters
 * @param resource
 * @param included
 * @param fieldsFilter
 * @param includeFilter
 * @param pointer
 */
export const decodeResourceObject = (
  formatters: ReadonlyArray<ResourceFormatter>,
  resource: JSONAPIResourceObject,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<FilteredResource, ResourceValidationErrorObject> => {
  if (!resourceObject.predicate(resource)) {
    return failure(
      resourceObject
        .validate(resource)
        .map((detail) =>
          createValidationErrorObject(
            ValidationErrorMessage.InvalidResourceObject,
            detail,
            pointer,
          ),
        ),
    )
  }

  const formatter = formatters.find((formatter) => formatter.type === resource.type)
  if (!formatter) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidResourceType,
        `The resource type does not match that of its formatters (${formatters}).`, // TODO: Format formatters’ types
        pointer.concat(['type']),
      ),
    ])
  }

  const validation: Validation<FilteredResource, ResourceValidationErrorObject> = success({
    type: resource.type,
    id: resource.id,
  })

  const resourceFieldNames: ReadonlyArray<string> =
    formatter.type in fieldsFilter
      ? fieldsFilter[formatter.type]!
      : Object.keys(formatter.fields).filter(
          (field) => !formatter.fields[field].matches(ResourceFieldFlag.NeverGet),
        )

  return resourceFieldNames.reduce((validation, fieldName) => {
    const [data, errors] = validation
    const field: ResourceFields[any] = formatter.fields[fieldName]

    if (field.matches(ResourceFieldFlag.NeverGet)) {
      throw new Error(ErrorMessage.ResourceFieldNotAllowed)
    } else {
      if (field.isAttributeField()) {
        const [value, validationErrors] = decodeAttribute(
          field,
          fieldName,
          resource,
          pointer.concat(fieldName),
        )
        data[fieldName] = value
        validationErrors.forEach((error) => errors.push(error))
      } else if (field.isRelationshipField()) {
        const [value, validationErrors] = decodeRelationship(
          field,
          fieldName,
          resource,
          included,
          fieldsFilter,
          includeFilter,
          pointer.concat([fieldName]),
        )
        data[fieldName] = value
        validationErrors.forEach((error) => errors.push(error))
      }
    }

    return validation
  }, validation)
}
