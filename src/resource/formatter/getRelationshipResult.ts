import { ResourceValidationErrorObject } from '../../error'
import { JSONAPIResourceObject, ResourceFieldsQuery, ResourceIncludeQuery } from '../../types'
import { RelationshipField } from '../field/relationship'
import { getToOneRelationshipResult, ToOneRelationshipData } from './getToOneRelationshipResult'
import { getToManyRelationshipResult, ToManyRelationshipData } from './getToManyRelationshipResult'
import { Result } from './result'

export type RelationshipData = ToOneRelationshipData | ToManyRelationshipData

export const getRelationshipResult = (
  field: RelationshipField<any, any, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  included: Array<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Result<RelationshipData, ResourceValidationErrorObject> =>
  (field.isToOneRelationshipField() ? getToOneRelationshipResult : getToManyRelationshipResult)(
    field as any,
    fieldName,
    resourceObject,
    included,
    fieldsFilter,
    includeFilter,
    pointer,
  )
