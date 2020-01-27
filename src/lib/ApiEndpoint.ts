import dedent from 'dedent'
import { at, isArray, isNone, isUndefined } from 'isntnt'

import {
  __DEV__,
  EMPTY_OBJECT,
  DebugErrorCode,
  ResourceDocumentKey,
  EMPTY_ARRAY,
} from '../constants/data'
import { keys, createEmptyObject, RequestMethod } from '../utils/data'

import { ApiError } from './ApiError'
import { ApiClient } from './ApiClient'
import { ApiSetup } from './ApiSetup'
import {
  AnyResource,
  ResourceConstructor,
  ResourceCreateValues,
  ResourceId,
  ResourceToManyRelationshipName,
  ResourceToOneRelationshipName,
  ResourcePatchValues,
  ResourceParameters,
  FilteredResource,
} from './Resource'
import { ApiEntityResult, ApiCollectionResult } from './ApiResult'
import { PreventExcessiveRecursionError } from '../types/util'
import { SerializableObject } from '../types/data'
import {
  parseJSONAPIParameters,
  JSONAPIQueryParameters,
  JSONAPIResourceParameters,
} from '../utils/url'

const isToManyResponse = at(ResourceDocumentKey.DATA, isArray)

export class ApiEndpoint<R extends AnyResource, S extends Partial<ApiSetup>> {
  readonly client: ApiClient<S>
  readonly path: string
  readonly Resource: ResourceConstructor<R>

