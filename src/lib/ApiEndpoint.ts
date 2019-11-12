import { EMPTY_OBJECT } from '../constants/data'
import {
  createGetRequestOptions,
  keys,
  createPostRequestOptions,
  createPatchRequestOptions,
} from '../utils/data'

import { Api } from './Api'
import { ApiQuery, ApiQueryResourceParameters, ApiQueryFiltersParameters } from './ApiQuery'
import { ApiSetup } from './ApiSetup'
import {
  AnyResource,
  ResourceConstructor,
  ResourceCreateValues,
  ResourceId,
  ResourceToManyRelationshipNames,
  ResourceToOneRelationshipNames,
  ResourceType,
  ResourcePatchValues,
} from './Resource'
import { ResourceIdentifierKey, ResourceIdentifier } from './ResourceIdentifier'
import { ApiEntityResult, ApiCollectionResult } from './ApiResult'
import {
  ToManyRelationship,
  ToManyRelationshipField,
  ToOneRelationshipField,
} from './ResourceRelationship'
import { Result } from '../utils/Result'
import { ResourceData } from './ApiController'
import { ApiError } from './ApiError'

export class ApiEndpoint<R extends AnyResource, S extends Partial<ApiSetup>> {
  readonly api: Api<S>
  readonly path: string
  readonly Resource: ResourceConstructor<R>

