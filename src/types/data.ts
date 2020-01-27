import { AnyResource } from '../lib/Resource'

export type AnyApiResponseData = ApiResponseData<AnyResource>
export type AnyApiResponseMeta = ApiResponseMeta<SerializableObject>

export type ApiResponse<D extends AnyApiResponseData, M extends AnyApiResponseMeta> = {
  data?: D
  meta: M
  errors?: Array<ApiResponseError>
  included?: ApiResponseIncludedData
}

export type ApiSuccessResponse<
  D extends AnyApiResponseData,
  M extends AnyApiResponseMeta
> = Required<Omit<ApiResponse<D, M>, 'errors'>>

export type ApiErrorResponse<D extends AnyApiResponseData, M extends AnyApiResponseMeta> = Required<
  Omit<ApiResponse<D, M>, 'data' | 'included'>
>

export type Serializable = SerializablePrimitive | SerializableArray | SerializableObject

export type SerializablePrimitive = string | number | boolean | null
export type SerializableArray = Array<Serializable>
export type SerializableObject = {
  [key: string]: Serializable
}

export type ApiResponseData<T extends AnyResource> = T | Array<T>

export type ApiResponseMeta<T extends SerializableObject> = T

export type ApiResponseError = {
  id?: string
  links?: JsonApiLinksObject
  meta?: JsonApiMetaData<SerializableObject>
  status?: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
}

export type ApiResponseIncludedData = Array<{}>

export type JsonApiMetaData<T extends SerializableObject> = T

export type JsonApiLink =
  | string
  | {
      href: string
      meta: JsonApiMetaData<SerializableObject>
    }

export type JsonApiLinksObject = { [key: string]: JsonApiLink | null }
