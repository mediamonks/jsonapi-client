import { EMPTY_OBJECT } from '../constants/data'
import { createGetRequestOptions, keys, createPostRequestOptions } from '../utils/data'

import { Api } from './Api'
import {
  ApiQuery,
  ApiQueryResourceParameters,
  ApiQueryFiltersParameters,
  FetchQueryParameters,
} from './ApiQuery'
import { ApiSetup } from './ApiSetup'
import { AnyResource, ResourceConstructor, ResourceCreateValues } from './Resource'
import { ResourceIdentifierKey, ResourceIdentifier } from './ResourceIdentifier'

export class ApiEndpoint<R extends AnyResource, S extends Partial<ApiSetup>> {
  readonly api: Api<S>
  readonly path: string
  readonly Resource: ResourceConstructor<R>

  constructor(api: Api<S>, path: string, Resource: ResourceConstructor<R>) {
    api.controller.addResource(Resource)
    this.api = api
    this.path = path
    this.Resource = Resource
  }

  async create(values: ResourceCreateValues<R>): Promise<any> {
    const url = this.toURL()
    return new Promise((resolve, reject) => {
      this.api.controller
        .encodeResource(this.Resource.type, values, keys(this.Resource.fields), [])
        .map(async (body) => {
          const options = createPostRequestOptions(body)
          this.api.controller.handleRequest(url, options).then((result) => {
            if (result.isSuccess()) {
              resolve(result.value)
            } else {
              reject(result.value)
            }
          })
        })
    })
  }

  async patch(values: ResourceCreateValues<R>): Promise<any> {
    const url = this.toURL()
    return new Promise((resolve, reject) => {
      this.api.controller
        .encodeResource(
          this.Resource.type,
          values,
          keys(this.Resource.fields).filter((name) => name in values),
          [],
        )
        .map((body) => {
          const options = createPostRequestOptions(body)
          this.api.controller.handleRequest(url, options).then((result) => {
            if (result.isSuccess()) {
              resolve(result.value)
            } else {
              reject(result.value)
            }
          })
        })
    })
  }

  async get<F extends ApiQueryResourceParameters<R>>(
    id: string,
    resourceQuery: F = EMPTY_OBJECT as F,
  ): Promise<FilteredResource<R, F>[]> {
    const queryParameters = this.createQuery(resourceQuery)
    const url = new URL(`${this.path}/${id}${String(queryParameters)}`, this.api.url)

    const options = createGetRequestOptions()
    return new Promise((resolve, reject) => {
      this.api.controller.handleRequest(url, options).then((request) => {
        request.map((response) => {
          const result = this.api.controller.decodeResource(
            this.Resource.type,
            response.data,
            response.included,
            resourceQuery.fields,
            resourceQuery.include,
            [],
          )
          if (result.isSuccess()) {
            resolve(result.value as any)
          } else {
            reject(result.value)
          }
        })
      })
    })
  }

  async fetch<Q extends ApiQueryFiltersParameters<R, S>, F extends ApiQueryResourceParameters<R>>(
    query: Q = EMPTY_OBJECT as Q,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<FilteredResource<R, F>[]> {
    const queryParameters = this.createQuery({ ...query, ...resourceFilter })
    const url = new URL(String(queryParameters), this.toURL())

    return new Promise((resolve, reject) => {
      const options = createGetRequestOptions()
      this.api.controller.handleRequest(url, options).then((request) => {
        request.map((response) => {
          const errors: Array<Error> = []
          const values: Array<FilteredResource<R, F>> = []

          response.data.forEach((resource: any) => {
            const result = this.api.controller.decodeResource(
              this.Resource.type,
              resource,
              response.included,
              resourceFilter.fields,
              resourceFilter.include,
              [this.Resource.type, resource.id],
            )
            if (result.isSuccess()) {
              values.push(result.value as any)
            } else {
              errors.push(...(result.value as any))
            }
          })

          if (errors.length) {
            reject(errors)
          } else {
            resolve(values)
          }
        })
      })
    })
  }

  toString(): string {
    return `${this.api}${this.path}`
  }

  toURL(): URL {
    return new URL(this.path, this.api.url)
  }

  createQuery<Q extends FetchQueryParameters<R, S>>(query: Q): ApiQuery<Q> {
    return new ApiQuery(this.api, query)
  }
}

type ResourceFields<R, F> = R extends AnyResource
  ? F extends Array<keyof R>
    ? Pick<R, F[number] | ResourceIdentifierKey>
    : Warning<'Invalid fields parameter: field does not exist on resource', F>
  : never

type ToManyRelationshipIdentifier<R> = R extends Array<AnyResource>
  ? ResourceIdentifier<R[number]['type']>[]
  : never

type ResourceIncludes<R, I, F> = R extends AnyResource
  ? {
      [K in keyof R]: R[K] extends Array<AnyResource>
        ? K extends keyof I
          ? FilteredToManyRelationship<R[K], I[K], F>
          : ToManyRelationshipIdentifier<R[K]>
        : R[K] extends AnyResource | null
        ? K extends keyof I
          ? BaseFilteredResource<Extract<R[K], AnyResource>, I[K], F> | null
          : ResourceIdentifier<Extract<R[K], AnyResource>['type']> | null
        : K extends keyof I
        ? Warning<'Invalid include parameter: field is not a relationship', K>
        : R[K]
    }
  : NotAResourceWarning<R>

type BaseFilteredResourceOfType<T, R, I, F> = T extends keyof F
  ? ResourceIncludes<ResourceFields<R, F[T]>, I, F>
  : ResourceIncludes<R, I, F>

type BaseFilteredResource<R, I, F> = R extends AnyResource
  ? BaseFilteredResourceOfType<R['type'], R, I, F>
  : NotAResourceWarning<R>

type FilteredToManyRelationship<R, I, F> = R extends Array<AnyResource>
  ? Array<BaseFilteredResource<R[number], I, F>>
  : NotAResourceWarning<R>[]

export type FilteredResource<
  R extends AnyResource,
  Q extends ApiQueryResourceParameters<R>
> = BaseFilteredResource<R, Q['include'], Q['fields']>

type Warning<T extends string, U> = Error & {
  message: T
  value: U
}

type NotAResourceWarning<T> = Warning<'Not a Resource', T>

export type ApiEndpointResource<E extends ApiEndpoint<any, any>> = E extends ApiEndpoint<
  infer R,
  any
>
  ? R
  : never

export type ApiEndpointSetup<T extends ApiEndpoint<any, any>> = T extends ApiEndpoint<any, infer S>
  ? S
  : never
