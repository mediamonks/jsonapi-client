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
import { BaseIncludedResourceMap } from './decodeDocument'

export const decodeIncludedRelationship = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceIdentifier: ResourceIdentifier<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  baseIncludedResourceMap: BaseIncludedResourceMap,
  fieldsFilter: ResourceFieldsQuery<any>,
  includeFilter: ResourceIncludeQuery<any>,
  pointer: ReadonlyArray<string>,
): Validation<Resource<any>, ResourceValidationErrorObject> => {
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

  const formatters = field.getFormatters()
  const childIncludeFilter = (includeFilter || EMPTY_OBJECT)[fieldName]
  return decodeResourceObject(
    formatters,
    includedResourceObject,
    included,
    baseIncludedResourceMap,
    fieldsFilter,
    childIncludeFilter as any,
    pointer,
  )
}