import type { AttributeField } from './field/attribute'
import type { RelationshipField } from './field/relationship'
import { RelationshipFieldType, ResourceFieldFlag, ResourceFieldRoot } from '../enum'

/** @hidden */
export type ResourceFieldMaskIndex = typeof resourceFieldMaskIndex

/** @hidden */
export const resourceFieldMaskIndex = [
  [ResourceFieldFlag.NeverGet, ResourceFieldFlag.MaybeGet, ResourceFieldFlag.AlwaysGet],
  [ResourceFieldFlag.NeverPost, ResourceFieldFlag.MaybePost, ResourceFieldFlag.AlwaysPost],
  [ResourceFieldFlag.NeverPatch, ResourceFieldFlag.MaybePatch, ResourceFieldFlag.AlwaysPatch],
] as const

// ResourceField
/** @hidden */
export class ResourceField<T extends ResourceFieldRoot = any, U extends ResourceFieldFlag = any> {
  readonly root: T
  readonly flag: U

  constructor(root: T, flag: U) {
    this.root = root
    this.flag = flag
  }

  matches(mask: ResourceFieldFlag): boolean {
    return Boolean(this.flag & mask)
  }

  isAttributeField(): this is AttributeField<any, any, any> {
    return this.root === ResourceFieldRoot.Attributes
  }

  isRelationshipField(): this is RelationshipField<any, any, any> {
    return this.root === ResourceFieldRoot.Relationships
  }

  isToOneRelationshipField(): this is RelationshipField<any, RelationshipFieldType.ToOne, any> {
    return this.isRelationshipField() && this.relationshipType === RelationshipFieldType.ToOne
  }

  isToManyRelationshipField(): this is RelationshipField<any, RelationshipFieldType.ToMany, any> {
    return this.isRelationshipField() && this.relationshipType === RelationshipFieldType.ToMany
  }
}
