import {
  Serializable,
  isArray,
  isObject,
  isNull,
  either,
  Predicate,
  isSerializablePrimitive,
} from 'isntnt'

import { defaultRequestHeaders } from '../constants/jsonApi'
import { SerializableObject, SerializablePrimitive } from '../types/data'
import { WithoutNever } from '../types/util'

export const keys = <T extends Record<string, any>>(value: T): Array<keyof T> => Object.keys(value)

export const createEmptyObject = (): {} => Object.create(null)

type DataValue<T> = T extends Function
  ? never
  : T extends Array<any>
  ? Array<DataValue<T[number]>>
  : T extends { [K in string]: any }
  ? WithoutNever<
      {
        [K in keyof T]: DataValue<T[K]>
      }
    >
  : T extends SerializablePrimitive
  ? T
  : never

export const createDataValue = <T>(
  data: T,
): T extends Function | undefined ? null : DataValue<T> => {
  if (isArray(data)) {
    return data.map(createDataValue) as any
  } else if (isObject(data)) {
    const target = createEmptyObject()
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const value = createDataValue(data[key])
        // Omit values that are not data values
        if (isNull(data[key]) || !isNull(value)) {
          ;(target as any)[key] = createDataValue(data[key])
        }
      }
    }
    return target as any
  }
  if (isSerializablePrimitive(data)) {
    return data as any
  }
  return null as any
}

type RequestMethodWithoutBody = RequestMethod.GET | RequestMethod.DELETE
type RequestMethodWithBody = RequestMethod.POST | RequestMethod.PATCH

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

type RequestOptions = {
  href: string
  headers: SerializableObject
}

type RequestOptionsWithBody = RequestOptions & {
  method: RequestMethodWithBody
  body: Serializable
}

type RequestOptionsWithoutBody = RequestOptions & {
  method: RequestMethodWithoutBody
}

type CreateRequestOptionsOverload = {
  (method: RequestMethodWithoutBody): RequestOptionsWithoutBody
  (method: RequestMethodWithBody, data: Serializable): RequestOptionsWithBody
}

const isRequestMethodWithBody: Predicate<RequestMethodWithBody> = either(
  RequestMethod.POST,
  RequestMethod.PATCH,
)

export const createRequestOptions: CreateRequestOptionsOverload = (
  method: RequestMethod,
  data?: Serializable,
) =>
  createDataValue({
    method,
    headers: defaultRequestHeaders,
    // An 'undefined' body will be omitted by createDataValue
    body: isRequestMethodWithBody(method) ? JSON.stringify(data) : (undefined as any),
  }) as any
