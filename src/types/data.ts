import { SerializableObject } from 'isntnt'

import { JSONAPISearchParameters, JSONAPIParameterValue } from '../utils/url'
import { Transform } from '../types/util'
import { ClientSetup } from '../lib/Client'
import { AnyResource } from '../lib/Resource'

export type JSONAPIClientSearchParameters<
  S extends Partial<ClientSetup>
> = JSONAPISearchParameters & {
  page?: S['createPageQuery'] extends Transform<infer R, any> ? R : JSONAPIParameterValue
}

export type AnyJSONAPIResponseData = JSONAPIResponseData<AnyResource>
export type AnyJSONAPIResponseMeta = JSONAPIResponseMeta<SerializableObject>

export type JSONAPIResponse<D extends AnyJSONAPIResponseData, M extends AnyJSONAPIResponseMeta> = {
  data?: D
  meta: M
  errors?: Array<JSONAPIResponseError>
  included?: JSONAPIResponseIncludedData
}

export type ApiSuccessResponse<
  D extends AnyJSONAPIResponseData,
  M extends AnyJSONAPIResponseMeta
> = Required<Omit<JSONAPIResponse<D, M>, 'errors'>>

export type JSONAPIErrorResponse<
  D extends AnyJSONAPIResponseData,
  M extends AnyJSONAPIResponseMeta
> = Required<Omit<JSONAPIResponse<D, M>, 'data' | 'included'>>

// export type Serializable = SerializablePrimitive | SerializableArray | SerializableObject

// export type SerializablePrimitive = string | number | boolean | null
// export type SerializableArray = Array<Serializable>
// export type SerializableObject = {
//   [key: string]: Serializable
// }

export type JSONAPIResponseData<T extends AnyResource> = T | Array<T>

export type JSONAPIResponseMeta<T extends SerializableObject> = T

export type JSONAPIResponseError = {
  id?: string
  links?: JSONAPILinksObject
  meta?: JSONAPIMetaData<SerializableObject>
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
}

export type JSONAPIResponseIncludedData = Array<{}>

export type JSONAPIMetaData<T extends SerializableObject> = T

export type JSONAPILink =
  | string
  | {
      href: string
      meta: JSONAPIMetaData<SerializableObject>
    }

export type JSONAPILinksObject = { [key: string]: JSONAPILink | null }
