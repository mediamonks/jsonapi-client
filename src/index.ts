import { Api } from './lib/Api'
import { ApiSetup } from './lib/ApiSetup'
import { resource as resourceOfType } from './lib/Resource'

export namespace JSONAPI {
  export const resource = resourceOfType
  export const client = <S extends Partial<ApiSetup>>(url: URL, setup: S = {} as S) => {
    return new Api(url, setup)
  }
}

export default JSONAPI

export {
  ApiEndpoint,
  ApiEndpointResource,
  ApiEndpointSetup,
  FilteredResource,
} from './lib/ApiEndpoint'
export {
  ApiSetup,
  ApiSetupCreatePageQuery,
  ApiSetupParseRequestError,
  ApiSetupWithDefaults,
  DefaultApiSetup,
} from './lib/ApiSetup'
export {
  resource,
  AnyResource,
  ResourceAttributes,
  ResourceAttributeNames,
  ResourceConstructor,
  ResourceFieldNames,
  ResourceRelationships,
  ResourceRelationshipNames,
  ResourceType,
} from './lib/Resource'
export { ResourceIdentifier, ResourceIdentifierKey } from './lib/ResourceIdentifier'
export {
  optionalAttribute,
  requiredAttribute,
  Attribute,
  AttributeFlag,
  AttributeValue,
  Relationship,
  RelationshipFlag,
  RelationshipValue,
  ResourceFieldName,
  ResourceFields,
  toManyRelationship,
  toOneRelationship,
} from './lib/ResourceField'
