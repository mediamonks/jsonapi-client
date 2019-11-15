import { Serializable, isArray, isObject, isString } from 'isntnt'

import { defaultGetRequestHeaders, defaultPostRequestHeaders } from '../constants/jsonApi'

export const keys = <T extends Record<string, any>>(value: T): Array<keyof T> => Object.keys(value)

export const createEmptyObject = (): {} => Object.create(null)

export const createDataValue = <T extends Serializable>(data: T): T => {
  if (isArray(data)) {
    return data.map(createDataValue) as T
  } else if (isObject(data)) {
    const target = createEmptyObject()
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        ;(target as any)[key] = createDataValue(data[key])
      }
    }
    return target as T
  }
  return data
}

export const createGetRequestOptions = () =>
  createDataValue({
    method: 'GET',
    headers: defaultPostRequestHeaders,
  })

export const createPostRequestOptions = (data: Serializable) =>
  createDataValue({
    method: 'POST',
    body: JSON.stringify(data),
    headers: defaultPostRequestHeaders,
  })

export const createPatchRequestOptions = (data: Serializable) =>
  createDataValue({
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: defaultPostRequestHeaders,
  })

export const createDeleteRequestOptions = () =>
  createDataValue({
    method: 'DELETE',
    headers: defaultPostRequestHeaders,
  })
