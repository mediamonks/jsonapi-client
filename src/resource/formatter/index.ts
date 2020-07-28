import { isObject, isString, isArray, isUndefined, Predicate, isSome } from 'isntnt'

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
} from '../../types'
import {
  resourceType,
  parseResourceFields,
  resourceIdentifier,
  jsonapiDocument,
  resourceObject,
} from '../../util/types'
import { ResourceFieldFlag, ResourceField } from '../field'
import { AttributeField } from '../field/attribute'
import { RelationshipField } from '../field/relationship'
import { ResourceIdentifier } from '../identifier'

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
    assertFilter([this], fields as any, include)
    return { fields, include }
  }

  decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
    resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
    resourceFilter?: V,
  ): FilteredResource<ResourceFormatter<T, U>, V> {
    const [resource, errors] = decodeResourceDocument(
      this,
      resourceDocument,
      resourceFilter as any,
    ) as any
    console.log('err', errors)
    return resource
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
  fields: ResourceFieldsQuery<any>,
  include: ResourceIncludeQuery<any>,
) => {
  const presentFieldNames = getCombinedFilterResourceFields(formatters, fields)

  Object.keys(include).forEach((fieldName) => {
    if (!presentFieldNames.includes(fieldName)) {
      throw new Error(
        `Field "${fieldName}" cannot be included because it is not present in the fields filter`,
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

    const childIncludeParam = include[fieldName]
    if (childIncludeParam !== null) {
      const relatedFormatters = formattersWithRelationshipField
        .flatMap((resource) => resource.getField(fieldName).getResources())
        // De-duplicate to prevent repeated workloads
        .filter((resource, _, target) => !target.includes(resource))

      assertFilter(relatedFormatters, fields, childIncludeParam as any)
    }
  })
}

// Impl.
type Result<T, U> = [T, ReadonlyArray<U>]

const decodeResourceDocument = (
  formatter: ResourceFormatter<any, any>,
  document: JSONAPIDocument,
  resourceFilter: ResourceFilter<any> = {},
): Result<any, any> => {
  if (!jsonapiDocument.predicate(document)) {
    return validationFailure(
      `Invalid JSONAPIDocument`,
      `The JSONAPIDocument does not match its schema.`,
      [],
    )
  }

  if ('errors' in document) {
    throw new Error(`JSONAPIDocument has errors`)
  }

  if ('data' in document) {
    return decodeResourceObject(
      [formatter],
      document.data,
      (document.included || []).concat(document.data),
      resourceFilter.fields || {},
      resourceFilter.include || {},
      [],
    )
  }

  return validationFailure(`Unexpected Error`, `Something went wrong.`, [])
}

/**
 * Get the combined (filtered) fieldNames from one or more ResourceFormatters.
 * @param formatters An Array where every element is a ResourceFormatter to which `fieldsFilter` may apply to.
 * @param fieldsFilter A ResourceFieldsQuery object that contains potential (filtered) resource fieldNames.
 * @returns A de-duplicated Array of (filtered) fieldNames present in its provided `formatters`.
 */
const getFilteredFieldNames = (
  formatters: Array<ResourceFormatter<any, any>>,
  fieldsFilter: ResourceFieldsQuery<any>,
): ReadonlyArray<string> => {
  assertFilter(formatters, fieldsFilter, {})
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
  data: JSONAPIResourceObject,
  included: Array<JSONAPIResourceObject>,
  fieldsFilter: ResourceFieldsQuery<any>,
  includeFilter: ResourceIncludeQuery<any, any>,
  pointer: ReadonlyArray<string>,
): Result<any, any> => {
  if (!resourceObject.predicate(data)) {
    return validationFailure(
      'Invalid JSONAPIResourceObject',
      `The JSONAPIResourceObject data does not match its schema.`,
      pointer,
    )
  }

  const formatter = formatters.find((formatter) => formatter.type === data.type)
  if (!formatter) {
    return validationFailure(
      'Invalid resource type',
      `The data type does not match that of its formatters (${formatters}).`,
      pointer.concat(['type']),
    )
  }

  const fieldNames = getFilteredFieldNames(formatters, fieldsFilter)
    // Only use fieldNames that are relevant to the ResourceFormatter that matches the data type
    .filter((fieldName) =>
      formatter.type in fieldsFilter
        ? fieldsFilter[formatter.type]!.includes(fieldName)
        : fieldName in formatter.fields &&
          !formatter.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
    )

  const errors: Array<any> = []
  const resource: Record<string, any> = {
    type: data.type,
    id: data.id,
  }

  fieldNames.forEach((fieldName) => {
    const field: ResourceField<any, any> = formatter.fields[fieldName]
    if (field.isAttributeField()) {
      const [value, attributeErrors] = getAttributeResult(field, fieldName, data, pointer)
      resource[fieldName] = value
      attributeErrors.forEach((error) => errors.push(error))
    }
    if (field.isRelationshipField()) {
      const [value, relationshipErrors] = getRelationshipResult(field, fieldName, data, pointer)
      if (fieldName in includeFilter && !relationshipErrors.length) {
        if (isArray(value)) {
          resource[fieldName] = []
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
              resource[fieldName].push(relatedResource)
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
            resource[fieldName] = relatedResource
            relatedResourceErrors.forEach((error) => errors.push(error))
          }
        }
      } else {
        resource[fieldName] = value
        relationshipErrors.forEach((error) => errors.push(error))
      }
    }
  })

  return !errors.length ? success(resource) : failure(errors)
}

type ValidationError = ReturnType<typeof createValidationError>

const createValidationError = (title: string, detail: string, pointer: ReadonlyArray<string>) => {
  return {
    title,
    detail,
    source: {
      pointer,
    },
  }
}

const validationFailure = (
  title: string,
  detail: string,
  pointer: ReadonlyArray<string>,
): Result<typeof NOTHING, ValidationError> => [
  NOTHING,
  [createValidationError(title, detail, pointer)],
]

const success = <T = any>(value: any): Result<T, never> => [value, EMPTY_ARRAY as any]
const failure = <T = any>(errors: Array<T>): Result<typeof NOTHING, T> => [NOTHING, errors]

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
): Result<any, any> => {
  const value = (resourceObject.attributes || EMPTY_OBJECT)[fieldName]
  if (isSome(value)) {
    const validationErrors = field.validate(value)
    if (validationErrors.length) {
      const attributeFieldPointer = pointer.concat([fieldName])
      return failure(
        validationErrors.map((detail) =>
          createValidationError('Invalid Attribute Value', detail, attributeFieldPointer),
        ),
      )
    }
    return success(field.deserialize(value))
  }
  return field.matches(ResourceFieldFlag.MaybeGet)
    ? success(null)
    : validationFailure(
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

  const parseResourceIdentifier = (data: unknown, id?: number): Result<any, any> => {
    if (!resourceIdentifier.predicate(data)) {
      return validationFailure(
        `Invalid Relationship Data`,
        `Relationship data "${fieldName}" on resource of type ${resourceObject.type} must be a resource identifier.`,
        pointer.concat(id === undefined ? [fieldName] : [fieldName, String(id)]),
      )
    }
    if (!relatedResourceFormatters.some((formatter) => formatter.type === data.type)) {
      return validationFailure(
        `Invalid Resource Identifier Type`,
        `Resource identifier "${fieldName}" type does not match the type of its formatter (${relatedResourceFormatters}).`,
        pointer.concat(id === undefined ? [fieldName] : [fieldName, String(id)]),
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
          `Required To-One Relationship Not Found`,
          `To-One relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer.concat([fieldName]),
        )
  }
  if (isUndefined(data)) {
    return field.matches(ResourceFieldFlag.MaybeGet)
      ? success([])
      : validationFailure(
          `Required To-Many Relationship Not Found`,
          `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} is required.`,
          pointer.concat([fieldName]),
        )
  }
  if (!isArray(data)) {
    return validationFailure(
      `Invalid To-Many Relationship Data`,
      `To-Many relationship "${fieldName}" on resource of type ${resourceObject.type} must be an Array.`,
      pointer.concat([fieldName]),
    )
  }
  const resourceIdentifiers: Array<ResourceIdentifier<any>> = []
  const errors: Array<any> = []
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
      )
}
