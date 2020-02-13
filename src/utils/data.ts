import { isArray, isObject, isNull, isSerializablePrimitive, SerializablePrimitive } from 'isntnt'

import { WithoutNever } from '../types/util'

type ObjectKeys = <T extends Record<string, any>>(value: T) => Array<keyof T>

export const keys = Object.keys as ObjectKeys

export const createEmptyObject = (): {} => Object.create(null)

export enum HTTPRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

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
