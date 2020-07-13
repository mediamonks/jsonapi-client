import { Predicate } from 'isntnt'

import {
  AttributeValue,
  AttributeValueFormatter,
  ResourceConstructor,
  ResourceFieldFactoryRules,
  ResourceFieldMaybeMask,
} from '../../types'

export enum ResourceFieldRoot {
  Attributes = 'attributes',
  Relationships = 'relationships',
}

export enum ResourceFieldRule {
  Never,
  Maybe,
  Always,
}

export enum ResourceFieldMethod {
  Get,
  Post,
  Patch,
}

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

type ResourceFieldMaskIndex = typeof resourceFieldMaskIndex

const resourceFieldMaskIndex = [
  [ResourceFieldFlag.NeverGet, ResourceFieldFlag.MaybeGet, ResourceFieldFlag.AlwaysGet],
  [ResourceFieldFlag.NeverPost, ResourceFieldFlag.MaybePost, ResourceFieldFlag.AlwaysPost],
  [ResourceFieldFlag.NeverPatch, ResourceFieldFlag.MaybePatch, ResourceFieldFlag.AlwaysPatch],
] as const

// ResourceField
/*
 * @private
 */
export default class ResourceField<T extends ResourceFieldRoot, U extends ResourceFieldFlag> {
  readonly root: T
  readonly flag: U

  constructor(root: T, flag: U) {
    this.root = root
    this.flag = flag
  }

  matches(mask: ResourceFieldFlag): boolean {
    return Boolean(this.flag & mask)
  }
}

// AttributeField
export class AttributeField<
  T,
  U extends AttributeValue,
  V extends ResourceFieldFlag
> extends ResourceField<ResourceFieldRoot.Attributes, V> {
  readonly predicate: Predicate<U>
  readonly serialize: (value: T) => U
  readonly deserialize: (value: U) => T

  constructor(flag: V, predicate: Predicate<U>, encoder: AttributeValueFormatter<U, T>) {
    super(ResourceFieldRoot.Attributes, flag)
    this.predicate = predicate
    this.serialize = encoder.serialize
    this.deserialize = encoder.deserialize
  }

  validate(
    value: unknown,
    method: ResourceFieldMethod,
  ): V extends ResourceFieldMaybeMask ? U | null : U {
    if (this.predicate(value)) {
      return value as any
    } else if (this.matches(resourceFieldMaskIndex[method][ResourceFieldRule.Maybe])) {
      return null as any
    }
    if (this.matches(resourceFieldMaskIndex[method][ResourceFieldRule.Never])) {
      throw new Error(`Invalid Attribute (...)`)
    }
    throw new Error(`Invalid Attribute Value (...)`)
  }
}

const reflect = <T>(value: T): T => value

const defaultAttributeFormatter: AttributeValueFormatter<any, any> = {
  serialize: reflect,
  deserialize: reflect,
}

export const createAttributeFieldFactory = <T extends ResourceFieldFactoryRules>(...rules: T) => <
  U extends AttributeValue,
  V = U
>(
  predicate: Predicate<U>,
  formatter: AttributeValueFormatter<U, V> = defaultAttributeFormatter,
): AttributeField<
  V,
  U,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const ruleMasks = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = ruleMasks.reduce((flag, mask) => flag | mask, 0)
  return new AttributeField(flag as any, predicate, formatter)
}

// RelationshipField
export enum RelationshipFieldType {
  ToOne = 'to-one',
  ToMany = 'to-many',
}

export class RelationshipField<
  T extends ResourceConstructor<any, any>,
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

export const createToOneRelationshipFieldFactory = <T extends ResourceFieldFactoryRules>(
  ...rules: T
) => <U extends ResourceConstructor<any, any>>(
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
) => <U extends ResourceConstructor<any, any>>(
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
