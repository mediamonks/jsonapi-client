import { isObject, isString, isArray, isUndefined, Predicate, isSome } from 'isntnt'

import {
  ClientResponseError,
  ResourceValidationError,
  ResourceValidationErrorObject,
} from '../../error'
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
  JSONAPILinksObject,
  JSONAPIMetaObject,
} from '../../types'
import {
  resourceType,
  parseResourceFields,
  resourceIdentifier,
  jsonapiDocument,
  resourceObject as resourceObjectType,
} from '../../util/types'
import { ResourceFieldFlag, ResourceField } from '../field'
import { AttributeField } from '../field/attribute'
import { RelationshipField } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'

const metaMap = new WeakMap<any, any>()
const linksMap = new WeakMap<any, any>()

const mapResourceData = <T extends ResourceFormatter<any, any>, U extends ResourceFilter<T>>(
  data: FilteredResource<T, U>,
  meta: JSONAPIMetaObject | null = null,
  links: JSONAPILinksObject | null = null,
): FilteredResource<T, U> => {
  metaMap.set(data, meta)
  linksMap.set(data, links)
  return data
}

export const getMeta = (
  value: FilteredResource<any, any> | ResourceIdentifier<any>,
): JSONAPIMetaObject => metaMap.get(value) ?? {}

export const getLinks = (
  value: FilteredResource<any, any> | ResourceIdentifier<any>,
): JSONAPILinksObject => linksMap.get(value) ?? {}

export const formatter = <T extends ResourceType, U extends ResourceFields>(type: T, fields: U) =>
  new ResourceFormatter(type, fields)

export class ResourceFormatter<T extends ResourceType, U extends ResourceFields> {
  readonly type: T
  readonly fields: U

  constructor(type: T, fields: U) {
    this.type = resourceType.parse(type) as T
    this.fields = parseResourceFields(fields)
  }

  identifier(id: ResourceId): ResourceIdentifier<T> {
    return new ResourceIdentifier(this.type, id)
  }

  filter<V extends ResourceFieldsQuery<this>, W extends ResourceIncludeQuery<this, V>>(
    fields: V,
    include: W,
  ): { fields: V; include: W } {
    assertFilter([this], fields as any, include, [])
    return { fields, include }
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ):
    | FilteredResource<ResourceFormatter<T, U>, V>
    | Array<FilteredResource<ResourceFormatter<T, U>, V>> {
    if (!jsonapiDocument.predicate(resourceDocument)) {
      throw new ResourceValidationError(`Invalid JSONAPIDocument`, resourceDocument, [])
    }

    if ('errors' in resourceDocument) {
      throw new ClientResponseError(
        `JSONAPIDocument Has Errors`,
        resourceDocument,
        resourceDocument.errors!,
      )
    }

    if ('data' in resourceDocument) {
      const included = resourceDocument.included
        ? resourceDocument.included.concat(resourceDocument.data)
        : []

      if (Array.isArray(resourceDocument.data)) {
        const errors: Array<ResourceValidationErrorObject> = []
        const resources: Array<any> = []
        resourceDocument.data.forEach((resourceObject, index) => {
          const [resource, validationErrors] = decodeResourceObject(
            [this],
            resourceObject,
            included,
            resourceFilter?.fields || ({} as any),
            resourceFilter?.include || {},
            [String(index)],
          )
          resources.push(resource)
          validationErrors.forEach((error) => errors.push(error))
          if (errors.length) {
            throw new ResourceValidationError(`Validation Error`, resources, validationErrors)
          }
        })
        return resources as any
      } else {
        const [resource, validationErrors] = decodeResourceObject(
          [this],
          resourceDocument.data,
          included,
          resourceFilter?.fields || ({} as any),
          resourceFilter?.include || {},
          [],
        )
        if (validationErrors.length) {
          throw new ResourceValidationError(`Validation Error`, resource, validationErrors)
        }
        return resource as any
      }
    }

    throw new Error(`Unexpected Error`)
  }

