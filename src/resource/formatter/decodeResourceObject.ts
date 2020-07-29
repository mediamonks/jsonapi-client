import { ResourceValidationErrorObject } from '../../error'
import {
  FilteredResource,
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
} from '../../types'
import { resourceObject as resourceObjectType } from '../../util/types'
import { ResourceField } from '../field'
import { getAttributeResult } from './getAttributeResult'
import { getFilteredFieldNames } from './getFilteredFieldNames'
import { getRelationshipResult } from './getRelationshipResult'
import { isReadableField } from './isReadableField'
import { success, validationFailure, Result } from './result'
import type { ResourceFormatter } from '.'

/**
 *
 * @hidden
 * @param formatters
 * @param resourceObject
 * @param included
 * @param fieldsFilter
 * @param includeFilter
 * @param pointer
 */
export const decodeResourceObject = (
  formatters: ReadonlyArray<ResourceFormatter>,
  resourceObject: JSONAPIResourceObject,
  included: Array<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Result<FilteredResource, ResourceValidationErrorObject> => {
  if (!resourceObjectType.predicate(resourceObject)) {
    return validationFailure(
      resourceObject,
      'Invalid JSONAPIResourceObject',
      `The JSONAPIResourceObject data does not match its schema.`,
      pointer,
    )
  }

  const formatter = formatters.find((formatter) => formatter.type === resourceObject.type)
  if (!formatter) {
    return validationFailure(
      resourceObject,
      'Invalid resource type',
      `The data type does not match that of its formatters (${formatters}).`,
      pointer.concat(['type']),
    )
  }

  const fieldNames = getFilteredFieldNames(formatters, fieldsFilter, pointer)
    // Only use fieldNames that are relevant to the ResourceFormatter that matches the actual data type
    .filter((fieldName) =>
      formatter.type in fieldsFilter
        ? fieldsFilter[formatter.type]!.includes(fieldName)
        : fieldName in formatter.fields && isReadableField(formatter.fields[fieldName]),
    )

  const result: Result<FilteredResource, ResourceValidationErrorObject> = success({
    type: resourceObject.type,
    id: resourceObject.id,
  })

  return fieldNames.reduce((result, fieldName) => {
    const [data, errors] = result
    const field: ResourceField = formatter.fields[fieldName]

    if (field.isAttributeField()) {
      const [attributeValue, validationErrors] = getAttributeResult(
        field,
        fieldName,
        resourceObject,
        pointer.concat([fieldName]),
      )
      data[fieldName] = attributeValue
      validationErrors.forEach((error) => errors.push(error))
    } else if (field.isRelationshipField()) {
      const [relatedResourceData, validationErrors] = getRelationshipResult(
        field,
        fieldName,
        resourceObject,
        included,
        fieldsFilter,
        includeFilter,
        pointer.concat([fieldName]),
      )
      data[fieldName] = relatedResourceData
      validationErrors.forEach((error) => errors.push(error))
    }

    return result
  }, result)
}
