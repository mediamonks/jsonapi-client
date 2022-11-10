import { ResourceIdentifier } from '../resource/identifier'
import { ResourceId, ResourceType } from '../types/jsonapi'

class Resource<T extends ResourceType> extends ResourceIdentifier<T> {}

/** @hidden */
export const createBaseResource = (type: ResourceType, id: ResourceId) => new Resource(type, id)

/**
 * @hidden
 * Create object with Resource constructor to be consistent with ResourceIdentifier objects
 * */
export const cloneResource = <T extends Resource<any>>(resource: T): T =>
  Object.assign(Object.create(Resource.prototype), resource)
