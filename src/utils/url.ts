import { isArray, isString, isObject, isSerializableNumber, or, and, isSome } from 'isntnt'

import { __DEV__, EMPTY_ARRAY } from '../constants/data'
import { Api } from '../lib/Api'

type URLParameterName = string
type URLParameterValue = string

export type URLParametersEntry = [URLParameterName, URLParameterValue]

export type JSONAPISortParameterValue = Array<string>

export type JSONAPIFieldsParameterValue = {
  [K in string]: ReadonlyArray<string>
}

export type JSONAPIIncludeParameterValue =
  | null
  | {
      [K in string]?: JSONAPIIncludeParameterValue
    }

export type JSONAPISearchParameters = {
  [key: string]: JSONAPISearchParameterValue
} & {
  sort?: JSONAPISortParameterValue
  include?: JSONAPIIncludeParameterValue
}

export type JSONAPISearchParameterValue =
  | string
  | number
  | boolean
  | null
  | {
      [K in string]: JSONAPISearchParameterValue
    }
  | Array<string | number>

const isPrimitiveParameterValue = or(
  isSerializableNumber,
  and(isString, (value: any): value is string => value.length > 0),
)

export const appendJSONAPIParameters = (
  api: Api<any>,
  url: URL,
  parameters: JSONAPISearchParameters,
) => {
  parseJSONAPIParameters(api, parameters).forEach(([name, value]) =>
    url.searchParams.append(name, value),
  )
}

export const parseJSONAPIParameters = (
  api: Api<any>,
  jsonapiParameters: JSONAPISearchParameters,
): ReadonlyArray<URLParametersEntry> =>
  Object.keys(jsonapiParameters)
    .reduce((parameterEntries, name) => {
      const value = jsonapiParameters[name as keyof typeof jsonapiParameters]
      switch (name) {
        case 'include': {
          return parameterEntries.concat(
            parseJSONAPIIncludeParameter(value as JSONAPIIncludeParameterValue),
          )
        }
        case 'sort': {
          return parameterEntries.concat(
            parseJSONAPISortParameter(value as JSONAPISortParameterValue),
          )
        }
        case 'page': {
          const apiPageQuery = api.setup.createPageQuery(value)
          return parameterEntries.concat(parseJSONAPIParameter(name, apiPageQuery))
        }
        default:
          return parameterEntries.concat(parseJSONAPIParameter(name, value))
      }
    }, [] as Array<URLParametersEntry>)
    .sort(([aName, aValue], [bName, bValue]) => {
      if (aName === bName) {
        if (aValue === bValue) {
          return 0
        }
        return aValue > bValue ? 1 : -1
      }
      return aName > bName ? 1 : -1
    })

export const parseJSONAPIParameter = (
  name: URLParameterName,
  value: unknown,
): ReadonlyArray<URLParametersEntry> => {
  if (isArray(value)) {
    return parseArrayParameter(name, value as Array<any>)
  }
  if (isObject(value)) {
    return parseJSONAPIObjectParameter(name, value)
  }
  return parsePrimitiveParameter(name, value)
}

export const parseJSONAPIIncludeParameter = (
  value: JSONAPIIncludeParameterValue,
): ReadonlyArray<URLParametersEntry> =>
  isSome(value)
    ? parseArrayParameter('include', parseJSONAPIIncludeParameterValue(EMPTY_ARRAY, value))
    : EMPTY_ARRAY

export const parseJSONAPISortParameter = (
  value: JSONAPISortParameterValue,
): ReadonlyArray<URLParametersEntry> =>
  isArray(value) ? parseArrayParameter('sort', value) : EMPTY_ARRAY

export const parseJSONAPIObjectParameter = (
  name: URLParameterName,
  value: object,
): ReadonlyArray<URLParametersEntry> =>
  Object.keys(value).flatMap((key) =>
    parseJSONAPIParameter(`${name}[${key}]`, value[key as keyof typeof value]),
  )

export const parsePrimitiveParameter = (
  name: URLParameterName,
  value: unknown,
): ReadonlyArray<URLParametersEntry> => {
  if (value === true) {
    return [[name, '']]
  }
  if (isPrimitiveParameterValue(value)) {
    return [[name, String(value)]]
  }
  return EMPTY_ARRAY
}

export const parseArrayParameter = (
  name: URLParameterName,
  value: ReadonlyArray<string | number>,
): ReadonlyArray<URLParametersEntry> =>
  parsePrimitiveParameter(name, value.filter(isPrimitiveParameterValue).join(','))

export const parseJSONAPIIncludeParameterValue = (
  path: ReadonlyArray<string>,
  value: JSONAPIIncludeParameterValue,
): ReadonlyArray<string> =>
  isSome(value)
    ? Object.keys(value)
        .sort()
        .map((name) => {
          const children = value[name as keyof typeof value]
          const childPath = path.concat(name)
          return isSome(children)
            ? parseJSONAPIIncludeParameterValue(childPath, children).join(',')
            : childPath.join('.')
        })
        .sort()
    : EMPTY_ARRAY
