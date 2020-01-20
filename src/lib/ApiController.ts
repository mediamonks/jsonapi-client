import { isArray, isUndefined, isNone, isSome, isString } from 'isntnt'
import dedent from 'dedent'

import { EMPTY_OBJECT, ResourceDocumentKey, __DEV__, DebugErrorCode } from '../constants/data'
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
} from './Resource'
import { Attribute, AttributeValue, Relationship, RelationshipValue } from './ResourceField'
import { ResourceIdentifier } from './ResourceIdentifier'

export type ResourceData<R extends AnyResource> = ResourceIdentifier<R['type']> & {
  attributes: ResourceAttributes<R>
  relationships: ResourceRelationships<R>
}

export class ApiController<S extends Partial<ApiSetup>> {
  api: Api<S>
  constructor(api: Api<S>) {
    this.api = api
  }

  async handleRequest(options: any): Promise<Result<any, ApiRequestError<any>[]>> {
    if (isNone(this.api.setup.fetchAdapter)) {
      if (__DEV__) {
        throw new Error(dedent`No fetch adapter provided.
        When not running in a browser that doesn't support fetch, you need to provide polyfill fetch.
        When running in node, you can pass "node-fetch" as an adapter to the Api setup.
        If you want to mock, you can use "fetch-mock".
      `)
      }
      throw new Error(DebugErrorCode.MISSING_FETCH_ADAPTER as any)
    }

    const response = await this.api.setup.fetchAdapter((this.api.setup.beforeRequest!(
      options,
    ) as unknown) as Request)
    if (!response.ok) {
      throw new ApiResponseError(response.statusText, response.status)
    }
    return response
      .json()
      .then((data): any => {
        return ResourceDocumentKey.ERRORS in data
          ? Result.reject(data.errors.map(this.api.setup.parseRequestError))
          : Result.accept(data)
      })
      .catch((error) => Result.reject(new ApiResponseError(dedent`Invalid request`, error)))
  }

