import { OneResource, ManyResource } from '../client/result'
import {
  ResourceFields,
  ResourceFieldsQuery,
  ResourceId,
  ResourceIncludeQuery,
  ResourceType,
  ResourceFilter,
  JSONAPIDocument,
  FilteredResource,
  ResourceCreateData,
  JSONAPIResourceObject,
  ResourcePatchData,
  JSONAPIResourceCreateObject,
} from '../types'
import { resourceType, resourceIdentifier } from '../util/validators'
import { decodeDocument } from './formatter/decodeDocument'
import { parseResourceFields } from './formatter/parseResourceFields'
import { parseResourceFilter } from './formatter/parseResourceFilter'
import { ResourceIdentifier } from './identifier'
import { isNone, isArray, isString } from 'isntnt'
import { ResourceFieldFlag } from '../enum'
import { createValidationErrorObject, ResourceValidationErrorObject } from '../error'

export const formatter = <T extends ResourceType, U extends ResourceFields>(type: T, fields: U) =>
  new ResourceFormatter(type, fields)

export class ResourceFormatter<T extends ResourceType = any, U extends ResourceFields = any> {
  readonly type: T
  readonly fields: U

  constructor(type: T, fields: U) {
    this.type = resourceType.parse(type) as T
    this.fields = parseResourceFields(fields)
  }

  identifier(id: ResourceId): ResourceIdentifier<T> {
    return new ResourceIdentifier(this.type, id)
  }

  filter<V extends ResourceFieldsQuery<this>, W extends ResourceIncludeQuery<this>>(
    fields: V,
    include: W = {} as W,
  ): { fields: V; include: W } {
    return parseResourceFilter([this], { fields: fields as any, include }) as any
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ):
    | OneResource<FilteredResource<ResourceFormatter<T, U>, V>>
    | ManyResource<FilteredResource<ResourceFormatter<T, U>, V>> {
    return decodeDocument([this], resourceDocument, resourceFilter || ({} as any))
  }

  createResourcePostObject(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceCreateObject<ResourceFormatter<T, U>> } {
    if (data.type !== this.type) {
      throw new TypeError(`Invalid Type`)
    }
    if ('id' in data && !isString(data.id)) {
      throw new TypeError('Invalid Id')
    }
    Object.keys(data).forEach((key) => {
      if (key !== 'type' && key !== 'id' && !this.hasField(key)) {
        throw new Error(`Illegal Field "${key}" for Resource of Type "${this.type}"`)
      }
    })

    const body: any = 'id' in data ? { type: this.type, id: data.id } : { type: this.type }
    const errors: Array<ResourceValidationErrorObject> = []

    Object.keys(this.fields).forEach((key) => {
      const field = this.getField(key)
      const value = data[key as keyof typeof data]

      if (isNone(value)) {
        if (field.matches(ResourceFieldFlag.AlwaysPost)) {
          errors.push(
            createValidationErrorObject(
              `Missing POST Field`,
              `${
                field.isAttributeField() ? 'Attribute' : 'Relationship'
              } Field "${key}" is Required`,
              [key],
            ),
          )
        }
      } else {
        if (field.matches(ResourceFieldFlag.NeverPost)) {
          errors.push(
            createValidationErrorObject(`Invalid POST Field`, `Field has NeverPost flag`, [key]),
          )
        } else if (field.isAttributeField()) {
          const attributes = body.attributes || (body.attributes = {})
          const serializedValue = field.serialize(value)
          attributes[key] = serializedValue
          field.validate(serializedValue).forEach((detail) => {
            errors.push(createValidationErrorObject(`Invalid Attribute Value`, detail, [key]))
          })
        } else if (field.isRelationshipField()) {
          const relationships = body.relationships || (body.relationships = {})
          const resources = field.getResources()
          if (field.isToOneRelationshipField()) {
            if (!resourceIdentifier.predicate(value)) {
              relationships[key] = { data: value }
              errors.push(createValidationErrorObject(`Invalid Resource Identifier`, `todo`, [key]))
            } else if (!resources.some((resource) => resource.type === value.type)) {
              relationships[key] = { data: value }
              errors.push(
                createValidationErrorObject(`Invalid Resource Identifier Type`, `todo`, [key]),
              )
            }
            relationships[key] = { data: { type: value.type, id: value.id } }
          } else {
            if (!isArray(value)) {
              relationships[key] = { data: value }
              errors.push(
                createValidationErrorObject(
                  `Invalid To-Many Relationship Data`,
                  `To-Many Relationship data must be an Array`,
                  [key],
                ),
              )
            } else {
              relationships[key] = {
                data: value.map((item: unknown, index: number) => {
                  if (!resourceIdentifier.predicate(item)) {
                    errors.push(
                      createValidationErrorObject(`Invalid Resource Identifier`, `todo`, [
                        key,
                        String(index),
                      ]),
                    )
                    return item
                  } else if (!resources.some((resource) => resource.type === item.type)) {
                    errors.push(
                      createValidationErrorObject(`Invalid Resource Identifier Type`, `todo`, [
                        key,
                        String(index),
                      ]),
                    )
                    return item
                  }
                  return {
                    type: item.type,
                    id: item.id,
                  }
                }),
              }
            }
          }
        }
      }
    })

    if (errors.length) {
      throw errors // TODO
    }
    return { data: body }
  }

