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
} from '../../types'
import { resourceFieldName, resourceType, ResourceIdentifier } from '../identifier'
import { ResourceFieldRoot, ResourceFieldFlag, ResourceField } from '../field'
import Type from '../../type'

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
    return {} as any
  }

  createResourcePostObject(
    data: ResourceCreateData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
  }

  createResourcePatchObject(
    id: ResourceId,
    data: ResourcePatchData<ResourceFormatter<T, U>>,
  ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
    return {} as any
  }

  hasField(fieldName: string): boolean {
    return this.fields.hasOwnProperty(fieldName)
  }

  getField<V extends keyof U>(fieldName: V): U[V] {
    const field = this.fields[fieldName]
    return field
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
  resources: Array<ResourceFormatter<any, any>>,
  fields: ResourceFieldsQuery<any>,
  include: ResourceIncludeQuery<any>,
) => {
  const presentFieldNames = getCombinedFilterResourceFields(resources, fields)

  Object.keys(include).forEach((fieldName) => {
    if (!presentFieldNames.includes(fieldName)) {
      throw new Error(`Field ${fieldName} cannot be included because it is not present in fields`)
    }

    const resourcesWithField = resources.filter((resource) => resource.hasField(fieldName))
    if (!resourcesWithField.length) {
      throw new Error(`Field ${fieldName} does not exists`)
    }

    const resourcesWithRelationshipField = resourcesWithField.filter(
      (resource) => resource.getField(fieldName).root === ResourceFieldRoot.Relationships,
    )
    if (!resourcesWithRelationshipField.length) {
      throw new Error(`Field ${fieldName} is not a relationship field`)
    }

    const childIncludeParam = include[fieldName]
    if (childIncludeParam !== null) {
      const relatedResources = resourcesWithRelationshipField
        .flatMap((resource) => resource.getField(fieldName).getResources())
        // De-duplicate to prevent repeated workloads
        .filter((resource, _, target) => !target.includes(resource))

      assertFilter(relatedResources, fields, childIncludeParam as any)
    }
  })
}

// Type
export const parseResourceType = <T extends ResourceType>(type: T): T => {
  // TODO: Throw if type is invalid
  return type
}

const resourceField = Type.instance(ResourceField)

export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFields, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFields[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFields
  }, Object.create(null))
