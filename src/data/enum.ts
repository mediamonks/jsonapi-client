// Whether a relative path that starts with '/' will start from the client url or the url domain
export enum AbsolutePathRoot {
  Domain = 'domain',
  Client = 'client',
}

// To what degree relationship data is included by default
export enum ImplicitInclude {
  None = 'none',
  PrimaryRelationships = 'primary-relationships',
}

export enum RelationshipFieldDataType {
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
  Forbidden,
  Optional,
  Required,
}

/** @hidden */
export enum ResourceFieldMethod {
  Get,
  Post,
  Patch,
}

export enum ResourceFieldFlag {
  GetForbidden = 1, // 1 << 0
  GetOptional = 2, // 1 << 1
  GetRequired = 4, // 1 << 2
  PostForbidden = 8, // 1 << 3
  PostOptional = 16, // 1 << 4
  PostRequired = 32, // 1 << 5
  PatchForbidden = 64, // 1 << 6
  PatchOptional = 128, // 1 << 7
  PatchRequired = 256, // 1 << 8
}

export enum ErrorMessage {
  UnexpectedError = 'Unexpected error',
  FetchNotFound = 'Fetch not found',
  ResourceFieldNotAllowed = 'Resource field not allowed',
}

export enum ValidationErrorMessage {
  JSONAPIDocumentWithErrors = 'JSON:API document has errors',
  FieldNotFound = 'Field not found',
  IncludedResourceNotFound = 'Included resource not found',
  InvalidResourceDocument = 'Invalid JSON:API document',
  InvalidResourceIdentifier = 'Invalid resource identifier object',
  InvalidResourceObject = 'Invalid resource Ooject',
  InvalidResourceType = 'Invalid resource type',
  InvalidResourceId = 'Invalid resource id',
  InvalidResourceField = 'Invalid resource field',
  InvalidAttributeValue = 'Invalid attribute value',
  InvalidToManyRelationshipData = 'Invalid to-Many relationship data',
  InvalidResourceCreateData = 'Invalid resource create data',
  InvalidResourcePatchData = 'Invalid resource patch data',
  MissingRequiredField = 'Missing required field',
}