  constructor(api: Api<S>, path: string, Resource: ResourceConstructor<R>) {
    api.controller.addResource(Resource)
    this.api = api
    this.path = path.replace(/^\/*(.*?)\/*$/, '$1') // ensure no leading nor trailing "/"
    this.Resource = Resource
  }

  async create(
    values: ResourceCreateValues<R>,
  ): Promise<ApiEntityResult<FilteredResource<R, {}>, any>> {
    const url = this.toURL()
    if (values.type === undefined) {
      ;(values as any).type = this.Resource.type
    }
    return new Promise((resolve, reject) => {
      const result = this.api.controller.encodeResource(
        this.Resource.type,
        values as any,
        keys(this.Resource.fields),
        [],
      )

      if (result.isRejected()) {
        reject(result.value)
      }

      return result.map((body: any) => {
        const options = createPostRequestOptions(body)
        return this.api.controller.handleRequest(url, options).then((result) => {
          if (result.isSuccess()) {
            resolve(result.value)
          } else {
            reject(result.value)
          }
        })
      })
    })
  }

  async patch(id: ResourceId, values: ResourcePatchValues<R>): Promise<any> {
    const url = new URL(`${this.path}/${id}`, this.api.url)
    if (values.id === undefined) {
      ;(values as any).id = id
    }
    return new Promise((resolve, reject) => {
      this.api.controller
        .encodeResource(
          this.Resource.type,
          values as any,
          keys(this.Resource.fields).filter((name) => name in values),
          [],
        )
        .map((body) => {
          const options = createPatchRequestOptions(body)
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

  /**
   * Get a single entity
   * /api/posts/123
   *
   * @param id
   * @param resourceFilter
   */
  async get<F extends ApiQueryResourceParameters<R>>(
    id: ResourceId,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<R, F>, any>> {
    return this.fetchEntity(id, resourceFilter) as any
  }

  /**
   * Get an entity collection
   * /api/posts/
   *
   * @param query
   * @param resourceFilter
   */
  async fetch<Q extends ApiQueryFiltersParameters<R, S>, F extends ApiQueryResourceParameters<R>>(
    query: Q = EMPTY_OBJECT as Q,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiCollectionResult<FilteredResource<R, F>, any>> {
    return this.fetchCollection(query as any, resourceFilter) as any
  }

  /**
   * Fetch a 1-to-1 relationship for an entity
   * /api/posts/123/author
   *
   * @param id
   * @param relationshipFieldName
   * @param resourceFilter
   */
  async getToOneRelationship<
    RI extends ResourceToOneRelationshipNames<R>,
    RR extends Extract<R[RI], AnyResource>,
    F extends ApiQueryResourceParameters<RR>
  >(
    id: ResourceId,
    relationshipFieldName: RI,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<RR, F>, any>> {
    const relationshipField = this.Resource.fields[relationshipFieldName] as ToOneRelationshipField<
      RR['type']
    >

    return (this.fetchEntity(
      id,
      resourceFilter as any,
      `/${relationshipFieldName}`,
      relationshipField.type,
    ) as unknown) as Promise<ApiEntityResult<FilteredResource<RR, F>, any>>
  }

  /**
   * Fetch a 1-to-many relationship for an entity
   * /api/posts/123/comments
   *
   * @param id
   * @param relationshipFieldName
   * @param query
   * @param resourceFilter
   */
  async getToManyRelationship<
    RI extends ResourceToManyRelationshipNames<R>,
    RR extends R[RI] extends ToManyRelationship<AnyResource> ? R[RI][number] : never,
    Q extends ApiQueryFiltersParameters<RR, S>,
    F extends ApiQueryResourceParameters<RR>
  >(
    id: ResourceId,
    relationshipFieldName: RI,
    query: Q = EMPTY_OBJECT as Q,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiCollectionResult<FilteredResource<RR, F>, any>> {
    const relationshipField: ToManyRelationshipField<RR['type']> = this.Resource.fields[
      relationshipFieldName
    ] as any

    return (this.fetchCollection(
      query as any,
      resourceFilter as any,
      id,
      `${id}/${relationshipFieldName}`,
      relationshipField.type,
    ) as unknown) as Promise<ApiCollectionResult<FilteredResource<RR, F>, any>>
  }

  private async fetchEntity<F extends ApiQueryResourceParameters<AnyResource>>(
    id: ResourceId,
    resourceFilter: F = EMPTY_OBJECT as F,
    relationshipPath: string = '',
    relationResourceType: ResourceType = '',
  ): Promise<ApiEntityResult<FilteredResource<AnyResource, F>, any>> {
    const queryParameters = new ApiQuery(this.api, { ...resourceFilter })
    const url = new URL(`${id}${relationshipPath}${String(queryParameters)}`, `${this}/`)

    const options = createGetRequestOptions()
    return new Promise(async (resolve, reject) => {
      this.api.controller.handleRequest(url, options).then((request) => {
        const result = request.flatMap((response) =>
          this.processResponse(response, response.data, resourceFilter, id, relationResourceType),
        )

        if (result.isSuccess()) {
          resolve(new ApiEntityResult(result.value, request.value.meta) as any)
        } else {
          reject(result.value)
        }
      })
    })
  }

  private async fetchCollection<
    Q extends ApiQueryFiltersParameters<AnyResource, S>,
    F extends ApiQueryResourceParameters<R>
  >(
    query: Q = EMPTY_OBJECT as Q,
    resourceFilter: F = EMPTY_OBJECT as F,
    id: ResourceId = '',
    relationshipPath: string = '',
    relationResourceType: ResourceType = '',
  ): Promise<ApiCollectionResult<FilteredResource<AnyResource, F>, any>> {
    const queryParameters = new ApiQuery(this.api, { ...query, ...resourceFilter })
    const url = new URL(
      `${relationshipPath}${String(queryParameters)}`,
      relationshipPath ? `${this}/` : this.toURL(),
    )

    return new Promise((resolve, reject) => {
      const options = createGetRequestOptions()
      this.api.controller.handleRequest(url, options).then((request) => {
        request.map((response) => {
          const errors: Array<Error> = []
          const values: Array<FilteredResource<R, F>> = []

          response.data.forEach((resource: any) => {
            const result = this.processResponse(
              response,
              resource,
              resourceFilter,
              id,
              relationResourceType,
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
            resolve(new ApiCollectionResult(values as Array<any>, response.meta))
          }
        })
      })
    })
  }

  private processResponse(
    response: any,
    resource: ResourceData<AnyResource>,
    resourceFilter: ApiQueryResourceParameters<AnyResource>,
    parentId: ResourceId = '',
    relationResourceType: ResourceType = '',
  ): Result<AnyResource | null, ApiError<any>[]> {
    if (relationResourceType) {
      if (response === null) {
        return Result.accept(null)
      }

      return this.api.controller.decodeResource(
        relationResourceType,
        resource,
        response.included,
        resourceFilter.fields,
        resourceFilter.include,
        [this.Resource.type, parentId, relationResourceType],
      )
    }

    return this.api.controller.decodeResource(
      this.Resource.type,
      resource,
      response.included,
      resourceFilter.fields,
      resourceFilter.include,
      [this.Resource.type, resource.id],
    )
  }

  toString(): string {
    // ensure trailing "/"
    const apiUrl = this.api.toString().replace(/\/*$/, '/')

    return `${apiUrl}${this.path}`
  }

  toURL(): URL {
    // ensure trailing "/"
    const apiUrl = this.api.toString().replace(/\/*$/, '/')

    return new URL(this.path, apiUrl)
  }
}

type ResourceFields<R, F> = R extends AnyResource
  ? F extends Array<keyof R>
    ? Pick<R, F[number] | ResourceIdentifierKey>
    : never
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
  : never

type BaseFilteredResourceOfType<T, R, I, F> = T extends keyof F
  ? ResourceIncludes<ResourceFields<R, F[T]>, I, F>
  : ResourceIncludes<R, I, F>

type BaseFilteredResource<R, I, F> = R extends AnyResource
  ? BaseFilteredResourceOfType<R['type'], R, I, F>
  : never

type FilteredToManyRelationship<R, I, F> = R extends Array<AnyResource>
  ? Array<BaseFilteredResource<R[number], I, F>>
  : never

export type FilteredResource<
  R extends AnyResource,
  Q extends ApiQueryResourceParameters<R>
> = BaseFilteredResource<R, Q['include'], Q['fields']>

type Warning<T extends string, U> = Error & {
  message: T
  value: U
}

// type NotAResourceWarning<T> = Warning<'Not a Resource', T>

export type ApiEndpointResource<E extends ApiEndpoint<any, any>> = E extends ApiEndpoint<
  infer R,
  any
>
  ? R
  : never

export type ApiEndpointSetup<T extends ApiEndpoint<any, any>> = T extends ApiEndpoint<any, infer S>
  ? S
  : never
