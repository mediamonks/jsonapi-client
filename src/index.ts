import { Api } from './lib/Api'
export default Api

export {
  ApiEndpoint,
  ApiEndpointResource,
  ApiEndpointSetup,
  FilteredResource,
} from './lib/ApiEndpoint'
export {
  ApiQuery,
  ApiQueryParameter,
  ApiQueryParameters,
  ApiQueryParameterValue,
  ApiQueryFieldsParameter,
  ApiQueryIncludeParameter,
  ApiQueryPageParameter,
  ApiQuerySortParameter,
  ApiQueryResourceParameters,
  ApiQueryFiltersParameters,
  ApiQueryFilterParameter,
} from './lib/ApiQuery'
export {
  ApiSetup,
  ApiSetupCreatePageQuery,
  ApiSetupParseRequestError,
  ApiSetupWithDefaults,
  DefaultApiSetup,
} from './lib/ApiSetup'
export { ApiEntityResult, ApiCollectionResult } from './lib/ApiResult'
export { ascend, descend, sort } from './lib/ApiSortRule'
export {
  resource,
  AnyResource,
  ResourceId,
  ResourceCreateValues,
  ResourcePatchValues,
  ResourceAttributes,
  ResourceAttributeNames,
  ResourceConstructor,
  ResourceFieldNames,
  ResourceRelationships,
  ResourceRelationshipNames,
  ResourceToManyRelationshipNames,
  ResourceToOneRelationshipNames,
  ResourceType,
} from './lib/Resource'
export {
  optionalAttribute,
  requiredAttribute,
  AttributeField,
  AttributeValue,
  OptionalAttribute,
  OptionalAttributeField,
  RequiredAttribute,
  RequiredAttributeField,
} from './lib/ResourceAttribute'
export { ResourceField, ResourceFieldName, ResourceFields } from './lib/ResourceField'
export { ResourceIdentifier, ResourceIdentifierKey } from './lib/ResourceIdentifier'
export {
  toManyRelationship,
  toOneRelationship,
  RelationshipField,
  ToManyRelationshipField,
  ToOneRelationshipField,
  ToManyRelationship,
  ToOneRelationship,
} from './lib/ResourceRelationship'
