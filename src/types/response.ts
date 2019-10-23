import { AnyResource } from '../lib/Resource'

export type ApiResponse = {
  data?: ApiResponseData<AnyResource>
  meta: SerializableObject
  errors?: Array<ApiResponseError>
  included?: ApiResponseIncludedData
}

// type ApiSuccessResponse = Required<Omit<ApiResponse, 'errors'>>
// type ApiErrorResponse = Required<Omit<ApiResponse, 'data' | 'included'>>

type SerializableValue =
  | SerializablePrimitive
  | SerializableArray
  | SerializableObject
type SerializablePrimitive = string | number | boolean | null
type SerializableArray = Array<SerializableValue>
type SerializableObject = {
  [key: string]: SerializableValue
}

export type ApiResponseData<T extends AnyResource> = T | Array<T>
export type ApiResponseMeta<T extends SerializableObject> = T
export type ApiResponseError = {}
export type ApiResponseIncludedData = Array<{}>

export class ApiResult<T, E> {}