  constructor(client: ApiClient<S>, path: string, Resource: ResourceConstructor<R>) {
    this.client = client
    this.path = path.replace(/^\/*(.*?)\/*$/, '$1') // ensure leading nor trailing slash
    this.Resource = Resource
  }

  async create(
    values: ResourceCreateValues<R>,
  ): Promise<ApiEntityResult<FilteredResource<R, {}>, SerializableObject>> {
    const url = this.toURL()

    if (isUndefined(values.type)) {
      ;(values as any).type = this.Resource.type
    }
    return new Promise((resolve, reject) => {
      const result = this.client.controller.encodeResource(
        this.Resource as any,
        values as AnyResource,
        keys(this.Resource.fields),
        [],
      )

      if (result.isRejected()) {
        reject(result.value)
      }

      return result.map(async (data: any) => {
        return this.client.controller
          .handleRequest(url, RequestMethod.POST, data)
          .then((result) => {
            if (result.isSuccess()) {
              const response = result.value
              // TODO: handle 204 No Content response
              if (ResourceDocumentKey.DATA in response) {
                const result = this.client.controller.decodeResource(
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
                if (__DEV__) {
                  console.warn(`[ApiEndpoint#create] Unsupported "No Content" response`)
                }
                resolve(new ApiEntityResult(data, {} as any))
              }
            } else {
              reject(result.value)
            }
          })
      })
    })
  }

  async patch(id: ResourceId, values: ResourcePatchValues<R>): Promise<any> {
    const url = new URL(`${this}/${id}`)

    if (isUndefined(values[ResourceDocumentKey.ID])) {
      ;(values as any)[ResourceDocumentKey.ID] = id
    }
    return new Promise((resolve, reject) => {
      this.client.controller
        .encodeResource(
          this.Resource,
          values as any,
          keys(this.Resource.fields).filter((name) => name in values),
          [],
        )
        .map((data) => {
          this.client.controller.handleRequest(url, RequestMethod.PATCH, data).then((result) => {
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
    const url = new URL(`${this}/${id}`)
    return this.client.controller.handleRequest(url, RequestMethod.DELETE)
  }

  /**
   * Fetch a resource entity
   * /api/posts/123
   *
   * @param id
   * @param resourceParameters
   */
  async getOne<F extends ResourceParameters<R>>(
    id: ResourceId,
    resourceParameters: F | null = null,
  ): Promise<ApiEntityResult<FilteredResource<R, F>, SerializableObject>> {
    return this.fetchEntity(this.Resource, resourceParameters || EMPTY_OBJECT, [id])
  }

  /**
   * Fetch a 1-to-one relationship entity from a resource
   * /api/posts/<id>/<fieldName>
   *
   * @param id
   * @param fieldName
   * @param resourceParameters
   */
  async getToOneRelationship<
    T extends ResourceToOneRelationshipName<R>,
    F extends ResourceParameters<Extract<R[T], AnyResource>>
  >(
    id: ResourceId,
    fieldName: T,
    resourceParameters: F | null = null,
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
    return this.fetchEntity(RelationshipResource, resourceParameters || EMPTY_OBJECT, [
      id,
      this.client.setup.transformRelationshipForURL!(fieldName),
    ])
  }

  /**
   * Fetch a resource collection
   * /api/posts/
   *
   * @param queryParameters
   * @param resourceParameters
   */
  async getMany<F extends ResourceParameters<R>>(
    queryParameters: JSONAPIQueryParameters | null = null, // TODO: type query ('object') correctly
    resourceParameters: F | null = null,
  ): Promise<ApiCollectionResult<FilteredResource<R, F>, SerializableObject>> {
    return this.fetchCollection(
      this.Resource,
      queryParameters || EMPTY_OBJECT,
      resourceParameters || EMPTY_OBJECT,
      EMPTY_ARRAY,
    )
  }

  /**
   * Fetch a 1-to-many relationship collection from a resource
   * /api/posts/<id>/<fieldName>
   *
   * @param id
   * @param fieldName
   * @param queryParameters
   * @param resourceParameters
   */
  async getToManyRelationship<
    T extends ResourceToManyRelationshipName<R>,
    F extends ResourceParameters<R[T][any]>
  >(
    id: ResourceId,
    fieldName: T,
    queryParameters: JSONAPIQueryParameters | null = null, // TODO: type query ('object') correctly
    resourceParameters: F | null = null,
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
      queryParameters || EMPTY_OBJECT,
      resourceParameters || EMPTY_OBJECT,
      [id, this.client.setup.transformRelationshipForURL!(fieldName)],
    )
  }

  private async fetchEntity(
    Resource: ResourceConstructor<any>,
    resourceParameters: JSONAPIResourceParameters,
    path: ReadonlyArray<string>,
  ): Promise<ApiEntityResult<any, any>> {
    const url = new URL([this, ...path].join('/'))
    parseJSONAPIParameters(this.client, resourceParameters || EMPTY_OBJECT).forEach(
      ([name, value]) => {
        url.searchParams.append(name, value)
      },
    )

    return new Promise(async (resolve, reject) => {
      this.client.controller.handleRequest(url, RequestMethod.GET).then((request) => {
        const result = request.flatMap((response) =>
          this.client.controller.decodeResource(
            Resource,
            response.data,
            response.included || [],
            resourceParameters.fields || EMPTY_OBJECT,
            resourceParameters.include || EMPTY_OBJECT,
            EMPTY_ARRAY,
          ),
        )

        if (result.isSuccess()) {
          resolve(
            new ApiEntityResult(result.value, request.value.meta || createEmptyObject()) as any,
          )
        } else {
          reject(result.value)
        }
      })
    })
  }

  private async fetchCollection(
    Resource: ResourceConstructor<any>,
    query: JSONAPIQueryParameters,
    resourceFilter: ResourceParameters<any>,
    path: ReadonlyArray<string>,
  ): Promise<ApiCollectionResult<any, any>> {
    const url = new URL([this, ...path].join('/'))
    parseJSONAPIParameters(this.client, { ...query, ...resourceFilter }).forEach(
      ([name, value]) => {
        url.searchParams.append(name, value)
      },
    )

    return new Promise((resolve, reject) => {
      this.client.controller.handleRequest(url, RequestMethod.GET).then((result) => {
        if (result.isRejected()) {
          return reject(result.value)
        }

        result.map((response) => {
          const errors: Array<ApiError<any>> = []
          const values: Array<AnyResource> = []

          if (isToManyResponse(response)) {
            response.data.forEach((resource: any) => {
              const result = this.client.controller.decodeResource(
                Resource,
                resource,
                response.included || [],
                resourceFilter.fields || EMPTY_OBJECT,
                resourceFilter.include || EMPTY_OBJECT,
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
    return String(this.toURL())
  }

  toURL(): URL {
    const apiUrl = String(this.client).replace(/\/*$/, '/') // ensure trailing slash
    return new URL(this.path, apiUrl)
  }

  // LEGACY
  async get<F extends ResourceParameters<R>>(
    id: ResourceId,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiEntityResult<FilteredResource<R, F>, SerializableObject>> {
    if (__DEV__) {
      console.warn(
        dedent`ApiEndpoint#get is deprecated in favor of ApiEndpoint#getOne, use that instead`,
      )
    }
    return this.getOne(id, resourceFilter) as PreventExcessiveRecursionError
  }

  async fetch<F extends ResourceParameters<R>>(
    query: JSONAPIQueryParameters | null = null,
    resourceFilter: F = EMPTY_OBJECT as F,
  ): Promise<ApiCollectionResult<FilteredResource<R, F>, SerializableObject>> {
    if (__DEV__) {
      console.warn(
        dedent`ApiEndpoint#fetch is deprecated in favor of ApiEndpoint#getMany, use that instead`,
      )
    }
    return this.getMany(query, resourceFilter) as PreventExcessiveRecursionError
  }
}
