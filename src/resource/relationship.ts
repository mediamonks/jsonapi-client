import {
  createToManyRelationshipFieldFactory,
  createToOneRelationshipFieldFactory,
  ResourceFieldRule,
} from './field'
import {
  ToOneRelationshipFieldFromFactory,
  ToManyRelationshipFieldFromFactory,
  ResourceConstructor,
} from '../types'

namespace Relationship {
  export const toOne = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToOne<
    T extends ResourceConstructor<any, any>
  > = ToOneRelationshipFieldFromFactory<T, typeof toOne>

  export const toOneRequired = createToOneRelationshipFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export const toMany = createToManyRelationshipFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type ToMany<
    T extends ResourceConstructor<any, any>
  > = ToManyRelationshipFieldFromFactory<T, typeof toMany>
}

export default Relationship
