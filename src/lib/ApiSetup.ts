import { jsonApiVersions, JsonApiVersion, JsonApiVersions } from '../constants/jsonApi'
import {
  defaultIncludeFieldOptions,
  DefaultIncludeFieldsOption,
  DefaultIncludeFieldsOptions,
} from '../constants/setup'
import { ApiResponseError, SerializableObject } from '../types/data'
import { Transform } from '../types/util'

import { JSONAPIParameterValue } from '../utils/url'

const reflect = <T>(value: T): T => value

const mergeApiSetup = (defaults: ApiSetup) => (
  setup: Partial<ApiSetup>,
): ApiSetupWithDefaults<any> => ({
  ...defaults,
  ...setup,
})

export type ApiSetup = {
  version: JsonApiVersion
  defaultIncludeFields: DefaultIncludeFieldsOption
  createPageQuery: ApiSetupCreatePageQuery
  transformRelationshipForURL: Transform<string>
  parseRequestError: ApiSetupParseRequestError
  beforeRequest: Transform<SerializableObject>
  fetchAdapter: Window['fetch']
  adapter: Window['fetch']
}

export type ApiSetupCreatePageQuery =
  | Transform<string, JSONAPIParameterValue>
  | Transform<number, JSONAPIParameterValue>
  | Transform<JSONAPIParameterValue, JSONAPIParameterValue>

export type ApiSetupParseRequestError = Transform<ApiResponseError, any>

export type DefaultApiSetup = ApiSetupWithDefaults<{
  version: JsonApiVersions['1_0']
  defaultIncludeFields: DefaultIncludeFieldsOptions['NONE']
  createPageQuery: ApiSetupCreatePageQuery
  transformRelationshipForURL: Transform<string>
  parseRequestError: Transform<ApiResponseError, any>
  beforeRequest: Transform<SerializableObject>
  fetchAdapter: Window['fetch']
  adapter: Window['fetch']
}>

export type ApiSetupWithDefaults<T extends Partial<ApiSetup>> = Required<
  {
    [K in keyof ApiSetup]: K extends keyof T ? T[K] : DefaultApiSetup[K]
  }
>

const windowFetch = (typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? fetch.bind(window)
  : undefined) as Window['fetch']

export const mergeApiDefaultSetup = mergeApiSetup({
  version: jsonApiVersions['1_0'],
  defaultIncludeFields: defaultIncludeFieldOptions.NONE,
  createPageQuery: reflect,
  transformRelationshipForURL: reflect,
  parseRequestError: reflect,
  beforeRequest: reflect,
  fetchAdapter: windowFetch,
  adapter: windowFetch,
})
