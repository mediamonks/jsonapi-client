import {
  ResourceConstructorData,
  ResourceCreateData,
  ResourceFormatter,
  ResourceFields,
  ResourceId,
  ResourceIdentifier,
  ResourcePath,
  ResourceType,
  ResourcePatchData,
  JSONAPIDocument,
  ResourceIncludeQuery,
  ResourceFieldsQuery,
  JSONAPIResourceObject,
  FilteredResource,
  ResourceFilter,
} from '../types'

export const resource = <T extends ResourceType, U extends ResourceFields>(
  type: T,
  path: ResourcePath,
  fields: U,
) => {
  return class Resource {
    static type = type
    static path = path
    static fields = fields

    private constructor(data: ResourceConstructorData<T, U>) {
      Object.assign(this, data)
    }

    static identifier(id: ResourceId): ResourceIdentifier<T> {
      return { type, id }
    }

    static createFilter<
      V extends ResourceFieldsQuery<ResourceFormatter<T, U>>,
      W extends ResourceIncludeQuery<ResourceFormatter<T, U>, V>
    >(fields: V, include: W): { fields: V; include: W } {
      return { fields, include }
    }

    static withFilter<
      V extends ResourceFieldsQuery<ResourceFormatter<T, U>>,
      W extends ResourceIncludeQuery<ResourceFormatter<T, U>, V>
    >(fields: V, include: W): { fields: V; include: W } {
      return { fields, include }
    }

    static decode<V extends ResourceFilter<ResourceFormatter<T, U>>>(
      resourceDocument: JSONAPIDocument<ResourceFormatter<T, U>>,
      resourceFilter?: V,
    ): FilteredResource<ResourceFormatter<T, U>, V> {
      return {} as any
    }

    static createResourcePostObject(
      data: ResourceCreateData<ResourceFormatter<T, U>>,
    ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
      return {} as any
    }

    static createResourcePatchObject(
      id: ResourceId,
      data: ResourcePatchData<ResourceFormatter<T, U>>,
    ): JSONAPIResourceObject<ResourceFormatter<T, U>> {
      return {} as any
    }
  } as ResourceFormatter<T, U>
}
