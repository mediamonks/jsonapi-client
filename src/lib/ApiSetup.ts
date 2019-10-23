import { ApiQueryParameter } from './ApiQuery'
import { JsonApiErrorData, ApiErrorResponse } from '../types/data'
import { Transform, ValuesOf } from '../types/util'

const mergeApiSetup = (defaults: ApiSetup) => (
  setup: Partial<ApiSetup>,
): ApiSetupWithDefaults<any> => ({
  ...setup,
  ...defaults,
})

export const defaultIncludeFieldOptions = {
  NONE: 'none',
  PRIMARY: 'primary',
} as const

export type DefaultIncludeFieldsOptions = typeof defaultIncludeFieldOptions

export type DefaultIncludeFields = ValuesOf<DefaultIncludeFieldsOptions>

export const jsonApiVersions = {
  ['1_0']: '1.0',
  ['1_1']: '1.1',
} as const

export type JsonApiVersions = typeof jsonApiVersions

export type JsonApiVersion = ValuesOf<JsonApiVersions>

export type CreatePageQuery<
  I extends ApiQueryParameter,
  O extends ApiQueryParameter
> = Transform<I, O>

export type ParseRequestError<
  I extends JsonApiErrorData,
  O extends JsonApiErrorData
> = Transform<I, O>

export type ApiSetup = {
  version: JsonApiVersion
  defaultIncludeFields: DefaultIncludeFields
  createPageQuery: CreatePageQuery<ApiQueryParameter, ApiQueryParameter>
  parseRequestError: ParseRequestError<JsonApiErrorData, JsonApiErrorData>
}

export type DefaultApiSetup = ApiSetupWithDefaults<{
  version: JsonApiVersions['1_0']
  defaultIncludeFields: DefaultIncludeFieldsOptions['NONE']
  createPageQuery: <T extends ApiQueryParameter>(value: T) => T
  parseRequestError: <T extends JsonApiErrorData>(value: T) => T
}>

// type PartialApiSetup = Partial<ApiSetup>

export type ApiSetupWithDefaults<T extends Partial<ApiSetup>> = Required<
  {
    [K in keyof ApiSetup]: K extends keyof T ? T[K] : DefaultApiSetup[K]
  }
>

const reflect = <T>(value: T): T => value

export const mergeApiDefaultSetup = mergeApiSetup({
  version: jsonApiVersions['1_0'],
  defaultIncludeFields: defaultIncludeFieldOptions.NONE,
  createPageQuery: reflect as <T extends ApiQueryParameter>(value: T) => T,
  parseRequestError: reflect as <T extends JsonApiErrorData>(value: T) => T,
})
