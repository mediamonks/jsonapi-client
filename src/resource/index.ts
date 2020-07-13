import {
  Resource as ResourceValues,
  ResourceConstructorData,
  ResourceCreateData,
  ResourceConstructor,
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

    constructor(data: ResourceConstructorData<T, U>) {
      Object.assign(this, data)
    }

    static identifier(id: ResourceId): ResourceIdentifier<T> {
      return { type, id }
    }

    static createFilter<
      V extends ResourceFieldsQuery<ResourceConstructor<T, U>>,
      W extends ResourceIncludeQuery<ResourceConstructor<T, U>, V>
    >(fields: V, include: W): { fields: V; include: W } {
      return { fields, include }
    }

    static parseResourceDocument(
      resourceDocument: JSONAPIDocument<ResourceConstructor<T, U>>,
    ): ResourceValues<ResourceConstructor<T, U>> {
      return {} as any
    }

    static createResourcePostObject(
      data: ResourceCreateData<ResourceConstructor<T, U>>,
    ): JSONAPIResourceObject<ResourceConstructor<T, U>> {
      return {} as any
    }

    static createResourcePatchObject(
      id: ResourceId,
      data: ResourcePatchData<ResourceConstructor<T, U>>,
    ): JSONAPIResourceObject<ResourceConstructor<T, U>> {
      return {} as any
    }
  } as ResourceConstructor<T, U>
}

export default resource
