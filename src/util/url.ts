import { isArray, isObject, isSome, or, isSerializableNumber, and, isString, isTrue } from 'isntnt'
import { Endpoint } from '../client/endpoint'
import { EMPTY_ARRAY, EMPTY_OBJECT } from '../data/constants'
import type { ResourceFilter, ResourceIncludeQuery, ResourceQueryParams } from '../types'
import type { SearchParams, SortParamValue } from '../types/jsonapi'

type URLSearchParamEntry = [string, string]

const isPrimitiveParameterValue = or(
  isTrue,
  isSerializableNumber,
  and(isString, (value: any): value is string => value.length > 0),
)

/** @hidden */
export const createURL = (
  endpoint: Endpoint<any, any>,
  path: ReadonlyArray<string> = EMPTY_ARRAY,
  resourceFilter: ResourceFilter<any> = EMPTY_OBJECT,
  searchParams: SearchParams = EMPTY_OBJECT,
): URL =>
  parseSearchParams(resourceFilter, searchParams).reduce((url, [name, value]) => {
    url.searchParams.append(name, value)
    return url
  }, urlWithPath(endpoint.client.url, [endpoint.path, ...path]))

/** @hidden */
export const urlWithPath = (url: URL, path: ReadonlyArray<string>): URL => {
  const preserveTrailingSlash = url.pathname.endsWith('/')
  return new URL(
    `${url.origin}${url.pathname}${(preserveTrailingSlash
      ? path.concat('')
      : [''].concat(path)
    ).join('/')}${url.search}`,
  )
}

const searchParamEntryComparator = (
  [aName]: URLSearchParamEntry,
  [bName]: URLSearchParamEntry,
): number => (aName === bName ? 0 : aName > bName ? 1 : -1)

/** @hidden */
export const parseSearchParams = (
  resourceFilter: ResourceQueryParams,
  searchParams: SearchParams,
): ReadonlyArray<URLSearchParamEntry> => {
  return [
    ...Object.entries(resourceFilter)
      .reduce((searchParamEntries, [name, value]) => {
        switch (name) {
          case 'include':
            return searchParamEntries.concat(parseIncludeParam(value as any))
          case 'fields':
            return searchParamEntries.concat(parseSearchParam(name, value))
          default:
            throw new TypeError(`Invalid resourceFilter field, "${name}" is not allowed`)
        }
      }, [] as Array<URLSearchParamEntry>)
      .sort(searchParamEntryComparator),
    ...Object.entries(searchParams)
      .reduce((searchParamEntries, [name, value]) => {
        switch (name) {
          case 'fields':
          case 'include':
            throw new TypeError(
              `Invalid searchParam name, "${name}" is reserved for resource params`,
            )
          case 'include':
            return searchParamEntries.concat(parseIncludeParam(value as any))
          case 'sort':
            return searchParamEntries.concat(parseSortParam(value as any))
          case 'page':
            return searchParamEntries.concat(parseSearchParam(name, value))
          default:
            return searchParamEntries.concat(parseSearchParam(name, value))
        }
      }, [] as Array<URLSearchParamEntry>)
      .sort(searchParamEntryComparator),
  ]
}

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
export const parseSortParam = (value: SortParamValue): ReadonlyArray<URLSearchParamEntry> =>
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
  isPrimitiveParameterValue(value) ? [[name, value === true ? '' : String(value)]] : EMPTY_ARRAY

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