  createResourcePatchObject(
    id: ResourceId,
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceObject<ResourceFormatter<T, U>> } {
    if (data.type !== this.type) {
      throw new TypeError(`Invalid Type`)
    }
    if (!isString(id) || ('id' in data && data.id !== id)) {
      throw new TypeError('Invalid Id')
    }
    Object.keys(data).forEach((key) => {
      if (key !== 'type' && key !== 'id' && !this.hasField(key)) {
        throw new Error(`Illegal Field "${key}" for Resource of Type "${this.type}"`)
      }
    })

    const body: any = { id, type: this.type }
    const errors: Array<ResourceValidationErrorObject> = []

    Object.keys(this.fields).forEach((key) => {
      const field = this.getField(key)
      const value = data[key as keyof typeof data]

      if (isNone(value)) {
        if (field.matches(ResourceFieldFlag.AlwaysPatch)) {
          errors.push(
            createValidationErrorObject(
              `Missing PATCH Field`,
              `${
                field.isAttributeField() ? 'Attribute' : 'Relationship'
              } Field "${key}" is Required`,
              [key],
            ),
          )
        }
      } else {
        if (field.matches(ResourceFieldFlag.NeverPatch)) {
          errors.push(
            createValidationErrorObject(`Invalid PATCH Field`, `Field has NeverPatch flag`, [key]),
          )
        } else if (field.isAttributeField()) {
          const attributes = body.attributes || (body.attributes = {})
          const serializedValue = field.serialize(value)
          attributes[key] = serializedValue
          field.validate(serializedValue).forEach((detail) => {
            errors.push(createValidationErrorObject(`Invalid Attribute Value`, detail, [key]))
          })
        } else if (field.isRelationshipField()) {
          const relationships = body.relationships || (body.relationships = {})
          const resources = field.getResources()
          if (field.isToOneRelationshipField()) {
            if (!resourceIdentifier.predicate(value)) {
              relationships[key] = { data: value }
              errors.push(createValidationErrorObject(`Invalid Resource Identifier`, `todo`, [key]))
            } else if (!resources.some((resource) => resource.type === value.type)) {
              relationships[key] = { data: value }
              errors.push(
                createValidationErrorObject(`Invalid Resource Identifier Type`, `todo`, [key]),
              )
            }
            relationships[key] = { data: { type: value.type, id: value.id } }
          } else {
            if (!isArray(value)) {
              relationships[key] = { data: value }
              errors.push(
                createValidationErrorObject(
                  `Invalid To-Many Relationship Data`,
                  `To-Many Relationship data must be an Array`,
                  [key],
                ),
              )
            } else {
              relationships[key] = {
                data: value.map((item: unknown, index: number) => {
                  if (!resourceIdentifier.predicate(item)) {
                    errors.push(
                      createValidationErrorObject(`Invalid Resource Identifier`, `todo`, [
                        key,
                        String(index),
                      ]),
                    )
                    return item
                  } else if (!resources.some((resource) => resource.type === item.type)) {
                    errors.push(
                      createValidationErrorObject(`Invalid Resource Identifier Type`, `todo`, [
                        key,
                        String(index),
                      ]),
                    )
                    return item
                  }
                  return {
                    type: item.type,
                    id: item.id,
                  }
                }),
              }
            }
          }
        }
      }
    })

    if (errors.length) {
      throw errors // TODO
    }
    return { data: body }
  }

  hasField(fieldName: string): boolean {
    return Object.hasOwnProperty.call(this.fields, fieldName)
  }

  getField<V extends keyof U>(fieldName: V): U[V] {
    if (!this.hasField(fieldName as any)) {
      throw new Error(`Field ${fieldName} does not exist on resource of type ${this.type}`)
    }
    return this.fields[fieldName]
  }

  toString(): T {
    return this.type
  }
}
