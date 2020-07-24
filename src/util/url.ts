import { isArray, isObject, isSome, or, isSerializableNumber, and, isString } from 'isntnt'

import {
  ResourceFilter,
  JSONAPISearchParams,
  ResourceIncludeQuery,
  ResourceQueryParams,
  JSONAPISortParams,
} from '../types'

type URLSearchParamEntry = [string, string]

const EMPTY_ARRAY: ReadonlyArray<any> = []

const isPrimitiveParameterValue = or(
  isSerializableNumber,
  and(isString, (value: any): value is string => value.length > 0),
)

/** @hidden */
export const createURL = (
  baseUrl: URL,
  path: ReadonlyArray<string>,
  resourceQuery: ResourceFilter<any> = {},
  searchQuery: JSONAPISearchParams = {},
): URL =>
  parseSearchParams({ ...searchQuery, ...resourceQuery }).reduce((url, [name, value]) => {
    url.searchParams.append(name, value)
    return url
  }, urlWithPath(baseUrl, path))

/** @hidden */
export const urlWithPath = (url: URL, path: ReadonlyArray<string>): URL => {
  const hasTrailingSlash = url.pathname.endsWith('/')
  return new URL(
    `${url.origin}${url.pathname}${(hasTrailingSlash ? path.concat('') : [''].concat(path)).join(
      '/',
    )}${url.search}`,
  )
}

/** @hidden */
export const parseSearchParams = (
  params: JSONAPISearchParams & ResourceQueryParams,
): ReadonlyArray<URLSearchParamEntry> =>
  Object.keys(params)
    .reduce((parameterEntries, name) => {
      const value = params[name as keyof typeof params]
      switch (name) {
        case 'include': {
          return parameterEntries.concat(parseIncludeParam(value as any))
        }
        case 'sort': {
          return parameterEntries.concat(parseSortParam(value as any))
        }
        case 'page': {
          return parameterEntries.concat(parseSearchParam(name, value))
        }
        default:
          return parameterEntries.concat(parseSearchParam(name, value))
      }
    }, [] as Array<URLSearchParamEntry>)
    .sort(([aName, aValue], [bName, bValue]) => {
      if (aName === bName) {
        if (aValue === bValue) {
          return 0
        }
        return aValue > bValue ? 1 : -1
      }
      return aName > bName ? 1 : -1
    })

/** @hidden */
export const parseSearchParam = (
  name: string,
  value: unknown,
): ReadonlyArray<URLSearchParamEntry> => {
  if (isArray(value)) {
    return parseArrayParam(name, value as Array<any>)
  }
  if (isObject(value)) {
    return parseObjectParam(name, value)
  }
  return parsePrimitiveParam(name, value)
}

/** @hidden */
export const parseIncludeParam = (
  value: ResourceIncludeQuery,
): ReadonlyArray<URLSearchParamEntry> =>
  isSome(value) ? parseArrayParam('include', parseIncludeParamValue([], value)) : []

/** @hidden */
export const parseSortParam = (value: JSONAPISortParams): ReadonlyArray<URLSearchParamEntry> =>
  isArray(value) ? parseArrayParam('sort', value) : []

/** @hidden */
export const parseObjectParam = (name: string, value: object): ReadonlyArray<URLSearchParamEntry> =>
  Object.keys(value).flatMap((key) =>
    parseSearchParam(`${name}[${key}]`, value[key as keyof typeof value]),
  )

/** @hidden */
export const parsePrimitiveParam = (
  name: string,
  value: unknown,
): ReadonlyArray<URLSearchParamEntry> =>
  isPrimitiveParameterValue(value) ? [[name, String(value)]] : EMPTY_ARRAY

/** @hidden */
export const parseArrayParam = (
  name: string,
  value: ReadonlyArray<string | number>,
): ReadonlyArray<URLSearchParamEntry> =>
  parsePrimitiveParam(name, value.filter(isPrimitiveParameterValue).join(','))

/** @hidden */
export const parseIncludeParamValue = (
  path: ReadonlyArray<string>,
  value?: ResourceIncludeQuery<any> | null,
): ReadonlyArray<string> =>
  isObject(value)
    ? Object.keys(value)
        .sort()
        .map((name) => {
          const children = value[name as any]
          const childPath = path.concat(name)
          return isSome(children)
            ? parseIncludeParamValue(childPath, children as any).join(',')
            : childPath.join('.')
        })
        .sort()
    : EMPTY_ARRAY
