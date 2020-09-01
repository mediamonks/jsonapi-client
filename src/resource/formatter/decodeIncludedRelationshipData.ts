import { createValidationErrorObject, ResourceValidationErrorObject } from '../../error'
import {
  FilteredResource,
  ResourceIncludeQuery,
  ResourceFieldsQuery,
  JSONAPIResourceObject,
  ResourceFieldName,
} from '../../types'
import { RelationshipField } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'
import { decodeResourceObject } from './decodeResourceObject'
import { result, Result } from './result'

export const decodeIncludedRelationshipData = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceIdentifier: ResourceIdentifier,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery<any>,
  includeFilter: ResourceIncludeQuery<any>,
  pointer: ReadonlyArray<string>,
): Result<FilteredResource, ResourceValidationErrorObject> => {
  const includedResourceObject = included.find(
    (item) => item.type === resourceIdentifier.type && item.id === resourceIdentifier.id,
  )

  if (!includedResourceObject) {
    return result(includedResourceObject as any, [
      createValidationErrorObject(
        'Included Resource Not Found',
        `JSONAPIResourceObject with type "${resourceIdentifier.type}" and id "${resourceIdentifier.id}" is not included.`,
        pointer,
      ),
    ])
  }

  const relatedResourceFormatters = field.getResources()
  const childIncludeFilter = includeFilter[fieldName] || ({} as any)
  return decodeResourceObject(
    relatedResourceFormatters,
    includedResourceObject,
    included,
    fieldsFilter,
    childIncludeFilter,
    pointer,
  )
}
