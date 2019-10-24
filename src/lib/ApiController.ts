import { isUndefined, isNone, Predicate, shape, isObject } from 'isntnt'

import { EMPTY_OBJECT } from '../constants/data'
import {
  createEmptyObject,
  createBaseResource,
  getRelationshipData,
  keys,
} from '../utils/data'
import { Result } from '../utils/Result'

import { Api } from './Api'
import { ApiEndpoint } from './ApiEndpoint'
import { ApiSetup } from './ApiSetup'
import { ApiQueryIncludeParameter, ApiQueryFieldsParameter } from './ApiQuery'
import {
  AnyResource,
  ResourceConstructor,
  ResourceAttributes,
  ResourceRelationships,
  ResourceType,
} from './Resource'
import { AttributeField } from './ResourceAttribute'
import { ResourceIdentifier } from './ResourceIdentifier'

const isDataWithAttributes = shape({ attributes: isObject })

type ApiEndpoints = Record<string, ApiEndpoint<AnyResource, any>>
type ApiResources = Record<string, ResourceConstructor<AnyResource>>

type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
}

const controllers: Record<string, ApiController<any>> = createEmptyObject()

type AttributeFieldValue<
  F extends AttributeField<any>
> = F extends AttributeField<infer T> ? T : never

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
  ): Result<AttributeFieldValue<F> | null, Error> {
    if (!isDataWithAttributes(data)) {
      return Result.reject(new Error(`Data must have an attributes object`))
    }

    const value = (data.attributes as any)[field.name]
    if (field.validate(value)) {
      return Result.accept(value)
    } else if (field.isOptionalAttribute() && isNone(value)) {
      return Result.accept(null)
    }
    return Result.reject(new Error(`Invalid value for attribute ${field.name}`))
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
    Resource: ResourceConstructor<R>,
    data: ResourceData<R>,
    included: Array<ResourceData<any>>,
    fieldsParam: ApiQueryFieldsParameter<any> = EMPTY_OBJECT,
    includeParam: ApiQueryIncludeParameter<any> = EMPTY_OBJECT,
    debug?: boolean,
  ): Result<R, any[]> {
    // Todo: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    included.push(data)

    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields)
    const errors: Array<any> = []
    const resource = fieldNames.reduce(
      (resource, name) => {
        const field = Resource.fields[name]
        if (field.isAttributeField()) {
          const result = this.getAttributeValue(data, field)
          if (result.isSuccess()) {
            resource[name] = result.value
          } else {
            errors.push(result.error)
          }
        } else if (field.isRelationshipField()) {
          const value = getRelationshipData(data.relationships, field)
          if (field.isToOneRelationship()) {
            if (
              !(field.validate as Predicate<ResourceIdentifier<any>>)(value)
            ) {
              console.warn(Resource.type, field.name, value)
              throw new Error(
                `invalid to-one relationship data for field ${field.name} of type ${Resource.type}`,
              )
            }
            if (isNone(value)) {
              resource[name] = null
            } else if (
              isNone(includeParam) ||
              isUndefined(includeParam[name])
            ) {
              resource[name] = value
            } else {
              const relationshipResource = this.getResource(value.type)
              const relationshipData = this.getIncludedResourceData(
                value,
                included,
              )

              const result = this.decodeResource(
                relationshipResource,
                relationshipData,
                included,
                fieldsParam,
                includeParam[field.name],
              )

              if (result.isSuccess()) {
                resource[name] = result.value
              } else {
                errors.push({ type: Resource.type, field: name })
              }
            }
          }
          if (field.isToManyRelationship()) {
            if (
              (field.validate as Predicate<Array<ResourceIdentifier<any>>>)(
                value,
              )
            ) {
              if (isNone(includeParam) || isUndefined(includeParam[name])) {
                resource[name] = value
              } else {
                const relationshipValues: Array<any> = []
                resource[name] = value.map((identifier) => {
                  const relationshipResource = this.getResource(identifier.type)
                  const relationshipData = this.getIncludedResourceData(
                    identifier,
                    included,
                  )
                  const result = this.decodeResource(
                    relationshipResource,
                    relationshipData,
                    included,
                    fieldsParam,
                    includeParam[field.name],
                  )

                  if (result.isSuccess()) {
                    relationshipValues.push(result.value)
                  } else {
                    errors.push({ type: Resource.type, field: name })
                  }
                })
                resource[name] = relationshipValues
              }
            } else {
              console.warn(Resource.type, field.name, value)
              throw new Error(
                `invalid to-one relationship data for field ${field.name} of type ${Resource.type}`,
              )
            }
          }
        }
        return resource
      },
      createBaseResource(Resource, data) as Record<string, any>,
    )

    debug && console.info('Resource', new Resource(resource as any))

    return errors.length
      ? Result.reject(errors)
      : Result.accept(new Resource(resource as any))
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
