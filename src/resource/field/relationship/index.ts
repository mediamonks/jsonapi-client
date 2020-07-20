import {
  ToOneRelationshipFieldFromFactory,
  ToManyRelationshipFieldFromFactory,
  ResourceFieldFactoryRules,
} from '../../../types'
import { ResourceFormatter } from '../../formatter'
import {
  ResourceField,
  ResourceFieldRule,
  ResourceFieldFlag,
  ResourceFieldRoot,
  ResourceFieldMaskIndex,
  ResourceFieldMethod,
  resourceFieldMaskIndex,
} from '..'

export enum RelationshipFieldType {
  ToOne = 'to-one',
  ToMany = 'to-many',
}

export const createToOneRelationshipFieldFactory = <T extends ResourceFieldFactoryRules>(
  ...rules: T
) => <U extends ResourceFormatter<any, any>>(
  getResources: () => Array<U>,
): RelationshipField<
  U,
  RelationshipFieldType.ToOne,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  return new RelationshipField(maskRules as any, RelationshipFieldType.ToOne, getResources)
}

export const createToManyRelationshipFieldFactory = <T extends ResourceFieldFactoryRules>(
  ...rules: T
) => <U extends ResourceFormatter<any, any>>(
  getResources: () => Array<U>,
): RelationshipField<
  U,
  RelationshipFieldType.ToMany,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  return new RelationshipField(maskRules as any, RelationshipFieldType.ToMany, getResources)
}

export class RelationshipField<
  T extends ResourceFormatter<any, any>,
  U extends RelationshipFieldType,
  V extends ResourceFieldFlag
> extends ResourceField<ResourceFieldRoot.Relationships, V> {
  relationshipType: U
  getResources: () => Array<T>

  constructor(flag: V, relationshipType: U, getResources: () => Array<T>) {
    super(ResourceFieldRoot.Relationships, flag)
    this.relationshipType = relationshipType
    this.getResources = getResources
  }
}

export namespace Relationship {
  export const toOne = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToOne<T extends ResourceFormatter<any, any>> = ToOneRelationshipFieldFromFactory<
    T,
    typeof toOne
  >

  export const toOneRequired = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToOneRequired<
    T extends ResourceFormatter<any, any>
  > = ToOneRelationshipFieldFromFactory<T, typeof toOneRequired>

  export const toOneReadOnly = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type ToOneReadOnly<
    T extends ResourceFormatter<any, any>
  > = ToOneRelationshipFieldFromFactory<T, typeof toOneReadOnly>

  export const toMany = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToMany<T extends ResourceFormatter<any, any>> = ToManyRelationshipFieldFromFactory<
    T,
    typeof toMany
  >

  export const toManyRequired = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToManyRequired<
    T extends ResourceFormatter<any, any>
  > = ToManyRelationshipFieldFromFactory<T, typeof toManyRequired>

  export const toManyReadOnly = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type ToManyReadOnly<
    T extends ResourceFormatter<any, any>
  > = ToManyRelationshipFieldFromFactory<T, typeof toManyReadOnly>
}
