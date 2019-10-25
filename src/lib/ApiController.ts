import { isArray, isUndefined, isNone, isObject, and } from 'isntnt'

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
import { RelationshipField, RelationshipValue } from './ResourceRelationship'

const has = <K extends PropertyKey>(key: K) =>
  and(isObject, (value: any): value is Record<K, any> => key in value)

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
      throw new Error(`Resource of type "${type}" does not exist`)
    }
    return (this.resources as any)[type]
  }

  createApiEndpoint<R extends AnyResource>(
    path: string,
    Resource: ResourceConstructor<R>,
  ): ApiEndpoint<R, S> {
    this.addResource(Resource)
    if (path in this.endpoints) {
      throw new Error(
        `Path "${path}" for Resource of type "${Resource.type}" already in use`,
      )
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
    pointer: Array<string>,
  ): Result<AttributeValue, ApiError<any>> {
    const attributes = data.attributes || EMPTY_OBJECT
    const value = (attributes as any)[field.name]
    if (field.validate(value)) {
      return Result.accept(value)
    } else if (field.isOptionalAttribute() && isNone(value)) {
      return Result.accept(null)
    }
    return Result.reject(
      new ApiError(
        `Invalid attribute value at "${field.name}"`,
        value,
        pointer.concat(field.name),
      ),
    )
  }

  getRelationshipData<F extends RelationshipField<any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: Array<string>,
  ): Result<RelationshipValue<AnyResource>, ApiError<any>> {
    const relationships = data.relationships || EMPTY_OBJECT
    const value = (relationships as any)[field.name]
    if (!hasData(value)) {
      return Result.reject(
        new ApiError(
          `Invalid relationship data, value at ${field.name} must have a data property`,
          value,
          pointer.concat(field.name),
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
    pointer: Array<string> = ['INCLUDED'],
  ): ResourceData<any> {
    const data = included.find(
      (resource) =>
        resource.type === identifier.type && resource.id === identifier.id,
    )
    if (isUndefined(data)) {
      throw new ApiError(
        `Expected Resource of type "${identifier.type}" with id "${identifier.id}" to be included`,
        identifier,
        pointer,
      )
    }
    return data
  }

  decodeResource<R extends AnyResource>(
    type: string,
    data: ResourceData<R>,
    included: Array<ResourceData<any>> = [],
    fieldsParam: ApiQueryFieldsParameter<any> = EMPTY_OBJECT,
    includeParam: ApiQueryIncludeParameter<any> = EMPTY_OBJECT,
    pointer: Array<string> = ['OOPS'],
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
        if (isUndefined(field)) {
          throw new Error(`Resource of type "${type}" has no "${name}" fields`)
        }

        if (field.isAttributeField()) {
          const result = this.getAttributeValue(data, field, pointer).map(
            (value) => {
              resource[name] = value
            },
          )
          if (result.isRejected()) {
            errors.push(result.value)
          }
        } else if (field.isRelationshipField()) {
          const relationshipData = this.getRelationshipData(
            data,
            field,
            pointer,
          ).map((value) => {
            if (isNone(value)) {
              resource[name] = null
            } else if (isNone(includeParam) || isNone(includeParam[name])) {
              if (isArray(value)) {
                resource[name] = value.map(
                  (identifier) =>
                    new ResourceIdentifier(identifier.type, identifier.id),
                )
              } else {
                resource[name] = new ResourceIdentifier(value.type, value.id)
              }
            } else if (isArray(value)) {
              resource[name] = []
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
                  pointer.concat(field.name),
                ).map((includedResource) => {
                  resource[name].push(includedResource)
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
                pointer.concat(field.name),
              ).map((includedResource) => {
                resource[name] = includedResource
              })
              if (result.isRejected()) {
                errors.push(...result.value)
              }
            }
          })
          if (relationshipData.isRejected()) {
            errors.push(relationshipData.value)
          }
        }
        return resource
      },
      createBaseResource(Resource, data) as Record<string, any>,
    )

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
