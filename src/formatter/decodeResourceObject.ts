import { ErrorMessage, ValidationErrorMessage, ResourceFieldFlag } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import {
  Resource as FilteredResource,
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  ResourceFields,
  ResourceFieldName,
  ResourceId,
} from '../types'
import { resourceTypeNotFoundDetail } from '../util/formatting'
import { failure, success, Validation } from '../util/validation'
import { resourceObject } from '../util/validators'
import { decodeAttribute } from './decodeAttribute'
import { decodeRelationship, decodeRelationshipValue } from './decodeRelationship'
import type { ResourceFormatter } from '../formatter'
import { BaseIncludedResourceMap } from './decodeDocument'
import { RelationshipField } from '../resource/field/relationship'
import { EMPTY_OBJECT } from '../data/constants'
import { DecodeBaseResourceEvent, DecodeResourceEvent } from '../event/EventEmitter'
import { cloneResource, createBaseResource } from '../util/resource'

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
  baseIncludedResourceMap: BaseIncludedResourceMap,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<ResourceFieldName | ResourceId>,
): Validation<FilteredResource<any>, ResourceValidationErrorObject> => {
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
  const includedBaseMapOfType = baseIncludedResourceMap[resource.type] ||= new Map()
  const includedBaseResource = includedBaseMapOfType.get(resource.id)
  const baseResource = includedBaseResource || createBaseResource(resource.type, resource.id) as any

  if (!includedBaseResource) {
    resourceFieldNames.forEach((fieldName) => {
      const field: ResourceFields[any] = formatter.getField(fieldName)
      if (field.matches(ResourceFieldFlag.GetForbidden)) {
        throw new TypeError(ErrorMessage.ResourceFieldNotAllowed)
      } else if (field.isAttributeField()) {
        const [value, validationErrors] = decodeAttribute(
          field,
          fieldName,
          resource,
          pointer.concat(fieldName),
        )
        baseResource[fieldName] = value
        validationErrors.forEach((error) => errors.push(error))
      } else {
        const [value, validationErrors] = decodeRelationshipValue(
          field,
          fieldName,
          resource,
          pointer.concat(fieldName),
        )
        baseResource[fieldName] = value
        validationErrors.forEach((error) => errors.push(error))
      }
    })
  }

  if (errors.length) {
    return failure(errors)
  }
  
  includedBaseMapOfType.set(baseResource.id, baseResource)
  ;(formatter as any).emit(new DecodeBaseResourceEvent(baseResource))

  const data = cloneResource(baseResource)

  Object.keys(includeFilter || EMPTY_OBJECT).forEach((fieldName) => {
    const relationshipField: RelationshipField<any, any, any> = formatter.getRelationshipField(fieldName)
    const [value, validationErrors] = decodeRelationship(
      relationshipField,
      fieldName,
      resource,
      included,
      baseIncludedResourceMap,
      fieldsFilter,
      includeFilter,
      pointer.concat([fieldName]),
    )
    data[fieldName] = value
    validationErrors.forEach((error) => errors.push(error))
  })   

  if (errors.length) {
    return failure(errors)
  }
  
  ;(formatter as any).emit(new DecodeResourceEvent(data))

  return success(data)
}