  getAttributeValue<F extends Attribute<any, any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: Array<string>,
  ): Result<AttributeValue, ApiError<any>> {
    // TODO: Attributes prop is not always optional, should it throw if its missing
    // when it should not?
    const attributes = data.attributes || EMPTY_OBJECT
    const value = (attributes as any)[field.name]
    if (field.isValid(value)) {
      return Result.accept(value)
    }
    return Result.reject(
      new ApiValidationError(
        dedent`Invalid attribute value at "${field.name}"`,
        value,
        pointer.concat(field.name),
      ),
    )
  }

  getRelationshipData<F extends Relationship<any, any>>(
    data: ResourceData<AnyResource>,
    field: F,
    pointer: Array<string>,
  ): Result<RelationshipValue, ApiError<any>> {
    // TODO: Relationships prop is not always optional, should it throw if its missing
    // when it should not?
    const relationships = data.relationships || EMPTY_OBJECT
    const value = (relationships as any)[field.name]
    if (isUndefined(value)) {
      return Result.accept(field.isToOneRelationship() ? null : [])
    }
    if (field.isValid(value.data)) {
      return Result.accept(value.data)
    }
    // TODO: Augment ApiValidationError feedback using RelationshipResourceField meta
    const expectedValue = field.isToOneRelationship()
      ? `a Resource identifier or null`
      : `an array of Resource identifiers`
    return Result.reject(
      new ApiValidationError(
        dedent`Invalid relationship value, "${field.name}" must be ${expectedValue}`,
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
      (resource) =>
        resource[ResourceDocumentKey.TYPE] === identifier[ResourceDocumentKey.TYPE] &&
        resource[ResourceDocumentKey.ID] === identifier[ResourceDocumentKey.ID],
    )
    return isSome(data)
      ? Result.accept(data)
      : Result.reject([
          new ApiResponseError(
            dedent`Resource of type "${identifier[ResourceDocumentKey.TYPE]}" with id "${
              identifier[ResourceDocumentKey.ID]
            }" is not be included`,
            identifier,
            pointer,
          ),
        ])
  }

  decodeResource<R extends AnyResource>(
    Resource: ResourceConstructor<R>,
    data: ResourceData<R>,
    included: Array<ResourceData<any>> = [],
    fieldsParam: ApiQueryFieldsParameter<any> = EMPTY_OBJECT,
    includeParam: ApiQueryIncludeParameter<any> = EMPTY_OBJECT,
    pointer: Array<string>,
  ): Result<R, ApiError<any>[]> {
    // TODO: should the data of a resource be added to the included data because
    // a relationship MAY depend on it?
    included.push(data)

    const fieldNames = fieldsParam[Resource.type] || keys(Resource.fields)
    const values: Record<string, any> = createEmptyObject()
    const errors: Array<ApiError<any>> = []

    if (Resource[ResourceDocumentKey.TYPE] !== data[ResourceDocumentKey.TYPE]) {
      errors.push(
        new ApiResponseError(
          dedent`Invalid type for Resource of type "${Resource[ResourceDocumentKey.TYPE]}"`,
          data[ResourceDocumentKey.TYPE],
          pointer.concat(ResourceDocumentKey.TYPE),
        ),
      )
    } else {
      values[ResourceDocumentKey.TYPE] = data[ResourceDocumentKey.TYPE]
    }

    if (!isString(data.id)) {
      errors.push(
        new ApiResponseError(
          dedent`Invalid id for Resource of type "${Resource[ResourceDocumentKey.TYPE]}"`,
          data[ResourceDocumentKey.ID],
          pointer.concat(ResourceDocumentKey.ID),
        ),
      )
    } else {
      values[ResourceDocumentKey.ID] = data[ResourceDocumentKey.ID]
    }

    fieldNames.forEach((name) => {
      const field = Resource.fields[name]

      if (isUndefined(field)) {
        if (__DEV__) {
          throw new Error(
            dedent`[ApiController#decodeResource] Resource of type "${
              Resource[ResourceDocumentKey.TYPE]
            }" has no "${name}" field`,
          )
        } else {
          throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any)
        }
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
          const RelationshipResource = field.getResource()
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
                    RelationshipResource,
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
                  RelationshipResource,
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
    Resource: ResourceConstructor<R>,
    values: R,
    fieldsNames: Array<string>,
    pointer: Array<string>,
  ): Result<any, ApiError<any>[]> {
    const errors: Array<ApiError<any>> = []
    const data: Record<string, any> = createEmptyObject()

    if (
      ResourceDocumentKey.TYPE in values &&
      values[ResourceDocumentKey.TYPE] !== Resource[ResourceDocumentKey.TYPE]
    ) {
      errors.push(
        new ApiError(
          dedent`Invalid type for Resource of type ${Resource.type}`,
          values[ResourceDocumentKey.TYPE],
          pointer.concat(ResourceDocumentKey.TYPE),
        ),
      )
    } else {
      data[ResourceDocumentKey.TYPE] = values[ResourceDocumentKey.TYPE]
    }

    if (ResourceDocumentKey.ID in values) {
      if (isString(values[ResourceDocumentKey.ID])) {
        data[ResourceDocumentKey.ID] = values[ResourceDocumentKey.ID]
      } else {
        errors.push(
          new ApiError(
            dedent`Invalid id value for Resource of type ${Resource.type}`,
            values[ResourceDocumentKey.ID],
            pointer.concat(ResourceDocumentKey.ID),
          ),
        )
      }
    }

    fieldsNames.forEach((name) => {
      const field = (Resource.fields as any)[name]
      if (isUndefined(field)) {
        if (__DEV__) {
          throw new Error(
            dedent`[ApiController#encodeResource] Resource of type "${Resource.type}" has no "${name}" field`,
          )
        } else {
          throw new Error(DebugErrorCode.FIELD_DOES_NOT_EXIST as any)
        }
      }

      const value = (values as any)[name]
      if (field.isAttributeField()) {
        if (field.isValid(value)) {
          ;(data.attributes || (data.attributes = createEmptyObject()))[name] = value
        } else if (field.isRequiredAttribute() || isSome(value)) {
          errors.push(
            new ApiError(
              `Invalid attribute at "${name}" for Resource of type ${Resource.type}`,
              value,
              pointer.concat(name),
            ),
          )
        }
      } else if (field.isRelationshipField()) {
        if (field.isValid(value)) {
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
              `Invalid relationship data at "${name}" for Resource of type ${Resource.type}`,
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
