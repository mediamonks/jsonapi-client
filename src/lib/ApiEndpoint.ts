import dedent from 'dedent'
import { at, isArray, isNone, isUndefined } from 'isntnt'

import { __DEV__, EMPTY_OBJECT, DebugErrorCode, ResourceDocumentKey } from '../constants/data'
import { keys, createEmptyObject, createRequestOptions, RequestMethod } from '../utils/data'
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
  ResourcePatchValues,
} from './Resource'
import { ResourceIdentifierKey, ResourceIdentifier } from './ResourceIdentifier'
import { ApiEntityResult, ApiCollectionResult } from './ApiResult'
import { PreventExcessiveRecursionError } from '../types/util'
import { SerializableObject } from '../types/data'

const isToManyResponse = at(ResourceDocumentKey.DATA, isArray)

export class ApiEndpoint<R extends AnyResource, S extends Partial<ApiSetup>> {
  readonly api: Api<S>
  readonly path: string
  readonly Resource: ResourceConstructor<R>

  constructor(api: Api<S>, path: string, Resource: ResourceConstructor<R>) {
    this.api = api
    this.path = path.replace(/^\/*(.*?)\/*$/, '$1') // ensure no leading nor trailing "/"
    this.Resource = Resource
  }

  async create(
    values: ResourceCreateValues<R>,
  ): Promise<ApiEntityResult<FilteredResource<R, {}>, any>> {
    const url = this.toURL()
    if (isUndefined(values.type)) {
      ;(values as any).type = this.Resource.type
    }
    return new Promise((resolve, reject) => {
      const result = this.api.controller.encodeResource(
        this.Resource as any,
        values as AnyResource,
        keys(this.Resource.fields),
        [],
      )

      if (result.isRejected()) {
        reject(result.value)
      }

      return result.map((body: any) => {
        const options = createRequestOptions(url, RequestMethod.POST, body)
        return this.api.controller.handleRequest(options).then((result) => {
          if (result.isSuccess()) {
            const response = result.value
            // TODO: handle 204 No Content response
            if (ResourceDocumentKey.DATA in response) {
              const result = this.api.controller.decodeResource(
                this.Resource as any,
                response.data,
                response.included,
                {},
                {},
                [],
              )
              if (result.isSuccess()) {
                return resolve(new ApiEntityResult(result.value, response.meta) as any)
              } else {
                return reject(result.value)
              }
            } else {
              console.warn(`Unsupported "No Content" response`)
              resolve(new ApiEntityResult(body, {} as any) as any)
            }
          } else {
            reject(result.value)
          }
        })
      })
    })
  }

  async patch(id: ResourceId, values: ResourcePatchValues<R>): Promise<any> {
    const url = new URL(`${this.path}/${id}`, this.api.url)
    if (isUndefined(values[ResourceDocumentKey.ID])) {
      ;(values as any)[ResourceDocumentKey.ID] = id
    }
    return new Promise((resolve, reject) => {
      this.api.controller
        .encodeResource(
          this.Resource,
          values as any,
          keys(this.Resource.fields).filter((name) => name in values),
          [],
        )
        .map((body) => {
          const options = createRequestOptions(url, RequestMethod.PATCH, body)
          this.api.controller.handleRequest(options).then((result) => {
            if (result.isSuccess()) {
              resolve(result.value)
            } else {
              reject(result.value)
            }
          })
        })
    })
  }

  async delete(id: ResourceId) {
    const url = new URL(`${this.path}/${id}`, this.api.url)
    const options = createRequestOptions(url, RequestMethod.DELETE)
    return this.api.controller.handleRequest(options)
  }

  /**
   * Get a single entity
   * /api/posts/123
   *
   * @param id
   * @param resourceFilter
   */
  async getOne<F extends ApiQueryResourceParameters<R>>(
    id: ResourceId,
    resourceQuery: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<R, F>, SerializableObject>> {
    return this.fetchEntity(this.Resource as ResourceConstructor<any>, resourceQuery, [
      id,
    ]) as PreventExcessiveRecursionError
  }

  async getToOneRelationship<
    T extends ResourceToOneRelationshipNames<R>,
    F extends ApiQueryResourceParameters<Extract<R[T], AnyResource>>
  >(
    id: ResourceId,
    fieldName: T,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<Extract<R[T], AnyResource>, F>, SerializableObject>> {
    const field = this.Resource.fields[fieldName]
    if (isNone(field)) {
      if (__DEV__) {
        throw new Error(
          dedent`[ApiEndpoint{${this.path}}#getToOneRelationship] Field "${fieldName}" does not exist on Resource of type "${this.Resource.type}`,
        )
      }
      throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any)
    }
    if (!field.isToOneRelationship()) {
      if (__DEV__) {
        throw new Error(
          dedent`[ApiEndpoint{${this.path}}#getToOneRelationship] Field "${fieldName}" is not a to-one relationship on Resource of type "${this.Resource.type}"`,
        )
      }
      throw new Error(DebugErrorCode.FIELD_OF_WRONG_TYPE as any)
    }
    const RelationshipResource = field.getResource()
    return this.fetchEntity(RelationshipResource, resourceFilter as any, [
      id,
      this.api.setup.transformRelationshipForURL!(fieldName),
    ]) as PreventExcessiveRecursionError
  }

  /**
   * Get a resource collection
   * /api/posts/
   *
   * @param query
   * @param resourceFilter
   */
  async getMany<F extends ApiQueryResourceParameters<R>>(
    query: object | null = EMPTY_OBJECT, // TODO: type query ('object') correctly
    resourceFilter: F | null = null,
  ): Promise<ApiCollectionResult<FilteredResource<R, F>, SerializableObject>> {
    return this.fetchCollection(
      this.Resource as ResourceConstructor<any>,
      query || EMPTY_OBJECT,
      resourceFilter || EMPTY_OBJECT,
    ) as PreventExcessiveRecursionError
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
    T extends ResourceToManyRelationshipNames<R>,
    F extends ApiQueryResourceParameters<R[T][any]>
  >(
    id: ResourceId,
    fieldName: T,
    query: object | null = EMPTY_OBJECT, // TODO: type query ('object') correctly
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiCollectionResult<FilteredResource<R[T][any], F>, SerializableObject>> {
    const field = this.Resource.fields[fieldName]
    if (isNone(field)) {
      if (__DEV__) {
        throw new Error(
          dedent`[ApiEndpoint{${this.path}}#getToManyRelationShip] Field "${fieldName}" does not exist on Resource of type "${this.Resource.type}`,
        )
      }
      throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any)
    }
    if (!field.isToManyRelationship()) {
      if (__DEV__) {
        throw new Error(
          dedent`[ApiEndpoint{${this.path}}#getToManyRelationShip] Field "${fieldName}" is not a to-many relationship on Resource of type "${this.Resource.type}"`,
        )
      }
      throw new Error(DebugErrorCode.FIELD_OF_WRONG_TYPE as any)
    }
    const RelationshipResource = field.getResource()
    return this.fetchCollection(
      RelationshipResource,
      query || EMPTY_OBJECT,
      resourceFilter as any,
      [id, this.api.setup.transformRelationshipForURL!(fieldName)],
    ) as PreventExcessiveRecursionError
  }

  private async fetchEntity<F extends ApiQueryResourceParameters<AnyResource>>(
    Resource: ResourceConstructor<AnyResource>,
    resourceFilter: F = EMPTY_OBJECT as F,
    path: Array<string> = [],
  ): Promise<ApiEntityResult<FilteredResource<AnyResource, F>, any>> {
    const queryParameters = new ApiQuery(this.api, resourceFilter as any)
    const url = new URL(`${path.join('/')}${String(queryParameters)}`, `${this}/`)

    const options = createRequestOptions(url, RequestMethod.GET)
    return new Promise(async (resolve, reject) => {
      this.api.controller.handleRequest(options).then((request) => {
        const result = request.flatMap((response) =>
          this.api.controller.decodeResource(
            Resource,
            response.data,
            response.included,
            resourceFilter.fields,
            resourceFilter.include,
            [],
          ),
        )

        if (result.isSuccess()) {
          resolve(new ApiEntityResult(
            result.value,
            request.value.meta || createEmptyObject(),
          ) as any)
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
    Resource: ResourceConstructor<AnyResource>,
    query: Q = EMPTY_OBJECT as Q,
    resourceFilter: F = EMPTY_OBJECT as F,
    path: Array<string> = [],
  ): Promise<ApiCollectionResult<FilteredResource<AnyResource, F>, any>> {
    const queryParameters = new ApiQuery(this.api, { ...query, ...resourceFilter })
    const url = new URL(
      `${path.join('/')}${String(queryParameters)}`,
      path.length ? `${this}/` : this.toURL(),
    )

    return new Promise((resolve, reject) => {
      const options = createRequestOptions(url, RequestMethod.GET)
      this.api.controller.handleRequest(options).then((request) => {
        request.map((response) => {
          const errors: Array<Error> = []
          const values: Array<FilteredResource<R, F>> = []

          if (isToManyResponse(response)) {
            response.data.forEach((resource: any) => {
              const result = this.api.controller.decodeResource(
                Resource,
                resource,
                response.included,
                resourceFilter.fields,
                resourceFilter.include,
                [Resource.type, resource.id],
              )

              if (result.isSuccess()) {
                values.push(result.value as any)
              } else {
                errors.push(...(result.value as any))
              }
            })
          } else if (__DEV__) {
            throw new Error(
              dedent`[ApiEndpoint{${this.path}}#fetchCollection] Invalid to-many response, data must be an Array`,
            )
          }

          if (errors.length) {
            reject(errors)
          } else {
            resolve(new ApiCollectionResult(values as Array<any>, response.meta || {}))
          }
        })
      })
    })
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

  // LEGACY
  async get<F extends ApiQueryResourceParameters<R>>(
    id: ResourceId,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<R, F>, any>> {
    if (__DEV__) {
      console.warn(
        dedent`ApiEndpoint#get is deprecated in favor of ApiEndpoint#getOne, use that instead`,
      )
    }
    return this.getOne(id, resourceFilter) as PreventExcessiveRecursionError
  }

  async fetch<F extends ApiQueryResourceParameters<R>>(
    query: object | null = EMPTY_OBJECT,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiCollectionResult<FilteredResource<R, F>, any>> {
    if (__DEV__) {
      console.warn(
        dedent`ApiEndpoint#fetch is deprecated in favor of ApiEndpoint#getMany, use that instead`,
      )
    }
    return this.getMany(query as any, resourceFilter as any) as any
  }
}

type ResourceFields<R, F> = R extends AnyResource
  ? F extends ReadonlyArray<keyof R>
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
        ? Warning<'Invalid include parameter: not a relationship field', K>
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

export type ApiEndpointResource<E extends ApiEndpoint<any, any>> = E extends ApiEndpoint<
  infer R,
  any
>
  ? R
  : never

export type ApiEndpointSetup<T extends ApiEndpoint<any, any>> = T extends ApiEndpoint<any, infer S>
  ? S
  : never
