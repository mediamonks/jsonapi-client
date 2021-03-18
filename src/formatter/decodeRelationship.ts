import { ResourceValidationErrorObject } from '../error'
import {
  JSONAPIResourceObject,
  ResourceFieldName,
  ResourceFieldsQuery,
  ResourceIncludeQuery,
} from '../types'
import { RelationshipField } from '../resource/field/relationship'
import {
  decodeToOneRelationship,
  decodeToOneRelationshipValue,
  ToOneRelationshipData,
} from './decodeToOneRelationship'
import {
  decodeToManyRelationship,
  decodeToManyRelationshipValue,
  ToManyRelationshipData,
} from './decodeToManyRelationship'
import { Validation } from '../util/validation'
import { BaseIncludedResourceMap } from './decodeDocument'

export type RelationshipData = ToOneRelationshipData | ToManyRelationshipData

export const decodeRelationship = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceObject: JSONAPIResourceObject<any>,
  included: ReadonlyArray<JSONAPIResourceObject>,
  baseIncludedResourceMap: BaseIncludedResourceMap,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Validation<RelationshipData, ResourceValidationErrorObject> =>
  (field.isToOneRelationshipField() ? decodeToOneRelationship : decodeToManyRelationship)(
    field as any,
    fieldName,
    resourceObject,
    included,
    baseIncludedResourceMap,
    fieldsFilter,
    includeFilter,
    pointer,
  )

export const decodeRelationshipValue = (
  field: RelationshipField<any, any, any>,
  fieldName: ResourceFieldName,
  resourceObject: JSONAPIResourceObject<any>,
  pointer: ReadonlyArray<string>,
): Validation<RelationshipData, ResourceValidationErrorObject> =>
  (field.isToOneRelationshipField() ? decodeToOneRelationshipValue : decodeToManyRelationshipValue)(
    field as any,
    fieldName,
    resourceObject,
    pointer,
  )
