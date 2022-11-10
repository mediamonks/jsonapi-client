import { isArray, isUndefined } from 'isntnt'
import { RelationshipFieldType, ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import { ResourceFieldsQuery, ResourceIncludeQuery, Resource, ResourceFieldName } from '../types'
import { ResourceObject, ResourceId } from '../types/jsonapi'
import { EMPTY_OBJECT } from '../data/constants'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceIdentifier } from '../resource/identifier'
import { decodeIncludedRelationship } from './decodeIncludedRelationship'
import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { failure, success, validation, Validation } from '../util/validation'
import type { ResourceFormatter } from '../formatter'
import { BaseIncludedResourceMap } from './decodeDocument'

export type ToManyRelationshipData =
  | ReadonlyArray<Resource<any>>
  | ReadonlyArray<ResourceIdentifier<any>>

export const decodeToManyRelationship = (
  field: RelationshipField<ResourceFormatter, RelationshipFieldType.ToMany, any>,
  fieldName: string,
  resourceObject: ResourceObject<any>,
  included: ReadonlyArray<ResourceObject>,
  baseIncludedResourceMap: BaseIncludedResourceMap,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<ReadonlyArray<ResourceIdentifier<any>>, ResourceValidationErrorObject> => {
  const { relationships = EMPTY_OBJECT } = resourceObject
  const { data } = relationships[fieldName] || EMPTY_OBJECT

  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.GetOptional)
      ? success([])
      : failure([
          createValidationErrorObject(
            ValidationErrorMessage.MissingRequiredField,
            `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" is required`,
            pointer.concat(fieldName),
            resourceObject,
          ),
        ])
  }

  if (!isArray(data)) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidToManyRelationshipData,
        `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" must be an Array`,
        pointer.concat(fieldName),
        resourceObject,
      ),
    ])
  }

  const formatters = field.getFormatters()
  const errors: Array<ResourceValidationErrorObject> = []
  const result: Array<Resource<any> | ResourceIdentifier<any>> = []

  if (includeFilter && Object.hasOwnProperty.call(includeFilter, fieldName)) {
    data.forEach((item: any) => {
      const [identifier, identifierErrors] = decodeResourceIdentifier(
        formatters,
        item,
        pointer.concat(fieldName),
      )

      if (!identifierErrors.length) {
        const [resource, resourceErrors] = decodeIncludedRelationship(
          field,
          fieldName,
          identifier,
          included,
          baseIncludedResourceMap,
          fieldsFilter,
          includeFilter,
          pointer.concat(fieldName),
        )
        result.push(resource)
        resourceErrors.forEach((error) => errors.push(error))
      } else {
        result.push(item)
        identifierErrors.forEach((error) => errors.push(error))
      }
    })

    return validation(result, errors)
  }

  data.forEach((item: any) => {
    const [identifier, identifierErrors] = decodeResourceIdentifier(
      formatters,
      item,
      pointer.concat(fieldName),
    )

    if (!identifierErrors.length) {
      result.push(identifier)
    } else {
      result.push(item)
      identifierErrors.forEach((error) => errors.push(error))
    }

    return result
  })

  return validation(result, errors)
}

export const decodeToManyRelationshipValue = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceObject: ResourceObject<any>,
  pointer: ReadonlyArray<ResourceFieldName | ResourceId>,
): Validation<ToManyRelationshipData, ResourceValidationErrorObject> => {
  const { relationships = EMPTY_OBJECT } = resourceObject
  const { data } = relationships[fieldName] || EMPTY_OBJECT

  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.GetOptional)
      ? success([])
      : failure([
          createValidationErrorObject(
            ValidationErrorMessage.MissingRequiredField,
            `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" is required`,
            pointer.concat(fieldName),
            resourceObject,
          ),
        ])
  }

  if (!isArray(data)) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.InvalidToManyRelationshipData,
        `To-Many relationship "${fieldName}" on resource of type "${resourceObject.type}" must be an Array`,
        pointer.concat(fieldName),
        resourceObject,
      ),
    ])
  }

  const formatters = field.getFormatters()
  const errors: Array<ResourceValidationErrorObject> = []
  const result: Array<Resource<any> | ResourceIdentifier<any>> = []

  data.forEach((item: any) => {
    const [identifier, validationErrors] = decodeResourceIdentifier(
      formatters,
      item,
      pointer.concat(fieldName),
    )

    if (!validationErrors.length) {
      result.push(identifier)
    } else {
      result.push(item)
      validationErrors.forEach((error) => errors.push(error))
    }
  })

  return validation(result, errors)
}
