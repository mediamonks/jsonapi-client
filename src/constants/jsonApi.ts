import { ValuesOf } from '../types/util'

export const jsonApiVersions = {
  ['1_0']: '1.0',
  ['1_1']: '1.1',
} as const

export type JsonApiVersions = typeof jsonApiVersions

export type JsonApiVersion = ValuesOf<JsonApiVersions>

export const jsonApiReservedParameterNames = {
  PAGE: 'page',
  SORT: 'sort',
  INCLUDE: 'include',
  FIELDS: 'fields',
} as const

export const jsonApiContentType = 'application/vnd.api+json'

export const defaultGetRequestHeaders = {
  ['Content-Type']: jsonApiContentType,
}

export const defaultPostRequestHeaders = {
  ['Accept']: jsonApiContentType,
  ['Content-Type']: jsonApiContentType,
}
