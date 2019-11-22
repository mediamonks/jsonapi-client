import { isNone, isSome, isArray, isTrue, isObject, isString, isSerializableNumber } from 'isntnt'

import {
  ApiQueryParameters,
  ApiQueryParameterValue,
  ApiClient,
  ResourceFieldName,
  ResourceIncludeParameter,
  ApiResourceParameters,
  ResourceFieldsParameter,
} from './temp'

const EMPTY_STRING = ''
const PARAMETER_PREFIX = '?'
const PARAMETERS_DELIMITER = '&'
const PARAMETER_DELIMITER = '='

export const INCLUDE_PARAMETER_VALUE_DELIMITER = '.'
export const LIST_PARAMETER_VALUE_DELIMITER = ','

const EMPTY_OBJECT: {} = Object.freeze({})
const EMPTY_ARRAY: [] = Object.freeze([]) as any

const PAGE = 'page' as const
const SORT = 'sort' as const

const FIELDS = 'fields' as const
const INCLUDE = 'include' as const

export const parseApiQuery = <T extends ApiQueryParameters<any>>(
  api: ApiClient<any>,
  values: T | null,
): ReadonlyArray<string> =>
  isSome(values)
    ? Object.keys(values)
        .sort()
        .flatMap((name) => {
          switch (name) {
            case PAGE:
              return parseApiQueryParameter(name, api.setup.createPageQuery(values[name]))
            case SORT:
              return parseApiQueryParameter(
                name,
                parseApiQueryParameterArray((values[name] as any).map(String)),
              )
            case FIELDS: {
              throw new Error(`Fields parameter is not allowed in queryParameters`)
            }
            default:
              return parseApiQueryParameter(name, (values as any)[name])
          }
        })
    : EMPTY_ARRAY

export const joinParameters = (parameters: ReadonlyArray<string>): string =>
  parameters.length ? `${PARAMETER_PREFIX}${parameters.join(PARAMETERS_DELIMITER)}` : EMPTY_STRING

export const parseResourceParameters = (
  parameters: ApiResourceParameters<any> | null,
): ReadonlyArray<string> =>
  isSome(parameters)
    ? parseFieldsParameter(parameters.fields).concat(parseIncludeParameter(parameters.include))
    : EMPTY_ARRAY

export const parseResourceIncludeParameters = () => {}

export const parseResourceFieldsParameters = () => {}

const parseParameterName = (name: ResourceFieldName, key: string | null): string =>
  isNone(key) ? name : `${name}[${key}]`

const getIncludeParameter = (
  path: Array<string>,
  values: ResourceIncludeParameter<any>,
): ReadonlyArray<string> =>
  isSome(values)
    ? Object.keys(values)
        .sort()
        .map((name) => {
          const children = values[name]
          const childPath = path.concat(name)
          return isSome(children)
            ? getIncludeParameter(childPath, children as any).join(LIST_PARAMETER_VALUE_DELIMITER)
            : childPath.join(INCLUDE_PARAMETER_VALUE_DELIMITER)
        })
    : EMPTY_ARRAY

const parseFieldsParameter = (value?: ResourceFieldsParameter<any>): ReadonlyArray<string> =>
  isSome(value)
    ? Object.keys(value)
        .sort()
        .filter((type) => isArray(value[type]) && value[type]!.length)
        .flatMap((type) =>
          parseApiQueryParameter(parseParameterName(FIELDS, type), value[type]!.slice().sort()),
        )
    : EMPTY_ARRAY

const parseIncludeParameter = (value?: ResourceIncludeParameter<any>): ReadonlyArray<string> =>
  isSome(value)
    ? parseApiQueryParameterValue(INCLUDE, getIncludeParameter([], value) as Array<string>)
    : EMPTY_ARRAY

const parseApiQueryParameter = (
  name: ResourceFieldName,
  value: ApiQueryParameterValue,
): ReadonlyArray<string> => {
  if (isArray(value)) {
    return parseApiQueryParameterValue(name, parseApiQueryParameterArray(value))
  }
  if (isObject(value)) {
    return Object.keys(value)
      .sort()
      .flatMap((key: string) =>
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
    .filter((item) => (isString(item) && item.length) || isSerializableNumber(item))
    .join(LIST_PARAMETER_VALUE_DELIMITER)
}

export class ApiSortRule<T extends string> {
  readonly name: T
  readonly ascending: boolean
  constructor(name: T, ascending: boolean) {
    this.name = name
    this.ascending = ascending
  }

  toString(): string {
    return this.ascending ? this.name : `-${this.name}`
  }
}

export const sort = <T extends string>(name: T, ascending: boolean): ApiSortRule<T> =>
  new ApiSortRule(name, ascending)

export const ascend = <T extends string>(name: T): ApiSortRule<T> => sort(name, true)

export const descend = <T extends string>(name: T): ApiSortRule<T> => sort(name, false)
