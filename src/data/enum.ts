// Whether a relative path that starts with '/' will start from the client url or the url domain
export enum AbsolutePathRoot {
  Domain = 'domain',
  Client = 'client',
}

// To what degree relationship data is included by default
export enum ImplicitInclude {
  None = 'none',
  All = 'all',
  PrimaryRelationships = 'primary-relationships',
}

export enum RelationshipFieldData {
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
  UnexpectedError = 'Unexpected Error',
  FetchNotFound = 'Fetch Not Found',
  ResourceFieldNotAllowed = 'Resource Field Not Allowed',
}

export enum ValidationErrorMessage {
  JSONAPIDocumentWithErrors = 'JSON:API Document Has Errors',
  FieldNotFound = 'Field Not Found',
  IncludedResourceNotFound = 'Included Resource Not Found',
  InvalidResourceDocument = 'Invalid JSON:API Document',
  InvalidResourceIdentifier = 'Invalid Resource Identifier Object',
  InvalidResourceObject = 'Invalid Resource Object',
  InvalidResourceType = 'Invalid Resource Type',
  InvalidResourceId = 'Invalid Resource Id',
  InvalidResourceField = 'Invalid Resource Field',
  InvalidAttributeValue = 'Invalid Attribute Value',
  InvalidToManyRelationshipData = 'Invalid To-Many Relationship Data',
  InvalidResourceCreateData = 'Invalid Resource Create Data',
  InvalidResourcePatchData = 'Invalid Resource Patch Data',
  MissingRequiredField = 'Missing Required Field',
}
