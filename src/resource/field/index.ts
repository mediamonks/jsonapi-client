import type { AttributeField } from './attribute'
import type { RelationshipField, RelationshipFieldType } from './relationship'

export enum ResourceFieldRoot {
  Attributes = 'attributes',
  Relationships = 'relationships',
}

/** @hidden */
export enum ResourceFieldRule {
  Never,
  Maybe,
  Always,
}

/** @hidden */
export enum ResourceFieldMethod {
  Get,
  Post,
  Patch,
}

/** @hidden */
export enum ResourceFieldFlag {
  NeverGet = 1, // 1 << 0
  MaybeGet = 2, // 1 << 1
  AlwaysGet = 4, // 1 << 2
  NeverPost = 8, // 1 << 3
  MaybePost = 16, // 1 << 4
  AlwaysPost = 32, // 1 << 5
  NeverPatch = 64, // 1 << 6
  MaybePatch = 128, // 1 << 7
  AlwaysPatch = 256, // 1 << 8
}

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
    return this.isRelationshipField() && this.relationshipType === 'to-one'
  }

  isToManyRelationshipField(): this is RelationshipField<any, RelationshipFieldType.ToMany, any> {
    return this.isRelationshipField() && this.relationshipType === 'to-many'
  }
}
