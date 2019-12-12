import { isArray, isUndefined, isNone, isSome, isString } from 'isntnt'
import dedent from 'dedent'

import { EMPTY_OBJECT } from '../constants/data'
import { createEmptyObject, keys, createDataValue } from '../utils/data'
import { Result } from '../utils/Result'

import { Api } from './Api'
import { ApiError, ApiResponseError, ApiRequestError, ApiValidationError } from './ApiError'
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

type ApiResources = Record<string, ResourceConstructor<AnyResource>>

export type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
}

export class ApiController<S extends Partial<ApiSetup>> {
  api: Api<S>
  resources: ApiResources = createEmptyObject()

  constructor(api: Api<S>) {
    this.api = api
  }

  addResource<R extends AnyResource>(Resource: ResourceConstructor<R>): void {
    if (Resource.type in this.resources) {
      console.warn(`Duplicate resource ${Resource.type}.`)
    }
    ;(this.resources as any)[Resource.type] = Resource
  }

  getResource<T extends ResourceType>(type: T): ResourceConstructor<ResourceIdentifier<T>> {
    if (isUndefined(this.resources[type])) {
      throw new Error(`Resource of type "${type}" does not exist`)
    }
    return (this.resources as any)[type]
  }

  async handleRequest(url: URL, options: any): Promise<Result<any, ApiRequestError<any>[]>> {
    if (isNone(this.api.setup.adapter)) {
      throw new Error(dedent`No fetch adapter provided.
        When not running in a browser that doesn't support fetch, you need to provide polyfill fetch.
        When running in node, you can pass "node-fetch" as an adapter to the Api setup.
        If you want to mock, you can use "fetch-mock".
      `)
    }

    const request = await this.api.setup.adapter(url.href, this.api.setup.beforeRequest!(options))
    return request
      .json()
      .then((response): any => {
        return 'errors' in response
          ? Result.reject(response.errors.map(this.api.setup.parseRequestError))
          : Result.accept(response)
      })
      .catch((error) => Result.reject(new ApiRequestError('Invalid request', error)))
  }

