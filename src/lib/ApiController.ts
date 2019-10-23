import { isUndefined, isNone, Predicate } from 'isntnt'

import {
  createEmptyObject,
  createBaseResource,
  getAttributeValue,
  getRelationshipData,
  keys,
} from '../utils/data'
import { Api } from './Api'
import { ApiEndpoint } from './ApiEndpoint'
import { ApiSetup } from './ApiSetup'
import {
  AnyResource,
  ResourceConstructor,
  ResourceAttributes,
  ResourceRelationships,
  ResourceType,
} from './Resource'
import { ResourceIdentifier } from './ResourceIdentifier'

type ApiEndpoints = Record<string, ApiEndpoint<AnyResource, any>>
type ApiResources = Record<string, ResourceConstructor<AnyResource>>

type Fields = {
  [key: string]: Array<string>
}

type Included = {
  [key: string]: Included | null
}

type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
}

const controllers: Record<string, ApiController<any>> = createEmptyObject()
const emptyObject = createEmptyObject()

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
    fieldsParam: Fields = emptyObject,
    includeParam: Included = emptyObject,
    debug?: boolean,
  ) {
    // debug && console.info('decodeResource', Resource.type, data)
    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields)
    const result = fieldNames.reduce(
      (result, name) => {
        const field = Resource.fields[name]
        if (field.isAttributeField()) {
          result[name] = getAttributeValue(data.attributes, field)
        } else if (field.isRelationshipField()) {
          const value = getRelationshipData(data.relationships, field)
          if (field.isToOneRelationship()) {
            if (!(field.validate as Predicate<any>)(value)) {
              console.warn(Resource.type, field.name, value)
              throw new Error(
                `invalid to-one relationship data for field ${field.name} of type ${Resource.type}`,
              )
            }
            if (isNone(value)) {
              result[name] = null
            } else if (isUndefined(includeParam[name])) {
              result[name] = value
            } else {
              const relationshipResource = this.getResource(value.type)
              const relationshipData = this.getIncludedResourceData(
                value,
                included,
              )
              result[name] = this.decodeResource(
                relationshipResource,
                relationshipData,
                included,
                fieldsParam,
                includeParam[field.name] || emptyObject,
              )
            }
          }
          if (field.isToManyRelationship()) {
            if (
              (field.validate as Predicate<Array<ResourceIdentifier<any>>>)(
                value,
              )
            ) {
              if (isUndefined(includeParam[name])) {
                result[name] = value
              } else {
                result[name] = value.map((identifier) => {
                  const relationshipResource = this.getResource(identifier.type)
                  const relationshipData = this.getIncludedResourceData(
                    identifier,
                    included,
                  )
                  return this.decodeResource(
                    relationshipResource,
                    relationshipData,
                    included,
                    fieldsParam,
                    includeParam[field.name] || emptyObject,
                  )
                })
              }
            } else {
              console.warn(Resource.type, field.name, value)
              throw new Error(
                `invalid to-one relationship data for field ${field.name} of type ${Resource.type}`,
              )
            }
          }
        }
        return result
      },
      createBaseResource(Resource, data) as Record<string, any>,
    )
    debug && console.info('Resource', new Resource(result as any))
    return new Resource(result as any)
  }

  static add(api: Api<any>): void {
    const identifier = String(api.url)
    if (identifier in controllers) {
      throw new Error(`Duplicate api`)
    }
    controllers[identifier] = new ApiController(api)
  }

  static get<S extends Partial<ApiSetup>>(api: Api<S>): ApiController<S> {
    return controllers[String(api.url)]
  }
}
