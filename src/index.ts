import { Client, JSONAPISearchParameters } from './lib/Client'
import { Endpoint } from './lib/Endpoint'
import { ClientSetup } from './lib/ClientSetup'
import { AnyResource, ResourceConstructor, ResourceFieldsModel, ResourceType } from './lib/Resource'
import { ResourceIdentifier, ResourceIdentifierKey } from './lib/ResourceIdentifier'
import { ResourceField, ResourceFieldName } from './lib/ResourceField'
import { JSONAPIVersion } from './constants/jsonApi'

const JSONAPI = {
  resource<T extends ResourceType>(type: T, path: string = type) {
    return class Resource<
      M extends ResourceFieldsModel<Omit<M, ResourceIdentifierKey>>
    > extends ResourceIdentifier<T> {
      static type: T = type
      static path: string = path
      static fields: Record<ResourceFieldName, ResourceField<any, any>> = Object.create(null)

      constructor(data: ResourceIdentifier<T> & M) {
        super(data.type, data.id)
        Object.assign(this, data)
      }
    }
  },
  client<S extends Partial<ClientSetup>>(url: URL, setup: S = {} as S) {
    return new Client(url, setup)
  },
  endpoint<R extends AnyResource, S extends Partial<ClientSetup>>(
    client: Client<S>,
    path: string,
    Resource: ResourceConstructor<R>,
  ) {
    return new Endpoint(client, path, Resource)
  },
}

namespace JSONAPI {
  export type Version = JSONAPIVersion
  export type SearchParameters<S extends Partial<ClientSetup>> = JSONAPISearchParameters<S>
}

export default JSONAPI

export { Client, JSONAPISearchParameters } from './lib/Client'

export { Endpoint, ApiEndpointResource, ApiEndpointSetup } from './lib/Endpoint'

export {
  ClientSetup,
  ClientSetupCreatePageQuery,
  ClientSetupParseRequestError,
  ClientSetupWithDefaults,
  DefaultClientSetup,
} from './lib/ClientSetup'

export {
  AnyResource,
  FilteredResource,
  ResourceConstructor,
  ResourceFieldsParameter,
  ResourceFieldNames,
  ResourceId,
  ResourceToOneRelationshipNames,
  ResourceToManyRelationshipNames,
  ResourceIncludeParameter,
  ResourceParameters,
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
