import { ApiClient } from './lib/ApiClient'
import { ApiEndpoint } from './lib/ApiEndpoint'
import { ApiSetup } from './lib/ApiSetup'
import { resource as resourceFactory, AnyResource, ResourceConstructor } from './lib/Resource'

export namespace JSONAPI {
  export const resource = resourceFactory

  export const client = <S extends Partial<ApiSetup>>(url: URL, setup: S = {} as S) => {
    return new ApiClient(url, setup)
  }

  export const endpoint = <R extends AnyResource, S extends Partial<ApiSetup>>(
    client: ApiClient<S>,
    path: string,
    Resource: ResourceConstructor<R>,
  ) => {
    return new ApiEndpoint(client, path, Resource)
  }
}

export default JSONAPI

export { ApiEndpoint } from './lib/ApiEndpoint'

export {
  ApiSetup,
  ApiSetupCreatePageQuery,
  ApiSetupParseRequestError,
  ApiSetupWithDefaults,
  DefaultApiSetup,
} from './lib/ApiSetup'

export {
  AnyResource,
  ResourceConstructor,
  ResourceFieldNames,
  ResourceFieldsParameter,
  ResourceIncludeParameter,
  ResourceParameters,
  ResourceType,
  FilteredResource,
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
