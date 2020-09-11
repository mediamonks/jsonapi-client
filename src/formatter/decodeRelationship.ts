import { ResourceValidationErrorObject } from '../error'
import {
  JSONAPIResourceObject,
  ResourceFieldName,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
} from '../types'
import { RelationshipField } from '../resource/field/relationship'
import { decodeToOneRelationship, ToOneRelationshipData } from './decodeToOneRelationship'
import { decodeToManyRelationship, ToManyRelationshipData } from './decodeToManyRelationship'
import { Validation } from '../util/validation'

export type RelationshipData = ToOneRelationshipData | ToManyRelationshipData

export const decodeRelationship = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<RelationshipData, ResourceValidationErrorObject> =>
  (field.isToOneRelationshipField() ? decodeToOneRelationship : decodeToManyRelationship)(
    field as any,
    fieldName,
    resourceObject,
    included,
    fieldsFilter,
    includeFilter,
    pointer,
  )
