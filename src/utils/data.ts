import { Serializable, isArray, isObject, isString } from 'isntnt'

import { defaultGetRequestHeaders } from '../constants/jsonApi'

import { AnyResource, ResourceConstructor } from '../lib/Resource'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'

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

export const createBaseResource = <R extends AnyResource>(
  Resource: ResourceConstructor<R>,
  data: { type?: R['type']; id?: string },
): ResourceIdentifier<R['type']> => {
  if (data.type !== Resource.type) {
    throw new Error(`invalid type`)
  }
  if (!isString(data.id)) {
    throw new Error(`id must be a string`)
  }
  return createDataValue({
    type: data.type,
    id: data.id,
  })
}

export const createGetRequestOptions = () =>
  createDataValue({
    method: 'GET',
    headers: defaultGetRequestHeaders,
  })
