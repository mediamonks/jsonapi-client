export enum ResourceFieldRoot {
  Attributes = 'attributes',
  Relationships = 'relationships',
}

/*
 * @private
 */
export enum ResourceFieldRule {
  Never,
  Maybe,
  Always,
}

/*
 * @private
 */
export enum ResourceFieldMethod {
  Get,
  Post,
  Patch,
}

/*
 * @private
 */
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

/*
 * @private
 */
export type ResourceFieldMaskIndex = typeof resourceFieldMaskIndex

/*
 * @private
 */
export const resourceFieldMaskIndex = [
  [ResourceFieldFlag.NeverGet, ResourceFieldFlag.MaybeGet, ResourceFieldFlag.AlwaysGet],
  [ResourceFieldFlag.NeverPost, ResourceFieldFlag.MaybePost, ResourceFieldFlag.AlwaysPost],
  [ResourceFieldFlag.NeverPatch, ResourceFieldFlag.MaybePatch, ResourceFieldFlag.AlwaysPatch],
] as const

// ResourceField
/*
 * @private
 */
export class ResourceField<T extends ResourceFieldRoot, U extends ResourceFieldFlag> {
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
