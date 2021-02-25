import {
  RelationshipFieldType,
  ResourceFieldFlag,
  ResourceFieldMethod,
  ResourceFieldRoot,
  ResourceFieldRule,
} from '../../data/enum'
import {
  ToOneRelationshipFieldFromFactory,
  ToManyRelationshipFieldFromFactory,
  ResourceFieldFactoryRules,
} from '../../types'
import { ResourceFormatter } from '../../formatter'
import { ResourceField, ResourceFieldMaskIndex, resourceFieldMaskIndex } from '../field'

export const createToOneRelationshipFieldFactory = <T extends ResourceFieldFactoryRules>(
  ...rules: T
) => <U extends ResourceFormatter>(
  getFormatter: () => U,
): RelationshipField<
  U,
  RelationshipFieldType.ToOne,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = maskRules.reduce((flag, mask) => flag | mask, 0 as ResourceFieldFlag)
  return new RelationshipField(flag as any, RelationshipFieldType.ToOne, getFormatter)
}

export const createToManyRelationshipFieldFactory = <T extends ResourceFieldFactoryRules>(
  ...rules: T
) => <U extends ResourceFormatter>(
  getFormatter: () => U,
): RelationshipField<
  U,
  RelationshipFieldType.ToMany,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = maskRules.reduce((flag, mask) => flag | mask, 0 as ResourceFieldFlag)
  return new RelationshipField(flag as any, RelationshipFieldType.ToMany, getFormatter)
}

export class RelationshipField<
  T extends ResourceFormatter,
  U extends RelationshipFieldType,
  V extends ResourceFieldFlag
> extends ResourceField<ResourceFieldRoot.Relationships, V> {
  relationshipType: U
  getFormatter: () => T

  constructor(flag: V, relationshipType: U, getFormatter: () => T) {
    super(ResourceFieldRoot.Relationships, flag)
    this.relationshipType = relationshipType
    this.getFormatter = getFormatter
  }
}

export namespace Relationship {
  export const toOne = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type ToOne<T extends ResourceFormatter> = ToOneRelationshipFieldFromFactory<
    T,
    typeof toOne
  >

  export const toOneRequired = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type ToOneRequired<T extends ResourceFormatter> = ToOneRelationshipFieldFromFactory<
    T,
    typeof toOneRequired
  >

  export const toOneReadOnly = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Forbidden,
  )

  export type ToOneReadOnly<T extends ResourceFormatter> = ToOneRelationshipFieldFromFactory<
    T,
    typeof toOneReadOnly
  >

  export const toMany = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type ToMany<T extends ResourceFormatter> = ToManyRelationshipFieldFromFactory<
    T,
    typeof toMany
  >

  export const toManyRequired = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type ToManyRequired<T extends ResourceFormatter> = ToManyRelationshipFieldFromFactory<
    T,
    typeof toManyRequired
  >

  export const toManyReadOnly = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Forbidden,
  )

  export type ToManyReadOnly<T extends ResourceFormatter> = ToManyRelationshipFieldFromFactory<
    T,
    typeof toManyReadOnly
  >
}
