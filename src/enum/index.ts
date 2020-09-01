// Whether a relative path that starts with '/' will start from the client url or the url domain
export enum AbsolutePathRoot {
  Domain = 'domain',
  Client = 'client',
}

// To what degree relationship data is included by default
export enum ImplicitIncludes {
  None = 'none',
  All = 'all',
  PrimaryRelationships = 'primary-relationships',
}

export enum InitialRelationshipData {
  None = 'none',
  ResourceIdentifiers = 'resource-identifiers',
}

export enum RelationshipFieldLinks {
  None = 'none',
  Links = 'links',
  SelfLink = 'self-links',
  MetaLink = 'meta-links',
}

export enum ResourceFieldRoot {
  Attributes = 'attributes',
  Relationships = 'relationships',
}

export enum RelationshipFieldType {
  ToOne = 'to-one',
  ToMany = 'to-many',
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
