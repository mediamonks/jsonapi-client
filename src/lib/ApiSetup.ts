import {
  jsonApiVersions,
  JsonApiVersion,
  JsonApiVersions,
} from '../constants/jsonApi'
import {
  defaultIncludeFieldOptions,
  DefaultIncludeFieldsOption,
  DefaultIncludeFieldsOptions,
} from '../constants/setup'
import { ApiResponseError } from '../types/data'
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
  adapter: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined
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
  adapter: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined
}>

export type ApiSetupWithDefaults<T extends Partial<ApiSetup>> = Required<
  {
    [K in keyof ApiSetup]: K extends keyof T ? T[K] : DefaultApiSetup[K]
  }
>

export const mergeApiDefaultSetup = mergeApiSetup({
  version: jsonApiVersions['1_0'],
  defaultIncludeFields: defaultIncludeFieldOptions.NONE,
  createPageQuery: reflect,
  parseRequestError: reflect,
  adapter: typeof fetch !== 'undefined' ? fetch.bind(window) : undefined, // global fetch
})
