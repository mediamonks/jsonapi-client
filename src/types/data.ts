import { SerializableObject, SerializablePrimitive, Serializable } from 'isntnt';

import { JSONAPISearchParameters, JSONAPIParameterValue } from '../utils/url';
import { Transform, XOR } from '../types/util';
import { ClientSetup } from '../lib/Client';
import {
  AnyResource,
  ResourceAttributeNames,
  ResourceRelationshipNames,
  ResourceType,
  ResourceId,
} from '../lib/Resource';
import { ResourceIdentifier } from '../lib/ResourceIdentifier';

export type JSONAPIClientSearchParameters<S extends Partial<ClientSetup>> =
  JSONAPISearchParameters & {
    page?: S['createPageQuery'] extends Transform<infer R, any> ? R : JSONAPIParameterValue;
  };

export type JSONAPIVersion = '1.0' | '1.1';

export type JSONAPIErrorObject = {
  id?: string;
  links?: JSONAPILinksObject;
  meta?: JSONAPIMetaObject;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: SerializableObject & {
    pointer?: string;
    parameter?: string;
  };
};

export type JSONAPIDocumentIncluded<R extends AnyResource> = Array<JSONAPIResourceObject<R>>;

export type JSONAPILink =
  | string
  | {
      href: string;
      meta: JSONAPIMetaObject;
    };

export type JSONAPILinksObject = { [key: string]: JSONAPILink };

export type JSONAPITopLevelLinksObject = {
  self?: JSONAPILink;
  related?: JSONAPILink;
  first?: JSONAPILink | null;
  last?: JSONAPILink | null;
  prev?: JSONAPILink | null;
  next?: JSONAPILink | null;
};

export type JSONAPIMetaObject = SerializableObject;

type BaseJSONAPIDocument = {
  meta: JSONAPIMetaObject;
  links?: JSONAPITopLevelLinksObject;
  jsonapi?: {
    version?: JSONAPIVersion;
    meta?: SerializableObject;
  };
};

type BaseSuccessJSONAPIDocument<R extends AnyResource> = {
  data?: JSONAPIResourceObject<R>;
  included?: JSONAPIDocumentIncluded<AnyResource>;
};

type BaseFailedJSONAPIDocument = {
  errors?: Array<JSONAPIErrorObject>;
};

export type JSONAPIDocument<R extends AnyResource> = BaseJSONAPIDocument &
  XOR<BaseSuccessJSONAPIDocument<R>, BaseFailedJSONAPIDocument>;

export type JSONAPIAttribute =
  | SerializablePrimitive
  | Array<Serializable>
  | (SerializableObject & {
      relationships?: never;
      links?: never;
    });

export type JSONAPIAttributesObject = {
  [K in string]: JSONAPIAttribute;
};

export type ResourceIdentifierObject = {
  type: ResourceType;
  id: ResourceId;
  meta?: JSONAPIMetaObject;
};

export type JSONAPIResourceObject<R extends AnyResource> = {
  type: R['type'];
  id: R['id'];
  attributes?: {
    [K in ResourceAttributeNames<R>]: R[K];
  };
  relationships?: {
    [K in ResourceRelationshipNames<R>]: {
      data?: R[K] extends Array<AnyResource>
        ? Array<ResourceIdentifier<R[K][number]['type']>>
        : ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null;
      links?: JSONAPILinksObject;
      meta?: JSONAPIMetaObject;
    };
  };
  meta?: JSONAPIMetaObject;
  links?: JSONAPILinksObject;
};
