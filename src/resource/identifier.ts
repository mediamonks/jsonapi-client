import { ResourceId, ResourceType } from '../types/jsonapi'
import { resourceId, resourceType } from '../util/validators'

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = resourceType.parse(type) as T
    this.id = resourceId.parse(id)
  }
}
