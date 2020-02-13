import { Client } from './lib/Client'
import { Endpoint } from './lib/Endpoint'
import { ClientSetup } from './lib/Client'
import { AnyResource, ResourceConstructor, ResourceFieldsModel, ResourceType } from './lib/Resource'
import { ResourceIdentifier, ResourceIdentifierKey } from './lib/ResourceIdentifier'
import { ResourceField, ResourceFieldName } from './lib/ResourceField'
import { JSONAPISearchParameters } from './utils/url'
import {
  JSONAPIVersion,
  JSONAPIResourceObject,
  JSONAPIMetaObject,
  JSONAPILinksObject,
  JSONAPILink,
  JSONAPIClientSearchParameters,
  JSONAPIDocument,
  JSONAPIAttribute,
  JSONAPIAttributesObject,
} from './types/data'

const JSONAPI = {
  resource<T extends ResourceType>(type: T, path: string = type) {
    return class Resource<
      M extends ResourceFieldsModel<Omit<M, ResourceIdentifierKey>>
    > extends ResourceIdentifier<T> {
      static type: T = type
      static path: string = path.replace(/^\/*(.*?)\/*$/, '$1') // remove leading/trailing slash
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
    Resource: ResourceConstructor<R>,
  ) {
    return new Endpoint(client, Resource)
  },
}

namespace JSONAPI {
  export type Version = JSONAPIVersion
  export type Document<R extends AnyResource> = JSONAPIDocument<R>
  export type ResourceObject<R extends AnyResource> = JSONAPIResourceObject<R>
  export type Attribute = JSONAPIAttribute
  export type AttributesObject = JSONAPIAttributesObject
  export type Link = JSONAPILink
  export type LinksObject = JSONAPILinksObject
  export type MetaObject = JSONAPIMetaObject
  export type SearchParameters<S extends ClientSetup = never> = S extends never
    ? JSONAPISearchParameters
    : JSONAPIClientSearchParameters<S>
}

export default JSONAPI

export {
  Client,
  ClientSetup,
  ClientSetupWithDefaults,
  ClientSearchParameters,
  DefaultClientSetup,
} from './lib/Client'

export { Endpoint, EndpointResource, EndpointSetup } from './lib/Endpoint'

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
  ResourcePatchValues,
  ResourceCreateValues,
  ResourceAttributeNames,
  ResourceRelationshipNames,
} from './lib/Resource'

export { ResourceIdentifier, ResourceIdentifierKey } from './lib/ResourceIdentifier'

export {
  Attribute,
  AttributeFlag,
  AttributeValue,
  Relationship,
  RelationshipFlag,
  RelationshipValue,
  ResourceFieldName,
  ResourceFields,
} from './lib/ResourceField'

export { EntityResult, CollectionResult } from './lib/Result'
