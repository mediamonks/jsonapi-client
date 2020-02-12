import { SerializableObject, SerializablePrimitive, Serializable } from 'isntnt'

import { JSONAPISearchParameters, JSONAPIParameterValue } from '../utils/url'
import { Transform } from '../types/util'
import { ClientSetup } from '../lib/Client'
import { AnyResource, ResourceAttributeNames, ResourceRelationshipNames } from '../lib/Resource'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'

export type JSONAPIClientSearchParameters<
  S extends Partial<ClientSetup>
> = JSONAPISearchParameters & {
  page?: S['createPageQuery'] extends Transform<infer R, any> ? R : JSONAPIParameterValue
}

export type JSONAPIVersion = '1.0' | '1.1'

export type JSONAPIErrorObject = {
  id?: string
  links?: JSONAPILinksObject
  meta?: JSONAPIMeta
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
}

export type JSONAPIDocumentIncluded<R extends AnyResource> = Array<JSONAPIResourceObject<R>>

export type JSONAPILink =
  | string
  | {
      href: string
      meta: JSONAPIMeta
    }

export type JSONAPILinksObject = { [key: string]: JSONAPILink }

//
export type JSONAPIMeta = SerializableObject

export type JSONAPIDocument<R extends AnyResource> = (
  | {
      data: JSONAPIResourceObject<R> | Array<JSONAPIResourceObject<R>>
      included?: JSONAPIDocumentIncluded<AnyResource>
    }
  | {
      errors: Array<JSONAPIErrorObject>
    }
) & {
  meta: JSONAPIMeta
  links?: JSONAPILinksObject
  jsonapi?: {
    version?: JSONAPIVersion
    meta?: SerializableObject
  }
}

export type JSONAPIAttribute =
  | SerializablePrimitive
  | Array<Serializable>
  | (SerializableObject & {
      relationships?: never
      links?: never
    })

export type JSONAPIAttributesObject = {
  [K in string]: JSONAPIAttribute
}

export type JSONAPIResourceObject<R extends AnyResource> = {
  type: R['type']
  id: R['id']
  attributes?: {
    [K in ResourceAttributeNames<R>]: R[K]
  }
  relationships?: {
    [K in ResourceRelationshipNames<R>]: {
      data?: R[K] extends Array<AnyResource>
        ? Array<ResourceIdentifier<R[K][number]['type']>>
        : ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null
      links?: JSONAPILinksObject
      meta?: JSONAPIMeta
    }
  }
  meta?: JSONAPIMeta
  links?: JSONAPILinksObject
}
