import {
  isArray,
  isString,
  isSerializableNumber,
  isObject,
  isTrue,
  isNone,
  isSome,
} from 'isntnt'

import {
  EMPTY_OBJECT,
  EMPTY_STRING,
  LIST_PARAMETER_VALUE_DELIMITER,
  INCLUDE_PARAMETER_VALUE_DELIMITER,
  PARAMETER_PREFIX,
  PARAMETER_DELIMITER,
  PARAMETERS_DELIMITER,
  EMPTY_ARRAY,
} from '../constants/data'
import { jsonApiReservedParameterNames } from '../constants/jsonApi'
import { NonEmptyArray, ValuesOf } from '../types/util'
import { Api } from './Api'
import { ApiSortRule } from './ApiSortRule'
import { ApiSetupCreatePageQuery, ApiSetup } from './ApiSetup'
import { AnyResource, ResourceAttributeNames } from './Resource'
import { RelationshipValue } from './ResourceRelationship'
import { ResourceIdentifierKey } from './ResourceIdentifier'
import { ResourceFieldName } from './ResourceField'

export type ApiQueryPageParameter<
  T extends Partial<ApiSetup>
> = T['createPageQuery'] extends ApiSetupCreatePageQuery
  ? Parameters<T['createPageQuery']>[0]
  : ApiQueryParameter

export type ApiQuerySortParameter<R extends AnyResource> = Array<
  ApiSortRule<ResourceAttributeNames<R>>
>

export type ApiQueryFilterParameter = {
  [key: string]: ApiQueryParameterValue
}

export type ApiQueryIncludeParameter<
  R extends AnyResource
> = BaseApiQueryIncludeParameters<R>

export type ApiQueryFieldsParameter<
  R extends AnyResource
> = BaseApiQueryFieldsParameter<R>

type BaseRelationshipResource<T> = T extends Array<AnyResource>
  ? T[number]
  : Extract<T, AnyResource>

export type ApiQueryResourceParameters<R extends AnyResource> = Partial<{
  include: BaseApiQueryIncludeParameters<R>
  fields: BaseApiQueryFieldsParameter<R>
}>

export type ApiQueryFiltersParameters<
  R extends AnyResource,
  S extends Partial<ApiSetup>
> = Partial<{
  page: ApiQueryPageParameter<S>
  sort: ApiQuerySortParameter<R>
  filter: ApiQueryFilterParameter
}>

export type FetchQueryParameters<
  R extends AnyResource,
  S extends Partial<ApiSetup>
> = ApiQueryResourceParameters<R> & ApiQueryFiltersParameters<R, S>

export type ApiQueryParameterValue =
  | string
  | number
  | boolean
  | Array<string | number>

export type ApiQueryParameter =
  | ApiQueryParameterValue
  | {
      [key: string]: ApiQueryParameterValue
    }

export type ApiQueryParameters = {
  [key: string]: ApiQueryParameter
}

export class ApiQuery<T extends FetchQueryParameters<any, any>> {
  api: Api<any>
  values: T
  constructor(api: Api<any>, values: T) {
    this.api = api
    this.values = values
  }

  toString(): string {
    return parseApiQuery(this.api, this.values)
  }
}

const parseApiQuery = <T extends FetchQueryParameters<any, any>>(
  api: Api<any>,
  values: T,
): string => {
  const parameters: Array<string> = Object.keys(values).flatMap((name) => {
    switch (name) {
      case jsonApiReservedParameterNames.PAGE:
        return parseApiQueryParameter(
          name,
          api.setup.createPageQuery(values[name]),
        )
      case jsonApiReservedParameterNames.SORT:
        return parseApiQueryParameter(
          name,
          parseApiQueryParameterArray(
            (values[name] as Array<ApiSortRule<any>>).map(String),
          ),
        )
      case jsonApiReservedParameterNames.INCLUDE:
        return parseIncludeParameter(name, values[name] || EMPTY_OBJECT)
      default:
        return parseApiQueryParameter(name, (values as any)[name])
    }
  })
  return parameters.length
    ? `${PARAMETER_PREFIX}${parameters.join(PARAMETERS_DELIMITER)}`
    : EMPTY_STRING
}

const parseParameterName = (
  name: ResourceFieldName,
  key: string | null,
): string => (isNone(key) ? name : `${name}[${key}]`)

const getIncludeParameter = (
  path: Array<string>,
  values: ApiQueryIncludeParameter<any>,
): ReadonlyArray<string> =>
  isSome(values)
    ? Object.keys(values!).map((name) => {
        const children = values[name]
        const childPath = path.concat(name)
        return isSome(children)
          ? getIncludeParameter(childPath, children).join(LIST_PARAMETER_VALUE_DELIMITER)
          : childPath.join(INCLUDE_PARAMETER_VALUE_DELIMITER)
      })
    : EMPTY_ARRAY

const parseIncludeParameter = (
  name: typeof jsonApiReservedParameterNames['INCLUDE'],
  value: ApiQueryIncludeParameter<any>,
): ReadonlyArray<string> =>
  isSome(value)
    ? parseApiQueryParameterValue(name, getIncludeParameter([], value) as Array<
        string
      >)
    : EMPTY_ARRAY

const parseApiQueryParameter = (
  name: ResourceFieldName,
  value: ApiQueryParameterValue,
): ReadonlyArray<string> => {
  if (isArray(value)) {
    return parseApiQueryParameterValue(name, parseApiQueryParameterArray(value))
  }
  if (isObject(value)) {
    return Object.keys(value).flatMap((key) =>
      parseApiQueryParameterValue(parseParameterName(name, key), value[key]),
    )
  }
  return parseApiQueryParameterValue(name, value)
}

const parseApiQueryParameterValue = (
  name: ResourceFieldName,
  value: ApiQueryParameterValue,
): ReadonlyArray<string> => {
  if (isTrue(value)) {
    return [name]
  }
  if ((isString(value) && value.length) || isSerializableNumber(value)) {
    return [[name, value].join(PARAMETER_DELIMITER)]
  }
  if (isArray(value)) {
    return parseApiQueryParameterValue(name, parseApiQueryParameterArray(value))
  }
  return EMPTY_ARRAY
}

const parseApiQueryParameterArray = (value: Array<string | number>): string => {
  return value
    .filter(
      (item) => (isString(item) && item.length) || isSerializableNumber(item),
    )
    .join(LIST_PARAMETER_VALUE_DELIMITER)
}

type BaseApiQueryIncludeParameters<T> = T extends RelationshipValue<AnyResource>
  ?
      | null
      | {
          [K in keyof T]?: BaseApiQueryIncludeParameters<
            BaseRelationshipResource<T[K]>
          >
        }
  : never

type BaseApiQueryFieldsParameter<
  T,
  X extends string = never
> = T extends AnyResource
  ? T['type'] extends X
    ? never
    :
        | {
            [K in T['type']]: NonEmptyArray<
              Exclude<Extract<keyof T, string>, ResourceIdentifierKey>
            >
          }
        | ValuesOf<
            {
              [K in keyof T]: BaseApiQueryFieldsParameter<
                BaseRelationshipResource<T[K]>,
                X | T['type']
              >
            }
          >
  : never
