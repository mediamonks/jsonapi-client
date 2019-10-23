import {
  isArray,
  isString,
  isSerializableNumber,
  isObject,
  isTrue,
  literal,
  isNone,
  isSome,
} from 'isntnt'

import { NonEmptyArray, ValuesOf } from '../types/util'
import { Api } from './Api'
import { ApiSortRule } from './ApiSortRule'
import { CreatePageQuery, ApiSetup } from './ApiSetup'
import { AnyResource, ResourceAttributeNames } from './Resource'
import { RelationshipValue } from './ResourceRelationship'
import { ResourceIdentifierKey } from './ResourceIdentifier'
import { ResourceFieldName } from './ResourceField'

const isPageParameter = literal('page')
const isSortParameter = literal('sort')
const isIncludeParameter = literal('include')

export type PageQueryParameter<
  T extends Partial<ApiSetup>
> = T['createPageQuery'] extends CreatePageQuery<any, any>
  ? Parameters<T['createPageQuery']>[0]
  : ApiQueryParameter

export type SortQueryParameters<R extends AnyResource> = Array<
  ApiSortRule<ResourceAttributeNames<R>>
>

type BaseRelationshipResource<T> = T extends Array<AnyResource>
  ? T[number]
  : Extract<T, AnyResource>

type BaseIncludeQueryParameters<T> = T extends RelationshipValue<AnyResource>
  ?
      | null
      | {
          [K in keyof T]?: BaseIncludeQueryParameters<
            BaseRelationshipResource<T[K]>
          >
        }
  : never

type BaseFieldsQueryParameters<
  T,
  X extends string = never
> = T extends AnyResource
  ? T['type'] extends X
    ? never
    :
        | {
            [K in T['type']]: NonEmptyArray<
              Exclude<keyof T, ResourceIdentifierKey>
            >
          }
        | ValuesOf<
            {
              [K in keyof T]: BaseFieldsQueryParameters<
                BaseRelationshipResource<T[K]>,
                X | T['type']
              >
            }
          >
  : never

export type IncludeQueryParameters<R extends AnyResource> = {
  [K in keyof R]: BaseRelationshipResource<R[K]>
}

export type FetchQueryParameters<
  R extends AnyResource,
  S extends Partial<ApiSetup>
> = Partial<{
  page: PageQueryParameter<S>
  sort: SortQueryParameters<R>
  filter: ApiQueryParameter
  include: BaseIncludeQueryParameters<R>
  fields: BaseFieldsQueryParameters<R>
}>

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
    if (isPageParameter(name)) {
      return parseApiQueryParameter(
        name,
        api.setup.createPageQuery(values[name]),
      )
    }
    if (isSortParameter(name)) {
      return parseApiQueryParameter(
        name,
        parseApiQueryParameterArray(
          ((values[name] as unknown) as Array<ApiSortRule<any>>).map(String),
        ),
      )
    }
    if (isIncludeParameter(name)) {
      return parseIncludeParameter(name, values[name]!)
    }
    return parseApiQueryParameter(name, (values as any)[name])
  })
  return parameters.length ? `?${parameters.join('&')}` : ''
}

const parseParameterName = (
  name: ResourceFieldName,
  key: string | null,
): string => (isNone(key) ? name : `${name}[${key}]`)

type ApiQueryIncludeParameter = Partial<{
  [key: string]: ApiQueryIncludeParameter | null
}>

const getIncludeParameter = (
  path: Array<string>,
  values: ApiQueryIncludeParameter,
): Array<string> => {
  return Object.keys(values).map((name) => {
    const children = values[name]
    const childPath = path.concat(name)
    const value = childPath.join('.')
    return isSome(children)
      ? [value, getIncludeParameter(childPath, children)].join(',')
      : value
  })
}

const parseIncludeParameter = (
  name: 'include',
  value: ApiQueryIncludeParameter = {},
): Array<string> =>
  parseApiQueryParameterValue(name, getIncludeParameter([], value))

const parseApiQueryParameter = (
  name: ResourceFieldName,
  value: ApiQueryParameterValue,
): Array<string> => {
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
): Array<string> => {
  if (isTrue(value)) {
    return [name]
  }
  if ((isString(value) && value.length) || isSerializableNumber(value)) {
    return [`${name}=${value}`]
  }
  if (isArray(value)) {
    return parseApiQueryParameterValue(name, parseApiQueryParameterArray(value))
  }
  return []
}

const parseApiQueryParameterArray = (value: Array<string | number>): string => {
  return value
    .filter(
      (item) => (isString(item) && item.length) || isSerializableNumber(item),
    )
    .join(',')
}

// class A extends resource('a')<A> {
//   b!: B | null
// }

// class B extends resource('b')<B> {
//   c!: C | null
// }

// class C extends resource('c')<C> {
//   d!: D | null
// }

// class D extends resource('d')<D> {
//   e!: E | null
// }

// class E extends resource('e')<E> {
//   f!: F | null
// }

// class F extends resource('f')<F> {
//   g!: G | null
// }

// class G extends resource('g')<G> {
//   a!: A | null
// }

// const x: Partial<BaseFieldsQueryParameters<F>> = {
//   a: ['b'],
//   b: ['c'],
//   f: ['g'],
//   g: ['a'],
// }
