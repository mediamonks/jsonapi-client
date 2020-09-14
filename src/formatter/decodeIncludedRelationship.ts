import { EMPTY_OBJECT } from '../data/constants'
import { ValidationErrorMessage } from '../data/enum'
import { createValidationErrorObject, ResourceValidationErrorObject } from '../error'
import {
  Resource,
  ResourceIncludeQuery,
  ResourceFieldsQuery,
  JSONAPIResourceObject,
  ResourceFieldName,
} from '../types'
import { RelationshipField } from '../resource/field/relationship'
import { ResourceIdentifier } from '../resource/identifier'
import { decodeResourceObject } from './decodeResourceObject'
import { failure, Validation } from '../util/validation'

export const decodeIncludedRelationship = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceIdentifier: ResourceIdentifier,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery<any>,
  includeFilter: ResourceIncludeQuery<any>,
  pointer: ReadonlyArray<string>,
): Validation<Resource, ResourceValidationErrorObject> => {
  const includedResourceObject = included.find(
    (item) => item.type === resourceIdentifier.type && item.id === resourceIdentifier.id,
  )

  if (!includedResourceObject) {
    return failure([
      createValidationErrorObject(
        ValidationErrorMessage.IncludedResourceNotFound,
        `Resource object of type "${resourceIdentifier.type}" with id "${resourceIdentifier.id}" is not included.`,
        pointer,
      ),
    ])
  }

  const relatedResourceFormatters = field.getFormatters()
  const childIncludeFilter = (includeFilter || EMPTY_OBJECT)[fieldName]
  return decodeResourceObject(
    relatedResourceFormatters,
    includedResourceObject,
    included,
    fieldsFilter,
    childIncludeFilter as any,
    pointer,
  )
}
