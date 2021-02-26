import { ErrorMessage, ValidationErrorMessage, ResourceFieldFlag } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import {
  Resource,
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  ResourceFields,
} from '../types'
import { resourceTypeNotFoundDetail } from '../util/formatting'
import { failure, success, Validation } from '../util/validation'
import { resourceObject } from '../util/validators'
import { decodeAttribute } from './decodeAttribute'
import { decodeRelationship } from './decodeRelationship'
import type { ResourceFormatter } from '../formatter'

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
): Validation<Resource<any>, ResourceValidationErrorObject> => {
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
        resourceTypeNotFoundDetail(formatters),
        pointer.concat(['type']),
      ),
    ])
  }

  const resourceFieldNames: ReadonlyArray<string> =
    formatter.type in fieldsFilter
      ? fieldsFilter[formatter.type]!
      : Object.keys(formatter.fields).filter(
          (field) => !formatter.fields[field].matches(ResourceFieldFlag.GetForbidden),
        )

  const errors: Array<ResourceValidationErrorObject> = []
  const data: Resource<any, any> = {
    type: resource.type,
    id: resource.id,
  }

  resourceFieldNames.forEach((fieldName) => {
    const field: ResourceFields[any] = formatter.getField(fieldName)
    if (field.matches(ResourceFieldFlag.GetForbidden)) {
      throw new TypeError(ErrorMessage.ResourceFieldNotAllowed)
    } else {
      if (field.isAttributeField()) {
        const [value, validationErrors] = decodeAttribute(
          field,
          fieldName,
          resource,
          pointer.concat(fieldName),
        )
        data[fieldName as keyof typeof data] = value
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
        data[fieldName as keyof typeof data] = value
        validationErrors.forEach((error) => errors.push(error))
      }
    }
  })

  if (errors.length) {
    return failure(errors)
  }

  return success(data)
}