  getAttributeValue<F extends AttributeField<any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: Array<string>,
  ): Result<AttributeValue, ApiError<any>> {
    // todo: attributes prop is not always optional, should it throw if its missing
    // when it should not?
    const attributes = data.attributes || EMPTY_OBJECT
    const value = field.name in attributes ? (attributes as any)[field.name] : null
    if (field.validate(value)) {
      return Result.accept(value)
    } else if (field.isOptionalAttribute() && isNone(value)) {
      return Result.accept(null)
    }
    return Result.reject(
      new ApiValidationError(
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
    // todo: relationships prop is not always optional, should it throw if its missing
    // when it should not?
    const relationships = data.relationships || EMPTY_OBJECT
    const value = (relationships as any)[field.name]
    if (isUndefined(value)) {
      return Result.accept(field.isToOneRelationship() ? null : [])
    }
    if (field.validate(value.data)) {
      return Result.accept(value.data)
    }
    const expectedValue = field.isToOneRelationship()
      ? `a Resource identifier or null`
      : 'an array of Resource identifiers'
    return Result.reject(
      new ApiValidationError(
        `Invalid relationship value, "${field.name}" must be ${expectedValue}`,
        value,
        pointer.concat(field.name),
      ),
    )
  }

  getIncludedResourceData(
    identifier: ResourceIdentifier<any>,
    included: Array<ResourceData<any>>,
    pointer: Array<string>,
  ): Result<ResourceData<any>, ApiError<any>[]> {
    const data = included.find(
      (resource) => resource.type === identifier.type && resource.id === identifier.id,
    )
    return isSome(data)
      ? Result.accept(data)
      : Result.reject([
          new ApiResponseError(
            `Expected Resource of type "${identifier.type}" with id "${identifier.id}" to be included`,
            identifier,
            pointer,
          ),
        ])
  }

  decodeResource<R extends AnyResource>(
    type: ResourceType,
    data: ResourceData<R>,
    included: Array<ResourceData<any>> = [],
    fieldsParam: ApiQueryFieldsParameter<any> = EMPTY_OBJECT,
    includeParam: ApiQueryIncludeParameter<any> = EMPTY_OBJECT,
    pointer: Array<string>,
  ): Result<R, ApiError<any>[]> {
    // Todo: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    included.push(data)

    const Resource = this.getResource(type)
    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields)

    const values: Record<string, any> = createEmptyObject()
    const errors: Array<ApiError<any>> = []

    if (type !== data.type) {
      errors.push(
        new ApiError(
          `Invalid type for Resource of type "${type}"`,
          data.type,
          pointer.concat('type'),
        ),
      )
    } else {
      values.type = type
    }

    if (!isString(data.id)) {
      errors.push(
        new ApiError(`Invalid id for Resource of type "${type}"`, data.id, pointer.concat('id')),
      )
    } else {
      values.id = data.id
    }

    fieldNames.forEach((name) => {
      const field = Resource.fields[name]

      if (isUndefined(field)) {
        throw new Error(`Resource of type "${type}" has no "${name}" fields`)
      }

      if (field.isAttributeField()) {
        const result = this.getAttributeValue(data, field, pointer).map((value) => {
          values[name] = value
        })
        if (result.isRejected()) {
          errors.push(result.value)
        }
      } else if (field.isRelationshipField()) {
        const relationshipData = this.getRelationshipData(data, field, pointer).map((value) => {
          if (isNone(value)) {
            values[name] = null
          } else if (isNone(includeParam) || isUndefined(includeParam[name])) {
            if (isArray(value)) {
              values[name] = value.map(
                (identifier) => new ResourceIdentifier(identifier.type, identifier.id),
              )
            } else {
              values[name] = new ResourceIdentifier(value.type, value.id)
            }
          } else if (isArray(value)) {
            values[name] = []
            value.map((identifier) => {
              const result = this.getIncludedResourceData(
                identifier,
                included,
                pointer.concat(field.name),
              )
                .flatMap((includedRelationshipData) => {
                  return this.decodeResource(
                    identifier.type,
                    includedRelationshipData,
                    included,
                    fieldsParam,
                    includeParam[field.name],
                    pointer.concat(field.name),
                  )
                })
                .map((relationshipResource) => {
                  values[name].push(relationshipResource)
                })
              if (result.isRejected()) {
                errors.push(...result.value)
              }
            })
          } else {
            const result = this.getIncludedResourceData(value, included, pointer.concat(field.name))
              .flatMap((includedRelationshipData) =>
                this.decodeResource(
                  value.type,
                  includedRelationshipData,
                  included,
                  fieldsParam,
                  includeParam[field.name],
                  pointer.concat(field.name),
                ),
              )
              .map((relationshipResource) => {
                values[name] = relationshipResource
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
    })

    return errors.length ? Result.reject(errors) : Result.accept(new Resource(values as any) as any)
  }

  encodeResource<R extends AnyResource>(
    type: ResourceType,
    values: R,
    fieldsNames: Array<string>,
    pointer: Array<string>,
  ): Result<any, ApiError<any>[]> {
    const errors: Array<ApiError<any>> = []
    const data: Record<string, any> = createEmptyObject()

    const Resource = this.getResource(type)

    if ('type' in values && values.type !== type) {
      errors.push(
        new ApiError(
          `Invalid id value for Resource of type ${type}`,
          values.id,
          pointer.concat('type'),
        ),
      )
    } else {
      data.type = type
    }

    if ('id' in values) {
      if (isString(values.id)) {
        data.id = values.id
      } else {
        errors.push(
          new ApiError(
            `Invalid id value for Resource of type ${type}`,
            values.id,
            pointer.concat('id'),
          ),
        )
      }
    }

    fieldsNames.forEach((name) => {
      if (name === 'id' || name === 'type') {
        return
      }
      const field = (Resource.fields as any)[name]
      if (isUndefined(field)) {
        throw new Error(`Field "${name}" does not exists on Resource of type ${type}`)
      }

      const value = (values as any)[name]
      if (isUndefined(value)) {
        return;
      }
      if (field.isAttributeField()) {
        if (field.validate(value)) {
          ;(data.attributes || (data.attributes = createEmptyObject()))[name] = value
        } else if (field.isRequiredAttribute() || isSome(value)) {
          errors.push(
            new ApiError(
              `Invalid attribute value at "${name}" for Resource of type ${type}`,
              value,
              pointer.concat(name),
            ),
          )
        }
      } else if (field.isRelationshipField()) {
        if (field.validate(value)) {
          ;(data.relationships || (data.relationships = createEmptyObject()))[
            name
          ] = createDataValue({
            data: isArray(value)
              ? value.map((identifier: any) =>
                  createDataValue({ type: identifier.type, id: identifier.id }),
                )
              : isNone(value)
              ? null
              : createDataValue({ type: value.type, id: value.id }),
          })
        } else if (name in values) {
          errors.push(
            new ApiError(
              `Invalid relationship data at "${name}" for Resource of type ${type}`,
              value,
              pointer.concat(name),
            ),
          )
        }
      }
    })

    return errors.length ? Result.reject(errors) : Result.accept({ data })
  }
}
