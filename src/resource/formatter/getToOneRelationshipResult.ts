import { isSome } from 'isntnt'

import { RelationshipFieldType, ResourceFieldFlag } from '../../enum'
import { ResourceValidationErrorObject } from '../../error'
import {
  JSONAPIResourceObject,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
  FilteredResource,
} from '../../types'
import { EMPTY_OBJECT } from '../../util/constants'
import { RelationshipField } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'
import { decodeIncludedRelationshipData } from './decodeIncludedRelationshipData'
import { getResourceIdentifierResult } from './getResourceIdentifierResult'
import { success, validationFailure, Result } from './result'
import type { ResourceFormatter } from '.'

export type ToOneRelationshipData = FilteredResource | ResourceIdentifier | null

export const getToOneRelationshipResult = (
  field: RelationshipField<any, RelationshipFieldType.ToOne, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Result<ToOneRelationshipData, ResourceValidationErrorObject> => {
  const resourceFormatters: ReadonlyArray<ResourceFormatter> = field.getResources()
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data: ResourceIdentifier | null = (value || EMPTY_OBJECT).data

  if (isSome(data)) {
    const resourceIdentifierResult = getResourceIdentifierResult(resourceFormatters, data, pointer)

    const [resourceIdentifier, validationErrors] = resourceIdentifierResult
    if (fieldName in includeFilter && !validationErrors.length) {
      return decodeIncludedRelationshipData(
        field,
        fieldName,
        resourceIdentifier,
        included,
        fieldsFilter,
        includeFilter,
        pointer,
      )
    }
    return resourceIdentifierResult
  }

  return field.matches(ResourceFieldFlag.MaybeGet)
    ? success(null)
    : validationFailure(
        data,
        `Required To-One Relationship Not Found`,
        `To-One relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
        pointer.concat([fieldName]),
      )
}
