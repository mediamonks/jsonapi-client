import { JSONAPIVersion } from '../constants/jsonApi'
import {
  defaultIncludeFieldOptions,
  DefaultIncludeFieldsOption,
  DefaultIncludeFieldsOptions,
} from '../constants/setup'
import { ApiResponseError, SerializableObject } from '../types/data'
import { Transform } from '../types/util'
import { JSONAPIParameterValue } from '../utils/url'

const reflect = <T>(value: T): T => value

const mergeClientSetup = (defaults: ClientSetup) => (
  setup: Partial<ClientSetup>,
): ClientSetupWithDefaults<any> => ({
  ...defaults,
  ...setup,
})

export type ClientSetup = {
  version: JSONAPIVersion
  defaultIncludeFields: DefaultIncludeFieldsOption
  createPageQuery: ClientSetupCreatePageQuery
  transformRelationshipForURL: Transform<string>
  parseRequestError: ClientSetupParseRequestError
  beforeRequest: Transform<SerializableObject>
  fetchAdapter: Window['fetch']
  adapter: Window['fetch']
}

export type ClientSetupCreatePageQuery =
  | Transform<string, JSONAPIParameterValue>
  | Transform<number, JSONAPIParameterValue>
  | Transform<JSONAPIParameterValue, JSONAPIParameterValue>

export type ClientSetupParseRequestError = Transform<ApiResponseError, any>

export type DefaultClientSetup = ClientSetupWithDefaults<{
  version: '1.0'
  defaultIncludeFields: DefaultIncludeFieldsOptions['NONE']
  createPageQuery: ClientSetupCreatePageQuery
  transformRelationshipForURL: Transform<string>
  parseRequestError: Transform<ApiResponseError, any>
  beforeRequest: Transform<SerializableObject>
  fetchAdapter: Window['fetch']
  adapter: Window['fetch']
}>

export type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = Required<
  {
    [K in keyof ClientSetup]: K extends keyof T ? T[K] : DefaultClientSetup[K]
  }
>

const windowFetch = (typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? fetch.bind(window)
  : undefined) as Window['fetch']

export const mergeDefaultClientSetup = mergeClientSetup({
  version: '1.0',
  defaultIncludeFields: defaultIncludeFieldOptions.NONE,
  createPageQuery: reflect,
  transformRelationshipForURL: reflect,
  parseRequestError: reflect,
  beforeRequest: reflect,
  fetchAdapter: windowFetch,
  adapter: windowFetch,
})
