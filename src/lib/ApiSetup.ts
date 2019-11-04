import { jsonApiVersions, JsonApiVersion, JsonApiVersions } from '../constants/jsonApi'
import {
  defaultIncludeFieldOptions,
  DefaultIncludeFieldsOption,
  DefaultIncludeFieldsOptions,
} from '../constants/setup'
import { ApiResponseError, SerializableObject } from '../types/data'
import { Transform } from '../types/util'

import { ApiQueryParameter } from './ApiQuery'

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
  parseRequestError: ApiSetupParseRequestError
  beforeRequest: Transform<SerializableObject>
  adapter: Window['fetch']
}

export type ApiSetupCreatePageQuery =
  | Transform<string, ApiQueryParameter>
  | Transform<number, ApiQueryParameter>
  | Transform<ApiQueryParameter, ApiQueryParameter>

export type ApiSetupParseRequestError = Transform<ApiResponseError, any>

export type DefaultApiSetup = ApiSetupWithDefaults<{
  version: JsonApiVersions['1_0']
  defaultIncludeFields: DefaultIncludeFieldsOptions['NONE']
  createPageQuery: Transform<ApiQueryParameter, ApiQueryParameter>
  parseRequestError: Transform<ApiResponseError, any>
  beforeRequest: Transform<SerializableObject>
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
  parseRequestError: reflect,
  beforeRequest: reflect,
  adapter: windowFetch,
})
