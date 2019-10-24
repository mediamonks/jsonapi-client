import { isUndefined, isNone, shape, isObject, and } from 'isntnt'

import { EMPTY_OBJECT } from '../constants/data'
import { createEmptyObject, createBaseResource, keys } from '../utils/data'
import { Result } from '../utils/Result'

import { Api } from './Api'
import { ApiEndpoint } from './ApiEndpoint'
import { ApiError } from './ApiError'
import { ApiSetup } from './ApiSetup'
import { ApiQueryIncludeParameter, ApiQueryFieldsParameter } from './ApiQuery'
import {
  AnyResource,
  ResourceConstructor,
  ResourceAttributes,
  ResourceRelationships,
  ResourceType,
} from './Resource'
import { AttributeField, AttributeValue } from './ResourceAttribute'
import { ResourceIdentifier } from './ResourceIdentifier'
import { RelationshipField } from '../../dist/src'
import { RelationshipValue } from './ResourceRelationship'
import { isArray } from 'util'

const has = <K extends PropertyKey>(key: K) =>
  and(isObject, (value: any): value is Record<K, any> => key in value)

const isDataWithAttributes = shape({ attributes: isObject })
const isDataWithRelationships = shape({ relationships: isObject })
const hasData = has('data')

type ApiEndpoints = Record<string, ApiEndpoint<AnyResource, any>>
type ApiResources = Record<string, ResourceConstructor<AnyResource>>

type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
}

const controllers: Record<string, ApiController<any>> = createEmptyObject()

export class ApiController<S extends Partial<ApiSetup>> {
  api: Api<S>
  endpoints: ApiEndpoints = createEmptyObject()
  resources: ApiResources = createEmptyObject()

  constructor(api: Api<S>) {
    this.api = api
  }

  addResource<R extends AnyResource>(Resource: ResourceConstructor<R>): void {
    if (Resource.type in this.resources) {
      throw new Error(`Duplicate resource ${Resource.type}`)
    }
    ;(this.resources as any)[Resource.type] = Resource
  }

  getResource<T extends ResourceType>(
    type: T,
  ): ResourceConstructor<ResourceIdentifier<T>> {
    if (isUndefined(this.resources[type])) {
      throw new Error(`Resource of type ${type} does not exist`)
    }
    return (this.resources as any)[type]
  }

  createApiEndpoint<R extends AnyResource>(
    path: string,
    Resource: ResourceConstructor<R>,
  ): ApiEndpoint<R, S> {
    this.addResource(Resource)
    if (path in this.endpoints) {
      throw new Error(`Duplicate endpoint ${path}`)
    }
    return new ApiEndpoint(this.api, path, Resource)
  }

  async handleRequest(url: URL, options: any): Promise<any> {
    const request = await fetch(url.href, options)
    return request.json()
  }

  getAttributeValue<F extends AttributeField<any>>(
    data: ResourceData<AnyResource>,
    field: F,
  ): Result<AttributeValue, ApiError<any>> {
    if (!isDataWithAttributes(data)) {
      return Result.reject(
        new ApiError(
          `Invalid resource data, attributes must be an object`,
          data,
          [field.name],
        ),
      )
    }
    const value = (data.attributes as any)[field.name]
    if (field.validate(value)) {
      return Result.accept(value)
    } else if (field.isOptionalAttribute() && isNone(value)) {
      return Result.accept(null)
    }
    return Result.reject(
      new ApiError(`Invalid "${field.name}" attribute value`, value),
    )
  }

  getRelationshipData<F extends RelationshipField<any>>(
    data: ResourceData<AnyResource>,
    field: F,
  ): Result<RelationshipValue<AnyResource>, Error> {
    if (!isDataWithRelationships(data)) {
      return Result.reject(
        new ApiError(
          `Invalid resource data, relationships must be an object`,
          data,
          [field.name],
        ),
      )
    }
    const value = (data.relationships as any)[field.name]
    if (!hasData(value)) {
      return Result.reject(
        new ApiError(
          `Invalid relationship data, value at ${field.name} must have a data property`,
          data,
          [field.name],
        ),
      )
    }
    if (!field.validate(value.data)) {
      const expectedValue = field.isToOneRelationship()
        ? `a Resource identifier or null`
        : 'an array of Resource identifiers'
      return Result.reject(
        new ApiError(
          `Invalid relationship value, ${field.name} must be ${expectedValue}`,
          data,
          [field.name],
        ),
      )
    }
    return Result.accept(value.data)
  }

  getIncludedResourceData(
    identifier: ResourceIdentifier<any>,
    included: Array<ResourceData<any>>,
  ): ResourceData<any> {
    const data = included.find(
      (resource) =>
        resource.type === identifier.type && resource.id === identifier.id,
    )
    if (isUndefined(data)) {
      console.log(identifier.type, identifier.id, included)
      throw new Error(
        `Expected Resource of type "${identifier.type}" with id "${identifier.id}" to be included`,
      )
    }
    return data
  }

  decodeResource<R extends AnyResource>(
    type: string,
    data: ResourceData<R>,
    included: Array<ResourceData<any>>,
    fieldsParam: ApiQueryFieldsParameter<any> = EMPTY_OBJECT,
    includeParam: ApiQueryIncludeParameter<any> = EMPTY_OBJECT,
    debug?: boolean,
  ): Result<R, ApiError<any>[]> {
    // Todo: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    included.push(data)

    const Resource = this.getResource(type)
    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields)
    const errors: Array<ApiError<any>> = []
    const resource = fieldNames.reduce(
      (resource, name) => {
        const field = Resource.fields[name]
        if (field.isAttributeField()) {
          const result = this.getAttributeValue(data, field).map((value) => {
            resource.name = value
          })
          if (result.isRejected()) {
            errors.push(result.value)
          }
        } else if (field.isRelationshipField()) {
          const relationshipData = this.getRelationshipData(data, field).map(
            (value) => {
              if (
                isNone(value) ||
                isNone(includeParam) ||
                isUndefined(includeParam[name])
              ) {
                resource[name] = value
              } else if (isArray(value)) {
                value.map((identifier) => {
                  const includedRelationshipData = this.getIncludedResourceData(
                    identifier,
                    included,
                  )
                  const result = this.decodeResource(
                    identifier.type,
                    includedRelationshipData,
                    included,
                    fieldsParam,
                    includeParam[field.name],
                  ).map((resource) => {
                    resource[name] = resource
                  })
                  if (result.isRejected()) {
                    errors.push(...result.value)
                  }
                })
              } else {
                const includedRelationshipData = this.getIncludedResourceData(
                  value,
                  included,
                )
                const result = this.decodeResource(
                  value.type,
                  includedRelationshipData,
                  included,
                  fieldsParam,
                  includeParam[field.name],
                ).map((resource) => {
                  resource[name] = resource
                })
                if (result.isRejected()) {
                  errors.push(...result.value)
                }
              }
            },
          )
        }
        return resource
      },
      createBaseResource(Resource, data) as Record<string, any>,
    )

    debug && console.info('Resource', new Resource(resource as any))

    return errors.length
      ? Result.reject(errors)
      : Result.accept(new Resource(resource as any) as any)
  }

  static add(api: Api<any>): void {
    const identifier = String(api.url)
    if (identifier in controllers) {
      throw new Error(`Duplicate api href`)
    }
    controllers[identifier] = new ApiController(api)
  }

  static get<S extends Partial<ApiSetup>>(api: Api<S>): ApiController<S> {
    return controllers[String(api.url)]
  }
}
