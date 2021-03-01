import { isSome } from 'isntnt'
import { RelationshipFieldType, ResourceFieldFlag, ValidationErrorMessage } from '../data/enum'
import { ResourceValidationErrorObject, createValidationErrorObject } from '../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  Resource,
} from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceIdentifier } from '../resource/identifier'
import { decodeIncludedRelationship } from './decodeIncludedRelationship'
import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { failure, success, Validation } from '../util/validation'
import type { ResourceFormatter } from '../formatter'

export type ToOneRelationshipData = Resource<any> | ResourceIdentifier<any> | null

export const decodeToOneRelationship = (
  field: RelationshipField<ResourceFormatter, RelationshipFieldType.ToOne, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<ToOneRelationshipData, ResourceValidationErrorObject> => {
  const formatters = field.getFormatters()
  const { relationships = EMPTY_OBJECT } = resourceObject
  const { data } = relationships[fieldName] || EMPTY_OBJECT

  if (isSome(data)) {
    const result = decodeResourceIdentifier(formatters, data as any, pointer.concat(fieldName))
    const [identifier, identifierErrors] = result
    if (
      identifierErrors.length === 0 &&
      includeFilter &&
      Object.hasOwnProperty.call(includeFilter, fieldName)
    ) {
      return decodeIncludedRelationship(
        field,
        fieldName,
        identifier,
        included,
        fieldsFilter,
        includeFilter,
        pointer.concat(fieldName),
      )
    }

    return result
  }

  return field.matches(ResourceFieldFlag.GetOptional)
    ? success(null)
    : failure([
        createValidationErrorObject(
          ValidationErrorMessage.MissingRequiredField,
          `To-One relationship "${fieldName}" on resource of type "${resourceObject.type}" is required`,
          pointer.concat(fieldName),
        ),
      ])
}
