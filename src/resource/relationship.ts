import {
  createToManyRelationshipFieldFactory,
  createToOneRelationshipFieldFactory,
  ResourceFieldRule,
} from '../resource/field'
import {
  ToOneRelationshipFieldFromFactory,
  ToManyRelationshipFieldFromFactory,
  ResourceFormatter,
} from '../types'

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