  createResourcePostObject(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): { data: JSONAPIResourceCreateObject<ResourceFormatter<T, U>> } {
    const createData: JSONAPIResourceCreateObject<ResourceFormatter<
      T,
      U
    >> = parseResourceIdentifier([this], data, false)
    return {
      data: Object.keys(this.fields).reduce((createData, fieldName) => {
        if (Object.hasOwnProperty.call(data, fieldName)) {
          const field = this.getField(fieldName)
          const value = data[fieldName as keyof typeof data]

          if (field.matches(ResourceFieldFlag.NeverPost)) {
            throw new Error(
              `Field ${fieldName} must be omitted when creating a resource of type ${this.type}`,
            )
          }

          if (value == null) {
            if (field.matches(ResourceFieldFlag.AlwaysPost)) {
              throw new Error(
                `Field ${fieldName} must be present when creating a resource of type ${this.type}`,
              )
            }
          }

          if (field.isAttributeField()) {
            const serializedValue = field.serialize(value)
            if (!field.predicate(serializedValue)) {
              throw new Error(
                `Invalid attribute value at ${fieldName} for resource of type ${this.type}`,
              )
            }
            if (field.root in createData) {
              ;(createData[field.root] as any)[fieldName] = serializedValue
            } else {
              ;(createData[field.root] as any) = { [fieldName]: serializedValue }
            }
          } else if (field.isRelationshipField()) {
            const relationshipFormatters = field.getResources()

            if (field.isToOneRelationshipField()) {
              if (Array.isArray(value)) {
                throw new Error(
                  `Relationship ${fieldName} must be a to-one resource identifier a resource of type ${this.type}`,
                )
              }
              const resourceIdentifier = parseResourceIdentifier(
                relationshipFormatters as any,
                value,
              )
              if (field.root in createData) {
                ;(createData[field.root] as any)[fieldName] = resourceIdentifier
              } else {
                ;(createData[field.root] as any) = {
                  [fieldName]: resourceIdentifier,
                }
              }
            } else if (field.isToManyRelationshipField()) {
              if (!Array.isArray(value)) {
                throw new Error(
                  `Relationship ${fieldName} must be a to-many resource identifier a resource of type ${this.type}`,
                )
              }
              const resourceIdentifiers = value.map((item: ResourceIdentifier<any>) =>
                parseResourceIdentifier(relationshipFormatters as any, item),
              )
              if (field.root in createData) {
                ;(createData[field.root] as any)[fieldName] = resourceIdentifiers
              } else {
                ;(createData[field.root] as any) = { [fieldName]: resourceIdentifiers }
              }
            }
          }
        }

        return createData
      }, createData),
    }
  }

  createResourcePatchObject(
    id: ResourceId,
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
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

const parseResourceIdentifier = <T extends ResourceType>(
  formatters: Array<ResourceFormatter<T, any>>,
  value: unknown,
  requiredId: boolean = true,
): ResourceIdentifier<T> | { type: T } => {
  if (!isObject(value)) {
    throw new Error('Resource must be an object')
  }
  if (!('type' in value)) {
    throw new Error(`Resource must have a type member`)
  }
  if (!formatters.some((formatter) => formatter.type === (value as any).type)) {
    throw new Error(`Resource type must match the type of its formatter`)
  }
  if (requiredId) {
    if (!('id' in value)) {
      throw new Error(`Resource must have an id member`)
    }
    if (!isString((value as any).id)) {
      throw new Error(`Resource id must be a string`)
    }
  }
  return requiredId
    ? {
        type: (value as any).type,
        id: (value as any).id,
      }
    : {
        type: (value as any).type,
      }
}

// Utils
// ResourceFilter

// A field with a NeverGet flag may not be included in a ResourceFilter
const isReadableField = (field: ResourceField<any, any>) =>
  !field.matches(ResourceFieldFlag.NeverGet)

// Only return fieldNames if every fieldName may be present in a ResourceFilter for resource
const parseResourceFieldsParam = (
  resource: ResourceFormatter<any, any>,
  fieldNames: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  fieldNames.forEach((fieldName) => {
    if (!resource.hasField(fieldName)) {
      throw new Error(`Field ${fieldName} does not exist`)
    }
    if (!isReadableField(resource.fields[fieldName])) {
      throw new Error(`Field ${fieldName} is not permitted to be used in a fields filter`)
    }
  })
  return fieldNames
}

// Get the combined ResourceFilter fieldNames for a collection of (relationship) resources
const getCombinedFilterResourceFields = (
  resources: Array<ResourceFormatter<any, any>>,
  fields: ResourceFieldsQuery<any>,
): ReadonlyArray<string> =>
  // No need for de-duplication because a field being present is the optimum path
  resources.flatMap((resource) =>
    resource.type in fields
      ? parseResourceFieldsParam(resource, (fields as any)[resource.type])
      : Object.keys(resource.fields).filter((fieldName) =>
          isReadableField(resource.fields[fieldName]),
        ),
  )

// Assert the legality of a ResourceFilter for a resources
const assertFilter = (
  formatters: Array<ResourceFormatter<any, any>>,
  sparseFieldsSet: ResourceFieldsQuery<any>,
  includeQuery: ResourceIncludeQuery<any>,
  pointer: ReadonlyArray<string>,
) => {
  const presentRelationshipFieldNames = getCombinedFilterResourceFields(
    formatters,
    sparseFieldsSet,
  ).filter((fieldName) =>
    formatters.some(
      (formatter) =>
        formatter.fields[fieldName].isRelationshipField() &&
        !formatter.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
    ),
  )

  Object.keys(includeQuery).forEach((fieldName) => {
    if (!presentRelationshipFieldNames.includes(fieldName)) {
      throw new Error(
        `Field "${pointer
          .concat([fieldName])
          .join('.')}" cannot be included because it is not present in the fields filter`,
      )
    }

    const formattersWithField = formatters.filter((formatter) => formatter.hasField(fieldName))
    if (!formattersWithField.length) {
      throw new Error(`Field "${fieldName}" does not exists`)
    }

    const formattersWithRelationshipField = formattersWithField.filter((formatter) =>
      formatter.getField(fieldName).isRelationshipField(),
    )
    if (!formattersWithRelationshipField.length) {
      throw new Error(`Field "${fieldName}" is not a relationship field`)
    }

    const childIncludeParam = includeQuery[fieldName]
    if (childIncludeParam !== null) {
      const relatedFormatters = [
        ...new Set(
          formattersWithRelationshipField.flatMap((resource) =>
            resource.getField(fieldName).getResources(),
          ),
        ),
      ]

      assertFilter(
        relatedFormatters,
        sparseFieldsSet,
        childIncludeParam as any,
        pointer.concat([fieldName]),
      )
    }
  })
}

// Impl.
type Result<T, U> = Success<T> | Failure<U>
type Success<T> = [T, readonly []]
type Failure<T> = [any, ReadonlyArray<T>]

/**
 * Get the combined (filtered) fieldNames from one or more ResourceFormatters.
 * @param formatters An Array where every element is a ResourceFormatter to which `fieldsFilter` may apply to.
 * @param fieldsFilter A ResourceFieldsQuery object that contains potential (filtered) resource fieldNames.
 * @returns A de-duplicated Array of (filtered) fieldNames present in its provided `formatters`.
 */
const getFilteredFieldNames = (
  formatters: Array<ResourceFormatter<any, any>>,
  fieldsFilter: ResourceFieldsQuery<any>,
  pointer: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  assertFilter(formatters, fieldsFilter, {}, pointer)
  return [
    // TODO: De-duplication may be optimized
    ...new Set(
      formatters.flatMap(
        (formatter) =>
          // If ResourceFormatter#type is present in the ResourceFieldsQuery, use those fieldNames...
          fieldsFilter[formatter.type] ||
          // ...otherwise use all 'gettable' fieldNames from the ResourceFormatter
          Object.keys(formatter.fields).filter(
            (fieldName) => !formatter.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
          ),
      ),
    ),
  ]
}

const decodeResourceObject = (
  formatters: Array<ResourceFormatter<any, any>>,
  resourceObject: JSONAPIResourceObject,
  included: Array<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery<any>,
  includeFilter: ResourceIncludeQuery<any, any>,
  pointer: ReadonlyArray<string>,
): Result<FilteredResource<any, any>, ResourceValidationErrorObject> => {
  if (!resourceObjectType.predicate(resourceObject)) {
    return validationFailure(
      resourceObject,
      'Invalid JSONAPIResourceObject',
      `The JSONAPIResourceObject data does not match its schema.`,
      pointer,
    )
  }

  const formatter = formatters.find((formatter) => formatter.type === resourceObject.type)
  if (!formatter) {
    return validationFailure(
      resourceObject,
      'Invalid resource type',
      `The data type does not match that of its formatters (${formatters}).`,
      pointer.concat(['type']),
    )
  }

  const fieldNames = getFilteredFieldNames(formatters, fieldsFilter, pointer)
    // Only use fieldNames that are relevant to the ResourceFormatter that matches the data type
    .filter((fieldName) =>
      formatter.type in fieldsFilter
        ? fieldsFilter[formatter.type]!.includes(fieldName)
        : fieldName in formatter.fields &&
          !formatter.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
    )

  const errors: Array<ResourceValidationErrorObject> = []
  const data: Record<string, any> = {
    type: resourceObject.type,
    id: resourceObject.id,
  }

  fieldNames.forEach((fieldName) => {
    const field: ResourceField<any, any> = formatter.fields[fieldName]
    if (field.isAttributeField()) {
      const [value, attributeErrors] = getAttributeResult(field, fieldName, resourceObject, pointer)
      data[fieldName] = value
      attributeErrors.forEach((error) => errors.push(error))
    }
    if (field.isRelationshipField()) {
      const [value, relationshipErrors] = getRelationshipResult(
        field,
        fieldName,
        resourceObject,
        pointer,
      )
      if (fieldName in includeFilter && !relationshipErrors.length) {
        if (isArray(value)) {
          data[fieldName] = []
          value.forEach((identifier: any) => {
            const includedRelatedResource = included.find(
              (item: unknown) =>
                (isObject as Predicate<any>)(item) &&
                item.type === identifier.type &&
                item.id === identifier.id,
            )
            if (!includedRelatedResource) {
              errors.push(
                createValidationError(
                  'Included Resource Not Found',
                  `Resource with type "${identifier.type}" and id "${identifier.id}" is not included`,
                  pointer.concat([fieldName]),
                ),
              )
            } else {
              const relatedResourceFormatters = field.getResources() as any
              const [relatedResource, relatedResourceErrors] = decodeResourceObject(
                relatedResourceFormatters,
                includedRelatedResource,
                included,
                fieldsFilter,
                includeFilter[fieldName] || ({} as any),
                pointer.concat([fieldName]),
              )
              data[fieldName].push(relatedResource)
              relatedResourceErrors.forEach((error) => errors.push(error))
            }
          })
        } else if (value) {
          const includedRelatedResource = included.find(
            (item: unknown) =>
              (isObject as Predicate<any>)(item) &&
              item.type === value.type &&
              item.id === value.id,
          )
          if (!includedRelatedResource) {
            errors.push(
              createValidationError(
                'Included Resource Not Found',
                `Resource with type "${value.type}" and id "${value.id}" is not included`,
                pointer.concat([fieldName]),
              ),
            )
          } else {
            const relatedResourceFormatters = field.getResources() as any
            const [relatedResource, relatedResourceErrors] = decodeResourceObject(
              relatedResourceFormatters,
              includedRelatedResource,
              included,
              fieldsFilter,
              includeFilter[fieldName] || ({} as any),
              pointer.concat([fieldName]),
            )
            data[fieldName] = relatedResource
            relatedResourceErrors.forEach((error) => errors.push(error))
          }
        }
      } else {
        data[fieldName] = value
        relationshipErrors.forEach((error) => errors.push(error))
      }
    }
  })

  return !errors.length
    ? success(mapResourceData(data as any, resourceObject.meta, resourceObject.links))
    : failure(errors, data)
}

const createValidationError = (
  title: string,
  detail: string,
  pointer: ReadonlyArray<string>,
): ResourceValidationErrorObject => {
  return {
    title,
    detail,
    source: {
      pointer,
    },
  }
}

const result = <T = any, U = any>(value: T, errors: Array<U> | []): Result<T, U> => [value, errors]
const success = <T = any>(value: T): Result<T, never> => [value, EMPTY_ARRAY as any]
const failure = <T = any>(errors: Array<T>, value: unknown = NOTHING): Failure<T> => [value, errors]

const validationFailure = (
  value: any,
  title: string,
  detail: string,
  pointer: ReadonlyArray<string>,
): Failure<ResourceValidationErrorObject> =>
  failure([createValidationError(title, detail, pointer)], value)

const NOTHING = null
const EMPTY_OBJECT = Object.freeze(Object.create(null)) as Record<any, unknown>
const EMPTY_ARRAY = Object.freeze([]) as ReadonlyArray<any>

/**
 * Get an attribute field Result from a JSONAPIResourceObject.
 * @param field An AttributeField to validate the attribute value.
 * @param fieldName The name of the `field`.
 * @param resourceObject A JSONAPIResourceObject to get the attribute from.
 * @param pointer A string Array representing a path up to the current attribute field.
 * @returns A Result with the attribute value or attribute validation errors.
 */
const getAttributeResult = (
  field: AttributeField<any, any, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  pointer: ReadonlyArray<string>,
): Result<any, ResourceValidationErrorObject> => {
  const value = (resourceObject.attributes || EMPTY_OBJECT)[fieldName]
  if (isSome(value)) {
    const validationErrors = field.validate(value)
    if (validationErrors.length) {
      console.log(fieldName, field.validate, validationErrors)
      const attributeFieldPointer = pointer.concat([fieldName])
      return failure(
        validationErrors.map((detail) =>
          createValidationError('Invalid Attribute Value', detail, attributeFieldPointer),
        ),
        value,
      )
    }
    return success(field.deserialize(value))
  }
  return field.matches(ResourceFieldFlag.MaybeGet)
    ? success(null)
    : validationFailure(
        value,
        `Required Attribute Not Found`,
        `Attribute value "${fieldName}" on resource of type ${resourceObject.type} is required.`,
        pointer.concat([fieldName]),
      )
}

const getRelationshipResult = (
  field: RelationshipField<any, any, any>,
  fieldName: string,
  resourceObject: JSONAPIResourceObject<any>,
  pointer: ReadonlyArray<string>,
): Result<any, any> => {
  const value = (resourceObject.relationships || EMPTY_OBJECT)[fieldName]
  const data = ((value as any) || EMPTY_OBJECT).data

  const relatedResourceFormatters: ReadonlyArray<ResourceFormatter<any, any>> = field.getResources()

  const parseResourceIdentifier = (
    data: unknown,
    id?: number,
  ): Result<ResourceIdentifier<any>, ResourceValidationErrorObject> => {
    if (!resourceIdentifier.predicate(data)) {
      return validationFailure(
        data,
        `Invalid Relationship Data`,
        `Relationship data "${fieldName}" on resource of type ${resourceObject.type} must be a resource identifier.`,
        pointer.concat(id === undefined ? [fieldName] : [fieldName, String(id)]),
      )
    }
    if (!relatedResourceFormatters.some((formatter) => formatter.type === data.type)) {
      return validationFailure(
        data,
        `Invalid Resource Identifier Type`,
        `Resource identifier "${fieldName}" type does not match the type of its formatter (${relatedResourceFormatters}).`,
        pointer.concat(id === undefined ? [fieldName] : [fieldName, String(id), data.type]),
      )
    }
    return success(new ResourceIdentifier(data.type, data.id))
  }

  if (field.isToOneRelationshipField()) {
    return isSome(data)
      ? parseResourceIdentifier(data)
      : field.matches(ResourceFieldFlag.MaybeGet)
      ? success(null)
      : validationFailure(
          data,
          `Required To-One Relationship Not Found`,
          `To-One relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer.concat([fieldName]),
        )
  }
  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.MaybeGet)
      ? success([])
      : validationFailure(
          data,
          `Required To-Many Relationship Not Found`,
          `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer.concat([fieldName]),
        )
  }
  if (!isArray(data)) {
    return validationFailure(
      data,
      `Invalid To-Many Relationship Data`,
      `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} must be an Array.`,
      pointer.concat([fieldName]),
    )
  }
  const resourceIdentifiers: Array<ResourceIdentifier<any>> = []
  const errors: Array<ResourceValidationErrorObject> = []
  data.forEach((item, index) => {
    const [resourceIdentifier, resourceIdentifierErrors] = parseResourceIdentifier(item, index)
    resourceIdentifiers.push(resourceIdentifier)
    resourceIdentifierErrors.forEach((error) => errors.push(error))
  })

  return errors.length === 0
    ? success(resourceIdentifiers)
    : failure(
        [
          createValidationError(
            `Invalid To-Many Relationship Data`,
            `To-Many relationship ${fieldName} on resource of type ${resourceObject.type} is not valid.`,
            pointer.concat([fieldName]),
          ),
        ].concat(errors),
        resourceIdentifiers,
      )
}
